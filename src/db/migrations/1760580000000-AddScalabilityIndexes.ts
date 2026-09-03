import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScalabilityIndexes1760580000000 implements MigrationInterface {
  name = 'AddScalabilityIndexes1760580000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_comments_card_created_at" ON "comments" ("card_id", "created_at" DESC)',
    );
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_comments_parent_id" ON "comments" ("parent_id")');
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_notifications_user_created_at" ON "notifications" ("user_id", "created_at" DESC)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_notifications_user_read_created_at" ON "notifications" ("user_id", "read", "created_at" DESC)',
    );
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_cards_list_position" ON "cards" ("list_id", "position")');
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_lists_workspace_position" ON "lists" ("workspace_id", "position")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_card_history_card_created_at" ON "card_history" ("card_id", "created_at" DESC)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_workspace_members_workspace_user" ON "workspace_members" ("workspace_id", "user_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_workspace_members_workspace_user"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_card_history_card_created_at"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_lists_workspace_position"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_cards_list_position"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_notifications_user_read_created_at"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_notifications_user_created_at"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_comments_parent_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_comments_card_created_at"');
  }
}
