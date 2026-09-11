import type { MigrationInterface, QueryRunner } from 'typeorm';

const PARTIAL_INDEXES = [
  'UQ_workspace_members_live',
  'UQ_workspace_tags_live_name',
  'UQ_workspace_priorities_live_name',
  'UQ_board_members_live',
  'UQ_sprints_one_active',
] as const;

const ENUM_RENAMES: { type: string; from: string; to: string }[] = [
  { type: 'users_account_status_enum', from: 'active', to: 'ACTIVE' },
  { type: 'users_account_status_enum', from: 'suspended', to: 'SUSPENDED' },
  { type: 'workspace_status_enum', from: 'active', to: 'ACTIVE' },
  { type: 'workspace_status_enum', from: 'archived', to: 'ARCHIVED' },
  { type: 'workspace_role_enum', from: 'owner', to: 'OWNER' },
  { type: 'workspace_role_enum', from: 'admin', to: 'ADMIN' },
  { type: 'workspace_role_enum', from: 'member', to: 'MEMBER' },
  { type: 'membership_status_enum', from: 'active', to: 'ACTIVE' },
  { type: 'membership_status_enum', from: 'left', to: 'LEFT' },
  { type: 'membership_status_enum', from: 'removed', to: 'REMOVED' },
  { type: 'board_role_enum', from: 'admin', to: 'ADMIN' },
  { type: 'board_role_enum', from: 'editor', to: 'EDITOR' },
  { type: 'board_role_enum', from: 'viewer', to: 'VIEWER' },
  { type: 'board_column_type_enum', from: 'todo', to: 'TODO' },
  { type: 'board_column_type_enum', from: 'in_progress', to: 'IN_PROGRESS' },
  { type: 'board_column_type_enum', from: 'review', to: 'REVIEW' },
  { type: 'board_column_type_enum', from: 'done', to: 'DONE' },
  { type: 'catalog_status_enum', from: 'active', to: 'ACTIVE' },
  { type: 'catalog_status_enum', from: 'archived', to: 'ARCHIVED' },
  { type: 'notifications_type_enum', from: 'mention', to: 'MENTION' },
  { type: 'notifications_type_enum', from: 'assignment', to: 'ASSIGNMENT' },
  { type: 'notifications_type_enum', from: 'reply', to: 'REPLY' },
  { type: 'notifications_type_enum', from: 'comment', to: 'COMMENT' },
  { type: 'sprint_status_enum', from: 'planning', to: 'PLANNING' },
  { type: 'sprint_status_enum', from: 'active', to: 'ACTIVE' },
  { type: 'sprint_status_enum', from: 'completed', to: 'COMPLETED' },
  { type: 'sprint_tracking_mode_enum', from: 'points', to: 'POINTS' },
  { type: 'sprint_tracking_mode_enum', from: 'count', to: 'COUNT' },
  { type: 'sprint_tracking_mode_enum', from: 'hours', to: 'HOURS' },
];

const COLUMN_DEFAULTS: { table: string; column: string; value: string }[] = [
  { table: 'users', column: 'account_status', value: 'ACTIVE' },
  { table: 'workspaces', column: 'status', value: 'ACTIVE' },
  { table: 'workspace_members', column: 'role', value: 'MEMBER' },
  { table: 'workspace_members', column: 'membership_status', value: 'ACTIVE' },
  { table: 'workspace_invites', column: 'workspace_role', value: 'MEMBER' },
  { table: 'workspace_tags', column: 'status', value: 'ACTIVE' },
  { table: 'workspace_priorities', column: 'status', value: 'ACTIVE' },
  { table: 'board_members', column: 'role', value: 'EDITOR' },
  { table: 'board_members', column: 'membership_status', value: 'ACTIVE' },
  { table: 'sprints', column: 'status', value: 'PLANNING' },
  { table: 'sprints', column: 'tracking_mode', value: 'POINTS' },
];

async function enumValueExists(queryRunner: QueryRunner, typeName: string, value: string): Promise<boolean> {
  const rows = await queryRunner.query(
    `SELECT 1 FROM pg_enum e
     JOIN pg_type t ON e.enumtypid = t.oid
     WHERE t.typname = $1 AND e.enumlabel = $2`,
    [typeName, value],
  );
  return rows.length > 0;
}

async function renameEnumValue(
  queryRunner: QueryRunner,
  typeName: string,
  from: string,
  to: string,
): Promise<void> {
  const hasFrom = await enumValueExists(queryRunner, typeName, from);
  const hasTo = await enumValueExists(queryRunner, typeName, to);
  if (hasFrom && !hasTo) {
    await queryRunner.query(`ALTER TYPE "${typeName}" RENAME VALUE '${from}' TO '${to}'`);
  }
}

async function dropPartialIndexes(queryRunner: QueryRunner): Promise<void> {
  for (const index of PARTIAL_INDEXES) {
    await queryRunner.query(`DROP INDEX IF EXISTS "${index}"`);
  }
}

async function recreatePartialIndexes(queryRunner: QueryRunner, activeStatus: string): Promise<void> {
  await queryRunner.query(
    `CREATE UNIQUE INDEX "UQ_workspace_members_live" ON "workspace_members" ("workspace_id", "user_id") WHERE membership_status = '${activeStatus}'`,
  );
  await queryRunner.query(
    `CREATE UNIQUE INDEX "UQ_workspace_tags_live_name" ON "workspace_tags" ("workspace_id", "name") WHERE deleted_at IS NULL AND status = '${activeStatus}'`,
  );
  await queryRunner.query(
    `CREATE UNIQUE INDEX "UQ_workspace_priorities_live_name" ON "workspace_priorities" ("workspace_id", "name") WHERE deleted_at IS NULL AND status = '${activeStatus}'`,
  );
  await queryRunner.query(
    `CREATE UNIQUE INDEX "UQ_board_members_live" ON "board_members" ("board_id", "user_id") WHERE membership_status = '${activeStatus}'`,
  );
  await queryRunner.query(
    `CREATE UNIQUE INDEX "UQ_sprints_one_active" ON "sprints" ("board_id") WHERE status = '${activeStatus}'`,
  );
}

async function setColumnDefaults(queryRunner: QueryRunner): Promise<void> {
  for (const { table, column, value } of COLUMN_DEFAULTS) {
    await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '${value}'`);
  }
}

export class UppercaseEnumValues1767900000000 implements MigrationInterface {
  name = 'UppercaseEnumValues1767900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await dropPartialIndexes(queryRunner);

    for (const { type, from, to } of ENUM_RENAMES) {
      await renameEnumValue(queryRunner, type, from, to);
    }

    await setColumnDefaults(queryRunner);
    await recreatePartialIndexes(queryRunner, 'ACTIVE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await dropPartialIndexes(queryRunner);

    for (const { type, from, to } of [...ENUM_RENAMES].reverse()) {
      await renameEnumValue(queryRunner, type, to, from);
    }

    const lowercaseDefaults: { table: string; column: string; value: string }[] = [
      { table: 'users', column: 'account_status', value: 'active' },
      { table: 'workspaces', column: 'status', value: 'active' },
      { table: 'workspace_members', column: 'role', value: 'member' },
      { table: 'workspace_members', column: 'membership_status', value: 'active' },
      { table: 'workspace_invites', column: 'workspace_role', value: 'member' },
      { table: 'workspace_tags', column: 'status', value: 'active' },
      { table: 'workspace_priorities', column: 'status', value: 'active' },
      { table: 'board_members', column: 'role', value: 'editor' },
      { table: 'board_members', column: 'membership_status', value: 'active' },
      { table: 'sprints', column: 'status', value: 'planning' },
      { table: 'sprints', column: 'tracking_mode', value: 'points' },
    ];

    for (const { table, column, value } of lowercaseDefaults) {
      await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '${value}'`);
    }

    await recreatePartialIndexes(queryRunner, 'active');
  }
}
