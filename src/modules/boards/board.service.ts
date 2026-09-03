import type { Logger } from 'pino';
import type {
  CreateListInput,
  UpdateListInput,
  UpdateListPositionsInput,
  CreateCardInput,
  UpdateCardInput,
  UpdateCardPositionsInput,
  BoardDataResponse,
  ListWithCardsResponse,
  CardResponse,
  CardHistoryResponse,
} from '../../contracts/index';
import {
  Card,
  CardHistory,
  List,
  CardHistoryRepository,
  CardRepository,
  ListRepository,
  WorkspaceMember,
  WorkspaceMemberRepository,
  type CardWithCount,
  type TransactionManager,
  type WorkspaceRepository,
} from '../../db/index';
import type { FilesService } from '../files/files.service';

const TRACKED_FIELDS = [
  'content',
  'description',
  'priority',
  'label',
  'progress',
  'due_date',
  'cover_url',
  'story_points',
  'estimated_hours',
] as const;

type TrackedField = (typeof TRACKED_FIELDS)[number];

export class BoardService {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly cardRepository: CardRepository,
    private readonly memberRepository: WorkspaceMemberRepository,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly cardHistoryRepository: CardHistoryRepository,
    private readonly filesService: FilesService,
    private readonly transactionManager: TransactionManager,
    private readonly logger: Logger,
  ) {}

  async getBoardData(userId: string, workspaceId: string): Promise<BoardDataResponse> {
    await this.memberRepository.assertMember(userId, workspaceId);

    const [fullData, lists] = await Promise.all([
      this.workspaceRepository.findFullData(workspaceId),
      this.listRepository.findByWorkspace(workspaceId),
    ]);

    const { workspace, members, tags, priorities } = fullData;
    const allCards = lists.flatMap((l) => l.cards ?? []);
    const coverKeys = allCards.filter((c) => c.cover_url).map((c) => c.cover_url!);
    const coverUrlMap = await this.filesService.resolveUrls(coverKeys);

    return {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        created_by: workspace.created_by,
        created_at: workspace.created_at.toISOString(),
        updated_at: workspace.updated_at.toISOString(),
      },
      lists: lists.map((l) => toListWithCardsResponse(l, coverUrlMap)),
      members: members.map((m) => ({
        id: m.id,
        workspace_id: m.workspace_id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at.toISOString(),
      })),
      tags: tags.map((t) => ({
        id: t.id,
        workspace_id: t.workspace_id,
        name: t.name,
        color: t.color,
        created_at: t.created_at.toISOString(),
      })),
      priorities: priorities.map((p) => ({
        id: p.id,
        workspace_id: p.workspace_id,
        name: p.name,
        color: p.color,
        icon: p.icon,
        position: p.position,
        created_at: p.created_at.toISOString(),
      })),
    };
  }

  async createList(userId: string, workspaceId: string, input: CreateListInput): Promise<ListWithCardsResponse> {
    await this.memberRepository.assertMember(userId, workspaceId);
    const list = await this.listRepository.create(userId, { ...input, workspace_id: workspaceId });
    return toListWithCardsResponse(list);
  }

  async updateList(userId: string, listId: string, input: UpdateListInput): Promise<ListWithCardsResponse> {
    const list = await this.listRepository.findByIdOrFail(listId);
    await this.memberRepository.assertMember(userId, list.workspace_id);
    const updated = await this.listRepository.update(listId, input);
    return toListWithCardsResponse(updated);
  }

  async updateListPositions(userId: string, workspaceId: string, updates: UpdateListPositionsInput): Promise<void> {
    await this.memberRepository.assertMember(userId, workspaceId);
    await this.listRepository.updatePositions(updates);
  }

  async deleteList(userId: string, listId: string): Promise<void> {
    const list = await this.listRepository.findByIdOrFail(listId);
    await this.memberRepository.assertMember(userId, list.workspace_id);
    await this.listRepository.delete(listId);
    this.logger.info({ listId, userId }, 'List deleted');
  }

  async createCard(userId: string, input: CreateCardInput): Promise<CardResponse> {
    const list = await this.listRepository.findByIdOrFail(input.list_id);
    await this.memberRepository.assertMember(userId, list.workspace_id);

    const card = await this.transactionManager.runInTransaction(async (manager) => {
      const cardRepository = new CardRepository(manager.getRepository(Card));
      const cardHistoryRepository = new CardHistoryRepository(manager.getRepository(CardHistory));
      const createdCard = await cardRepository.create(userId, input);
      await cardHistoryRepository.record({
        card_id: createdCard.id,
        created_by: userId,
        action_type: 'created',
        field: 'card',
      });
      return createdCard;
    });

    const response = toCardResponse(card);
    response.cover_url = await this.filesService.resolveUrl(card.cover_url);
    return response;
  }

  async updateCard(userId: string, cardId: string, input: UpdateCardInput): Promise<CardResponse> {
    const card = await this.cardRepository.findByIdOrFail(cardId);
    const list = await this.listRepository.findByIdOrFail(card.list_id);
    await this.memberRepository.assertMember(userId, list.workspace_id);

    const historyEntries: Array<Parameters<CardHistoryRepository['record']>[0]> = [];

    if (input.assignee_id !== undefined && input.assignee_id !== card.assignee_id) {
      historyEntries.push({
        card_id: cardId,
        created_by: userId,
        action_type: 'assigned',
        field: 'assignee',
        old_val: card.assignee_id ?? undefined,
        new_val: input.assignee_id ?? undefined,
      });
    }

    if (input.list_id !== undefined && input.list_id !== card.list_id) {
      const newList = await this.listRepository.findByIdOrFail(input.list_id);
      historyEntries.push({
        card_id: cardId,
        created_by: userId,
        action_type: 'moved',
        field: newList.title,
      });
    }

    for (const field of TRACKED_FIELDS) {
      if (!(field in input) || input[field] === undefined) continue;
      const oldVal = card[field as TrackedField];
      const newVal = input[field as TrackedField];
      const oldStr = toComparable(oldVal);
      const newStr = toComparable(newVal);
      if (oldStr !== newStr) {
        historyEntries.push({
          card_id: cardId,
          created_by: userId,
          action_type: 'updated',
          field,
          old_val: oldStr || undefined,
          new_val: newStr || undefined,
        });
      }
    }

    const updated = await this.transactionManager.runInTransaction(async (manager) => {
      const cardRepository = new CardRepository(manager.getRepository(Card));
      const cardHistoryRepository = new CardHistoryRepository(manager.getRepository(CardHistory));
      const updatedCard = await cardRepository.update(cardId, input);
      if (historyEntries.length > 0) {
        await Promise.all(historyEntries.map((entry) => cardHistoryRepository.record(entry)));
      }
      return updatedCard;
    });

    const response = toCardResponse(updated);
    response.cover_url = await this.filesService.resolveUrl(updated.cover_url);
    return response;
  }

  async updateCardPositions(userId: string, workspaceId: string, updates: UpdateCardPositionsInput): Promise<void> {
    await this.memberRepository.assertMember(userId, workspaceId);

    await this.transactionManager.runInTransaction(async (manager) => {
      const cardRepository = new CardRepository(manager.getRepository(Card));
      const listRepository = new ListRepository(manager.getRepository(List));
      const cardHistoryRepository = new CardHistoryRepository(manager.getRepository(CardHistory));
      const memberRepository = new WorkspaceMemberRepository(manager.getRepository(WorkspaceMember));

      await memberRepository.assertMember(userId, workspaceId);

      const movingUpdates = updates.filter((u) => u.list_id);
      if (movingUpdates.length > 0) {
        const [currentCards, newLists] = await Promise.all([
          Promise.all(movingUpdates.map((u) => cardRepository.findById(u.id))),
          Promise.all([...new Set(movingUpdates.map((u) => u.list_id!))].map((id) => listRepository.findById(id))),
        ]);

        const listTitleMap = new Map(newLists.filter(Boolean).map((l) => [l!.id, l!.title]));

        await Promise.all(
          movingUpdates
            .map((update, i) => ({ update, card: currentCards[i] }))
            .filter(({ update, card }) => card && card.list_id !== update.list_id)
            .map(({ update }) =>
              cardHistoryRepository.record({
                card_id: update.id,
                created_by: userId,
                action_type: 'moved',
                field: listTitleMap.get(update.list_id!) ?? update.list_id!,
              }),
            ),
        );
      }

      await cardRepository.updatePositions(updates);
    });
  }

  async deleteCard(userId: string, cardId: string): Promise<void> {
    const card = await this.cardRepository.findByIdOrFail(cardId);
    const list = await this.listRepository.findByIdOrFail(card.list_id);
    await this.memberRepository.assertMember(userId, list.workspace_id);
    await this.cardRepository.delete(cardId);
    this.logger.info({ cardId, userId }, 'Card deleted');
  }

  async getCardHistory(userId: string, cardId: string): Promise<CardHistoryResponse[]> {
    const card = await this.cardRepository.findByIdOrFail(cardId);
    const list = await this.listRepository.findByIdOrFail(card.list_id);
    await this.memberRepository.assertMember(userId, list.workspace_id);
    const history = await this.cardHistoryRepository.findByCard(cardId);

    return history.map((h) => ({
      id: h.id,
      created_by: h.created_by,
      action_type: h.action_type,
      field: h.field,
      old_val: h.old_val,
      new_val: h.new_val,
      created_at: h.created_at.toISOString(),
      users: h.users,
    }));
  }
}

function toComparable(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function toListWithCardsResponse(list: List, coverUrlMap = new Map<string, string>()): ListWithCardsResponse {
  return {
    id: list.id,
    title: list.title,
    position: list.position,
    wip_limit: list.wip_limit,
    list_type: list.list_type,
    workspace_id: list.workspace_id,
    created_at: list.created_at.toISOString(),
    cards: (list.cards ?? []).map((c) => toCardResponse(c, coverUrlMap)),
  };
}

function toCardResponse(card: Card, coverUrlMap = new Map<string, string>()): CardResponse {
  return {
    id: card.id,
    content: card.content,
    position: card.position,
    description: card.description,
    cover_url: card.cover_url ? coverUrlMap.get(card.cover_url) : undefined,
    assignee_id: card.assignee_id,
    priority: card.priority,
    label: card.label,
    progress: card.progress,
    due_date: card.due_date?.toISOString(),
    list_id: card.list_id,
    created_by: card.created_by,
    created_at: card.created_at.toISOString(),
    comment_count: (card as CardWithCount).comment_count ?? 0,
    story_points: card.story_points,
    estimated_hours: card.estimated_hours,
  };
}
