import type { SaveDiagramInput, DiagramResponse } from '../../contracts/index';
import type {
  IssueDiagram,
  IssueDiagramRepository,
  IssueRepository,
  BoardColumnRepository,
  BoardMemberRepository,
} from '../../db/index';

export class DiagramsService {
  constructor(
    private readonly diagramRepository: IssueDiagramRepository,
    private readonly issueRepository: IssueRepository,
    private readonly boardColumnRepository: BoardColumnRepository,
    private readonly boardMemberRepository: BoardMemberRepository,
  ) {}

  async get(userId: string, issueId: string): Promise<DiagramResponse | null> {
    await this.assertIssueBoardMember(userId, issueId);

    const diagram = await this.diagramRepository.findByIssue(issueId);
    return diagram ? toDiagramResponse(diagram) : null;
  }

  async save(userId: string, input: SaveDiagramInput): Promise<DiagramResponse> {
    await this.assertIssueBoardMember(userId, input.issue_id);

    const diagram = await this.diagramRepository.upsert(input.issue_id, input.data);
    return toDiagramResponse(diagram);
  }

  async delete(userId: string, issueId: string): Promise<void> {
    await this.assertIssueBoardMember(userId, issueId);

    await this.diagramRepository.delete(issueId);
  }

  private async assertIssueBoardMember(userId: string, issueId: string): Promise<void> {
    const issue = await this.issueRepository.findByIdOrFail(issueId);
    const column = await this.boardColumnRepository.findByIdOrFail(issue.column_id);
    await this.boardMemberRepository.assertMember(userId, column.board_id);
  }
}

function toDiagramResponse(d: IssueDiagram): DiagramResponse {
  return {
    id: d.id,
    issue_id: d.issue_id,
    data: d.data,
    created_at: d.created_at.toISOString(),
    updated_at: d.updated_at.toISOString(),
  };
}
