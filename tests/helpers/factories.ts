import { BoardRole, WorkspaceRole, type AuthTokens, type BoardDataResponse, type BoardColumnResponse, type HomeBoardResponse, type IssueResponse, type WorkspaceInviteResponse, type WorkspaceMemberResponse, type WorkspaceResponse } from '../../src/contracts';
import { api } from './http';

let sequence = 0;

export function unique(prefix: string): string {
  sequence += 1;
  return `${prefix}${Date.now().toString(36)}${sequence}`;
}

export const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

export interface TestUser extends AuthTokens {
  username: string;
  password: string;
  email: string;
  token: string;
}

export interface OwnerContext {
  user: TestUser;
  workspace: WorkspaceResponse;
  board: HomeBoardResponse;
  columns: BoardColumnResponse[];
  todo: BoardColumnResponse;
}

export async function registrarUsuario(overrides?: {
  username?: string;
  password?: string;
  email?: string;
}): Promise<TestUser> {
  const username = overrides?.username ?? unique('user');
  const password = overrides?.password ?? 'secret1';
  const email = overrides?.email ?? `${username}@levity.test`;
  const response = await api<AuthTokens>('POST', '/api/auth/register', {
    body: { username, password, email },
  });
  if (response.status !== 201) {
    throw new Error(`Falha ao registrar usuário (${response.status}): ${JSON.stringify(response.body)}`);
  }
  return { ...response.body, username, password, email, token: response.body.accessToken };
}

export async function autenticar(username: string, password: string): Promise<AuthTokens> {
  const response = await api<AuthTokens>('POST', '/api/auth/login', {
    body: { username, password },
  });
  if (response.status !== 200) {
    throw new Error(`Falha ao autenticar (${response.status}): ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

export async function criarWorkspace(token: string, name = unique('ws')): Promise<WorkspaceResponse> {
  const response = await api<WorkspaceResponse>('POST', '/api/workspaces/', {
    token,
    body: { name },
  });
  if (response.status !== 201) {
    throw new Error(`Falha ao criar workspace (${response.status}): ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

export async function listarBoards(token: string, workspaceId: string): Promise<HomeBoardResponse[]> {
  const response = await api<HomeBoardResponse[]>('GET', `/api/workspaces/${workspaceId}/boards`, { token });
  if (response.status !== 200) {
    throw new Error(`Falha ao listar boards (${response.status}): ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

export async function criarBoard(token: string, workspaceId: string, name = unique('board')): Promise<HomeBoardResponse> {
  const response = await api<HomeBoardResponse>('POST', `/api/workspaces/${workspaceId}/boards`, {
    token,
    body: { name },
  });
  if (response.status !== 201) {
    throw new Error(`Falha ao criar board (${response.status}): ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

export async function obterBoard(token: string, boardId: string): Promise<BoardDataResponse> {
  const response = await api<BoardDataResponse>('GET', `/api/boards/${boardId}`, { token });
  if (response.status !== 200) {
    throw new Error(`Falha ao obter board (${response.status}): ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

export async function contextoOwner(): Promise<OwnerContext> {
  const user = await registrarUsuario();
  const workspace = await criarWorkspace(user.token);
  const boards = await listarBoards(user.token, workspace.id);
  const board = boards[0];
  if (!board) throw new Error('Workspace criado sem board inicial');
  const data = await obterBoard(user.token, board.id);
  const todo = data.columns.find((column) => column.column_type === 'TODO') ?? data.columns[0];
  if (!todo) throw new Error('Board inicial sem colunas');
  return { user, workspace, board, columns: data.columns, todo };
}

export async function criarIssue(
  token: string,
  boardId: string,
  columnId: string,
  content = unique('issue'),
  extra: Record<string, unknown> = {},
): Promise<IssueResponse> {
  const response = await api<IssueResponse>('POST', `/api/boards/${boardId}/issues`, {
    token,
    body: { content, column_id: columnId, position: 0, ...extra },
  });
  if (response.status !== 201) {
    throw new Error(`Falha ao criar issue (${response.status}): ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

export async function gerarConvite(
  token: string,
  workspaceId: string,
  boardId: string,
  options: {
    workspace_role?: WorkspaceRole;
    board_role?: BoardRole;
    max_uses?: number;
    expires_in_hours?: number;
  } = {},
): Promise<WorkspaceInviteResponse> {
  const response = await api<WorkspaceInviteResponse>('POST', `/api/workspaces/${workspaceId}/invites`, {
    token,
    body: {
      max_uses: options.max_uses ?? 1,
      workspace_role: options.workspace_role ?? WorkspaceRole.MEMBER,
      board_grants: [{ board_id: boardId, board_role: options.board_role ?? BoardRole.EDITOR }],
      ...(options.expires_in_hours ? { expires_in_hours: options.expires_in_hours } : {}),
    },
  });
  if (response.status !== 201) {
    throw new Error(`Falha ao gerar convite (${response.status}): ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

export async function aceitarConvite(
  token: string,
  workspaceId: string,
  inviteToken: string,
): Promise<WorkspaceMemberResponse> {
  const response = await api<WorkspaceMemberResponse>(
    'POST',
    `/api/workspaces/${workspaceId}/invites/${inviteToken}/accept`,
    { token },
  );
  if (response.status !== 200) {
    throw new Error(`Falha ao aceitar convite (${response.status}): ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

export async function convidarEAceitar(
  ownerToken: string,
  workspaceId: string,
  boardId: string,
  options: {
    workspace_role?: WorkspaceRole;
    board_role?: BoardRole;
  } = {},
): Promise<{ guest: TestUser; invite: WorkspaceInviteResponse; membership: WorkspaceMemberResponse }> {
  const guest = await registrarUsuario();
  const invite = await gerarConvite(ownerToken, workspaceId, boardId, options);
  const membership = await aceitarConvite(guest.token, workspaceId, invite.token);
  return { guest, invite, membership };
}
