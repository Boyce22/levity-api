import { AppDataSource } from '../../src/db/data-source';

const TABLES = [
  'sprint_issues',
  'sprints',
  'notifications',
  'issue_diagrams',
  'issue_comments',
  'issue_events',
  'issues',
  'board_columns',
  'board_members',
  'invite_board_grants',
  'boards',
  'workspace_priorities',
  'workspace_tags',
  'workspace_invites',
  'workspace_members',
  'workspaces',
  'users',
] as const;

export async function truncateAll(): Promise<void> {
  if (!AppDataSource.isInitialized) return;
  const quoted = TABLES.map((table) => `"${table}"`).join(', ');
  await AppDataSource.query(`TRUNCATE ${quoted} RESTART IDENTITY CASCADE`);
}
