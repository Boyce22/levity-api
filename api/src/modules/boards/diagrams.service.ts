import type { SaveDiagramInput, DiagramResponse } from '../../domain/index';
import type {
  Diagram,
  DiagramRepository,
  CardRepository,
  ListRepository,
  WorkspaceMemberRepository,
} from '../../db/index';

export class DiagramsService {
  constructor(
    private readonly diagramRepository: DiagramRepository,
    private readonly cardRepository: CardRepository,
    private readonly listRepository: ListRepository,
    private readonly memberRepository: WorkspaceMemberRepository,
  ) {}

  async get(userId: string, cardId: string): Promise<DiagramResponse | null> {
    const card = await this.cardRepository.findByIdOrFail(cardId);
    const list = await this.listRepository.findByIdOrFail(card.list_id);
    await this.memberRepository.assertMember(userId, list.workspace_id);

    const diagram = await this.diagramRepository.findByCard(cardId);
    return diagram ? toDiagramResponse(diagram) : null;
  }

  async save(userId: string, input: SaveDiagramInput): Promise<DiagramResponse> {
    const card = await this.cardRepository.findByIdOrFail(input.card_id);
    const list = await this.listRepository.findByIdOrFail(card.list_id);
    await this.memberRepository.assertMember(userId, list.workspace_id);

    const diagram = await this.diagramRepository.upsert(input.card_id, input.data);
    return toDiagramResponse(diagram);
  }

  async delete(userId: string, cardId: string): Promise<void> {
    const card = await this.cardRepository.findByIdOrFail(cardId);
    const list = await this.listRepository.findByIdOrFail(card.list_id);
    await this.memberRepository.assertMember(userId, list.workspace_id);

    await this.diagramRepository.delete(cardId);
  }
}

function toDiagramResponse(d: Diagram): DiagramResponse {
  return {
    id: d.id,
    card_id: d.card_id,
    data: d.data,
    created_at: d.created_at.toISOString(),
    updated_at: d.updated_at.toISOString(),
  };
}
