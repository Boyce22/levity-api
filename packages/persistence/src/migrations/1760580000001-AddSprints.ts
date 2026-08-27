import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSprints1760580000001 implements MigrationInterface {
  name = 'AddSprints1760580000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "story_points" integer`);
    await queryRunner.query(`ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "estimated_hours" float`);
    await queryRunner.query(`ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ`);

    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "sprint_status_enum" AS ENUM('planning', 'active', 'completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "sprint_tracking_mode_enum" AS ENUM('points', 'count', 'hours'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sprints" (
        "id"              uuid          NOT NULL,
        "workspace_id"    uuid          NOT NULL,
        "name"            varchar       NOT NULL,
        "goal"            varchar,
        "start_date"      date          NOT NULL,
        "end_date"        date          NOT NULL,
        "status"          sprint_status_enum        NOT NULL DEFAULT 'planning',
        "tracking_mode"   sprint_tracking_mode_enum NOT NULL DEFAULT 'points',
        "capacity_points" float,
        "velocity_points" float,
        "created_by"      uuid          NOT NULL,
        "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sprints" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sprints_workspace" FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sprint_cards" (
        "id"                  uuid        NOT NULL,
        "sprint_id"           uuid        NOT NULL,
        "card_id"             uuid        NOT NULL,
        "position"            integer     NOT NULL DEFAULT 0,
        "added_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
        "removed_at"          TIMESTAMPTZ,
        "moved_to_sprint_id"  uuid,
        CONSTRAINT "PK_sprint_cards" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sprint_cards_sprint" FOREIGN KEY ("sprint_id")
          REFERENCES "sprints" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sprint_cards_card" FOREIGN KEY ("card_id")
          REFERENCES "cards" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sprint_cards_moved_to_sprint" FOREIGN KEY ("moved_to_sprint_id")
          REFERENCES "sprints" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sprints_workspace_id" ON "sprints" ("workspace_id")`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sprints_workspace_status" ON "sprints" ("workspace_id", "status")`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sprint_cards_sprint_id" ON "sprint_cards" ("sprint_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sprint_cards_card_id" ON "sprint_cards" ("card_id")`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sprint_cards_sprint_removed_at" ON "sprint_cards" ("sprint_id", "removed_at")`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cards_deleted_at" ON "cards" ("deleted_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cards_deleted_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sprint_cards_sprint_removed_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sprint_cards_card_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sprint_cards_sprint_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sprints_workspace_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sprints_workspace_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sprint_cards"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sprints"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sprint_tracking_mode_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sprint_status_enum"`);
    await queryRunner.query(`ALTER TABLE "cards" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "cards" DROP COLUMN IF EXISTS "estimated_hours"`);
    await queryRunner.query(`ALTER TABLE "cards" DROP COLUMN IF EXISTS "story_points"`);
  }
}
