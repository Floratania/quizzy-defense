import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuestionPosition1760000003000 implements MigrationInterface {
    name = 'QuestionPosition1760000003000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "position" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`WITH ranked AS (SELECT id, ROW_NUMBER() OVER (PARTITION BY quiz_id ORDER BY id) - 1 AS position FROM questions) UPDATE questions SET position = ranked.position FROM ranked WHERE questions.id = ranked.id`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN IF EXISTS "position"`);
    }
}
