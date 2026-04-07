import { Logger } from 'pino';
import { ListRepository } from '../repositories/list.repository';
import { CardRepository } from '../repositories/card.repository';
import { WorkspaceMemberRepository } from '@/modules/workspaces/repositories/workspace-member.repository';
import { WorkspaceRepository } from '@/modules/workspaces/repositories/workspace.repository';
import {
  CreateListInput,
  UpdateListInput,
  UpdateListPositionsInput,
  CreateCardInput,
  UpdateCardInput,
  UpdateCardPositionsInput,
} from '../schemas';
import { BoardDataResponse, ListWithCardsResponse, CardResponse } from '@/modules/workspaces/dtos/workspace-response.dto';
import { List } from '../entities/list.entity';
import { Card, CardWithCount } from '../entities/card.entity';

export class BoardService {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly cardRepository: CardRepository,
    private readonly memberRepository: WorkspaceMemberRepository,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly logger: Logger,
  ) { }

  async getBoardData(userId: string, workspaceId: string): Promise<BoardDataResponse> {
    await this.memberRepository.assertMember(userId, workspaceId);

    const [fullData, lists] = await Promise.all([
      this.workspaceRepository.findFullData(workspaceId),
      this.listRepository.findByWorkspace(workspaceId),
    ]);

    const { workspace, members, tags, priorities } = fullData;

    return {
      workspace: { id: workspace.id, name: workspace.name, created_by: workspace.created_by, created_at: workspace.created_at.toISOString(), updated_at: workspace.updated_at.toISOString() },
      lists: lists.map(toListWithCardsResponse),
      members: members.map((m) => ({
        id: m.id,
        workspace_id: m.workspace_id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at.toISOString(),
      })),
      tags: tags.map((t) => ({ id: t.id, workspace_id: t.workspace_id, name: t.name, color: t.color, created_at: t.created_at.toISOString() })),
      priorities: priorities.map((p) => ({ id: p.id, workspace_id: p.workspace_id, name: p.name, color: p.color, icon: p.icon, position: p.position, created_at: p.created_at.toISOString() })),
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
    const card = await this.cardRepository.create(userId, input);
    return toCardResponse(card);
  }

  async updateCard(userId: string, cardId: string, input: UpdateCardInput): Promise<CardResponse> {
    const card = await this.cardRepository.findByIdOrFail(cardId);
    const list = await this.listRepository.findByIdOrFail(card.list_id);
    await this.memberRepository.assertMember(userId, list.workspace_id);
    const updated = await this.cardRepository.update(cardId, input);
    return toCardResponse(updated);
  }

  async updateCardPositions(userId: string, workspaceId: string, updates: UpdateCardPositionsInput): Promise<void> {
    await this.memberRepository.assertMember(userId, workspaceId);
    await this.cardRepository.updatePositions(updates);
  }

  async deleteCard(userId: string, cardId: string): Promise<void> {
    const card = await this.cardRepository.findByIdOrFail(cardId);
    const list = await this.listRepository.findByIdOrFail(card.list_id);
    await this.memberRepository.assertMember(userId, list.workspace_id);
    await this.cardRepository.delete(cardId);
    this.logger.info({ cardId, userId }, 'Card deleted');
  }
}

function toListWithCardsResponse(list: List): ListWithCardsResponse {
  return {
    id: list.id,
    title: list.title,
    position: list.position,
    wip_limit: list.wip_limit,
    list_type: list.list_type,
    workspace_id: list.workspace_id,
    created_at: list.created_at.toISOString(),
    cards: (list.cards ?? []).map(toCardResponse),
  };
}

function toCardResponse(card: Card): CardResponse {
  return {
    id: card.id,
    content: card.content,
    position: card.position,
    description: card.description,
    cover_url: card.cover_url,
    assignee_id: card.assignee_id,
    priority: card.priority,
    label: card.label,
    progress: card.progress,
    due_date: card.due_date?.toISOString(),
    list_id: card.list_id,
    created_by: card.created_by,
    created_at: card.created_at.toISOString(),
    comment_count: (card as CardWithCount).comment_count ?? 0,
  };
}
