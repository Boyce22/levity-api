import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1724700000000 implements MigrationInterface {
  name = 'InitialSchema1724700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "workspace_members_role_enum" AS ENUM('owner', 'admin', 'member', 'editor', 'viewer')`);
    await queryRunner.query(`CREATE TYPE "workspace_invites_role_enum" AS ENUM('owner', 'admin', 'member', 'editor', 'viewer')`);
    await queryRunner.query(`CREATE TYPE "lists_list_type_enum" AS ENUM('todo', 'in_progress', 'review', 'done')`);
    await queryRunner.query(`CREATE TYPE "notifications_type_enum" AS ENUM('mention', 'assignment', 'reply', 'comment')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "username" character varying NOT NULL,
        "password" character varying NOT NULL,
        "email" character varying,
        "display_name" character varying,
        "avatar_url" character varying,
        "bio" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "workspaces" (
        "id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspaces" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "workspace_members" (
        "id" uuid NOT NULL,
        "workspace_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" "workspace_members_role_enum" NOT NULL DEFAULT 'member',
        "joined_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspace_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_workspace_members_workspace_user" UNIQUE ("workspace_id", "user_id"),
        CONSTRAINT "FK_workspace_members_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_workspace_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "workspace_invites" (
        "id" uuid NOT NULL,
        "workspace_id" uuid NOT NULL,
        "token" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_by" uuid NOT NULL,
        "max_uses" integer NOT NULL DEFAULT 1,
        "current_uses" integer NOT NULL DEFAULT 0,
        "expires_at" TIMESTAMPTZ,
        "revoked_at" TIMESTAMPTZ,
        "role" "workspace_invites_role_enum" NOT NULL DEFAULT 'member',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspace_invites" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_workspace_invites_token" UNIQUE ("token"),
        CONSTRAINT "FK_workspace_invites_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "workspace_tags" (
        "id" uuid NOT NULL,
        "workspace_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "color" character varying NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspace_tags" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_workspace_tags_workspace_name" UNIQUE ("workspace_id", "name"),
        CONSTRAINT "FK_workspace_tags_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "workspace_priorities" (
        "id" uuid NOT NULL,
        "workspace_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "color" character varying NOT NULL,
        "icon" character varying NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspace_priorities" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_workspace_priorities_workspace_name" UNIQUE ("workspace_id", "name"),
        CONSTRAINT "FK_workspace_priorities_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "lists" (
        "id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "position" double precision NOT NULL DEFAULT 0,
        "wip_limit" integer,
        "list_type" "lists_list_type_enum",
        "workspace_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lists" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lists_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "cards" (
        "id" uuid NOT NULL,
        "content" character varying NOT NULL,
        "position" double precision NOT NULL DEFAULT 0,
        "description" text,
        "cover_url" character varying,
        "assignee_id" uuid,
        "priority" character varying,
        "label" character varying,
        "progress" integer DEFAULT 0,
        "due_date" TIMESTAMPTZ,
        "list_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cards" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cards_list" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "card_history" (
        "id" uuid NOT NULL,
        "card_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "action_type" character varying NOT NULL,
        "field" character varying NOT NULL,
        "old_val" character varying,
        "new_val" character varying,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_card_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_card_history_card" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" uuid NOT NULL,
        "content" text NOT NULL,
        "card_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "parent_id" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_comments_card" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_parent" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "actor_id" uuid NOT NULL,
        "card_id" uuid NOT NULL,
        "type" "notifications_type_enum" NOT NULL,
        "content" text NOT NULL,
        "read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "diagrams" (
        "id" uuid NOT NULL,
        "card_id" uuid NOT NULL,
        "data" jsonb NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_diagrams" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_diagrams_card_id" UNIQUE ("card_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "diagrams"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP TABLE "card_history"`);
    await queryRunner.query(`DROP TABLE "cards"`);
    await queryRunner.query(`DROP TABLE "lists"`);
    await queryRunner.query(`DROP TABLE "workspace_priorities"`);
    await queryRunner.query(`DROP TABLE "workspace_tags"`);
    await queryRunner.query(`DROP TABLE "workspace_invites"`);
    await queryRunner.query(`DROP TABLE "workspace_members"`);
    await queryRunner.query(`DROP TABLE "workspaces"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE "lists_list_type_enum"`);
    await queryRunner.query(`DROP TYPE "workspace_invites_role_enum"`);
    await queryRunner.query(`DROP TYPE "workspace_members_role_enum"`);
  }
}
