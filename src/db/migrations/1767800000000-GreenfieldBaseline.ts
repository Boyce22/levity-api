import type { MigrationInterface, QueryRunner } from 'typeorm';

export class GreenfieldBaseline1767800000000 implements MigrationInterface {
  name = 'GreenfieldBaseline1767800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "users_account_status_enum" AS ENUM('ACTIVE', 'SUSPENDED')`);
    await queryRunner.query(`CREATE TYPE "workspace_status_enum" AS ENUM('ACTIVE', 'ARCHIVED')`);
    await queryRunner.query(`CREATE TYPE "workspace_role_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
    await queryRunner.query(`CREATE TYPE "membership_status_enum" AS ENUM('ACTIVE', 'LEFT', 'REMOVED')`);
    await queryRunner.query(`CREATE TYPE "board_role_enum" AS ENUM('ADMIN', 'EDITOR', 'VIEWER')`);
    await queryRunner.query(`CREATE TYPE "board_column_type_enum" AS ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE')`);
    await queryRunner.query(`CREATE TYPE "catalog_status_enum" AS ENUM('ACTIVE', 'ARCHIVED')`);
    await queryRunner.query(`CREATE TYPE "notifications_type_enum" AS ENUM('MENTION', 'ASSIGNMENT', 'REPLY', 'COMMENT')`);
    await queryRunner.query(`CREATE TYPE "sprint_status_enum" AS ENUM('PLANNING', 'ACTIVE', 'COMPLETED')`);
    await queryRunner.query(`CREATE TYPE "sprint_tracking_mode_enum" AS ENUM('POINTS', 'COUNT', 'HOURS')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "username" varchar NOT NULL,
        "password" varchar NOT NULL,
        "email" varchar,
        "first_name" varchar,
        "last_name" varchar,
        "avatar_url" varchar,
        "bio" text,
        "account_status" "users_account_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "deleted_at" TIMESTAMPTZ,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "last_login_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_username_live" ON "users" ("username") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email_live" ON "users" ("email") WHERE deleted_at IS NULL AND email IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_live_account_status" ON "users" ("account_status") WHERE deleted_at IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "workspaces" (
        "id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "status" "workspace_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_workspaces" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workspaces_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "workspace_members" (
        "id" uuid NOT NULL,
        "workspace_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" "workspace_role_enum" NOT NULL DEFAULT 'MEMBER',
        "membership_status" "membership_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "joined_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "left_at" TIMESTAMPTZ,
        "last_accessed_at" TIMESTAMPTZ,
        CONSTRAINT "PK_workspace_members" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workspace_members_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_workspace_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workspace_members_live" ON "workspace_members" ("workspace_id", "user_id") WHERE membership_status = 'ACTIVE'`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_workspace_members_user_id" ON "workspace_members" ("user_id")`);

    await queryRunner.query(`
      CREATE TABLE "workspace_invites" (
        "id" uuid NOT NULL,
        "workspace_id" uuid NOT NULL,
        "token" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_by" uuid NOT NULL,
        "max_uses" int NOT NULL DEFAULT 1,
        "current_uses" int NOT NULL DEFAULT 0,
        "expires_at" TIMESTAMPTZ,
        "revoked_at" TIMESTAMPTZ,
        "workspace_role" "workspace_role_enum" NOT NULL DEFAULT 'MEMBER',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspace_invites" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_workspace_invites_token" UNIQUE ("token"),
        CONSTRAINT "FK_workspace_invites_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_workspace_invites_workspace_id" ON "workspace_invites" ("workspace_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "workspace_tags" (
        "id" uuid NOT NULL,
        "workspace_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "color" varchar NOT NULL,
        "status" "catalog_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_workspace_tags" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workspace_tags_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_workspace_tags_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_workspace_tags_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workspace_tags_live_name" ON "workspace_tags" ("workspace_id", "name") WHERE deleted_at IS NULL AND status = 'ACTIVE'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_workspace_tags_workspace_live" ON "workspace_tags" ("workspace_id") WHERE deleted_at IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "workspace_priorities" (
        "id" uuid NOT NULL,
        "workspace_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "color" varchar NOT NULL,
        "icon" varchar NOT NULL,
        "position" int NOT NULL DEFAULT 0,
        "code" varchar,
        "is_system" boolean NOT NULL DEFAULT false,
        "status" "catalog_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_workspace_priorities" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_workspace_priorities_code" CHECK (code IS NULL OR code IN ('low','medium','high','critical')),
        CONSTRAINT "CHK_workspace_priorities_system" CHECK (NOT is_system OR code IS NOT NULL),
        CONSTRAINT "FK_workspace_priorities_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_workspace_priorities_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_workspace_priorities_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workspace_priorities_live_name" ON "workspace_priorities" ("workspace_id", "name") WHERE deleted_at IS NULL AND status = 'ACTIVE'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workspace_priorities_live_code" ON "workspace_priorities" ("workspace_id", "code") WHERE deleted_at IS NULL AND code IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_workspace_priorities_workspace_live" ON "workspace_priorities" ("workspace_id") WHERE deleted_at IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "boards" (
        "id" uuid NOT NULL,
        "workspace_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "position" float8 NOT NULL DEFAULT 0,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_boards" PRIMARY KEY ("id"),
        CONSTRAINT "FK_boards_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_boards_workspace_position" ON "boards" ("workspace_id", "position") WHERE deleted_at IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "invite_board_grants" (
        "id" uuid NOT NULL,
        "invite_id" uuid NOT NULL,
        "board_id" uuid NOT NULL,
        "board_role" "board_role_enum" NOT NULL,
        CONSTRAINT "PK_invite_board_grants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invite_board_grants" UNIQUE ("invite_id", "board_id"),
        CONSTRAINT "FK_invite_board_grants_invite" FOREIGN KEY ("invite_id") REFERENCES "workspace_invites"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invite_board_grants_board" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "board_members" (
        "id" uuid NOT NULL,
        "board_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" "board_role_enum" NOT NULL DEFAULT 'EDITOR',
        "membership_status" "membership_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "joined_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "left_at" TIMESTAMPTZ,
        "last_accessed_at" TIMESTAMPTZ,
        CONSTRAINT "PK_board_members" PRIMARY KEY ("id"),
        CONSTRAINT "FK_board_members_board" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_board_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_board_members_live" ON "board_members" ("board_id", "user_id") WHERE membership_status = 'ACTIVE'`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_board_members_user_id" ON "board_members" ("user_id")`);

    await queryRunner.query(`
      CREATE TABLE "board_columns" (
        "id" uuid NOT NULL,
        "board_id" uuid NOT NULL,
        "title" varchar NOT NULL,
        "position" float8 NOT NULL DEFAULT 0,
        "wip_limit" int,
        "column_type" "board_column_type_enum",
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_columns" PRIMARY KEY ("id"),
        CONSTRAINT "FK_board_columns_board" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_board_columns_board_position" ON "board_columns" ("board_id", "position")`,
    );

    await queryRunner.query(`
      CREATE TABLE "issues" (
        "id" uuid NOT NULL,
        "content" varchar NOT NULL,
        "position" float8 NOT NULL DEFAULT 0,
        "description" text,
        "cover_url" varchar,
        "assignee_id" uuid,
        "priority_id" uuid NOT NULL,
        "tag_id" uuid,
        "progress" int,
        "due_date" TIMESTAMPTZ,
        "column_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "story_points" int,
        "estimated_hours" float8,
        CONSTRAINT "PK_issues" PRIMARY KEY ("id"),
        CONSTRAINT "FK_issues_column" FOREIGN KEY ("column_id") REFERENCES "board_columns"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_issues_priority" FOREIGN KEY ("priority_id") REFERENCES "workspace_priorities"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_issues_tag" FOREIGN KEY ("tag_id") REFERENCES "workspace_tags"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_issues_assignee" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_issues_column_position" ON "issues" ("column_id", "position")`);
    await queryRunner.query(`CREATE INDEX "IDX_issues_priority_id" ON "issues" ("priority_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_issues_tag_id" ON "issues" ("tag_id") WHERE tag_id IS NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_issues_assignee" ON "issues" ("assignee_id") WHERE assignee_id IS NOT NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "issue_events" (
        "id" uuid NOT NULL,
        "issue_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "action_type" varchar NOT NULL,
        "field" varchar NOT NULL,
        "old_val" varchar,
        "new_val" varchar,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_issue_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_issue_events_issue" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_issue_events_issue_created_at" ON "issue_events" ("issue_id", "created_at" DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE "issue_comments" (
        "id" uuid NOT NULL,
        "issue_id" uuid NOT NULL,
        "parent_id" uuid,
        "content" text NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_issue_comments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_issue_comments_issue" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_issue_comments_parent" FOREIGN KEY ("parent_id") REFERENCES "issue_comments"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_issue_comments_issue_created_at" ON "issue_comments" ("issue_id", "created_at" DESC)`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_issue_comments_parent_id" ON "issue_comments" ("parent_id")`);

    await queryRunner.query(`
      CREATE TABLE "issue_diagrams" (
        "id" uuid NOT NULL,
        "issue_id" uuid NOT NULL,
        "data" jsonb NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_issue_diagrams" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_issue_diagrams_issue_id" UNIQUE ("issue_id"),
        CONSTRAINT "FK_issue_diagrams_issue" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "actor_id" uuid,
        "issue_id" uuid,
        "type" "notifications_type_enum" NOT NULL,
        "read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_actor" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_issue" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_created_at" ON "notifications" ("user_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_read_created_at" ON "notifications" ("user_id", "read", "created_at" DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE "sprints" (
        "id" uuid NOT NULL,
        "board_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "goal" varchar,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "status" "sprint_status_enum" NOT NULL DEFAULT 'PLANNING',
        "tracking_mode" "sprint_tracking_mode_enum" NOT NULL DEFAULT 'POINTS',
        "capacity_points" float,
        "velocity_points" float,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sprints" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sprints_board" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_sprints_one_active" ON "sprints" ("board_id") WHERE status = 'ACTIVE'`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_sprints_board_status" ON "sprints" ("board_id", "status")`);

    await queryRunner.query(`
      CREATE TABLE "sprint_issues" (
        "id" uuid NOT NULL,
        "sprint_id" uuid NOT NULL,
        "issue_id" uuid NOT NULL,
        "position" int NOT NULL DEFAULT 0,
        "added_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "removed_at" TIMESTAMPTZ,
        "moved_to_sprint_id" uuid,
        CONSTRAINT "PK_sprint_issues" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sprint_issues_sprint" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sprint_issues_issue" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sprint_issues_moved_to_sprint" FOREIGN KEY ("moved_to_sprint_id") REFERENCES "sprints"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_sprint_issues_live" ON "sprint_issues" ("sprint_id", "issue_id") WHERE removed_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sprint_issues_sprint_live" ON "sprint_issues" ("sprint_id") WHERE removed_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sprint_issues_issue_live" ON "sprint_issues" ("issue_id") WHERE removed_at IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sprint_issues"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sprints"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "issue_diagrams"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "issue_comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "issue_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "issues"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "board_columns"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "board_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invite_board_grants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "boards"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workspace_priorities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workspace_tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workspace_invites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workspace_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workspaces"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "sprint_tracking_mode_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sprint_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "catalog_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "board_column_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "board_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "membership_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "workspace_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "workspace_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_account_status_enum"`);
  }
}
