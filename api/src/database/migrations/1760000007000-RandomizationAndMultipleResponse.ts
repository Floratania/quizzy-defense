import { MigrationInterface, QueryRunner } from 'typeorm';

export class RandomizationAndMultipleResponse1760000007000 implements MigrationInterface {
    name = 'RandomizationAndMultipleResponse1760000007000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."questions_type_enum" ADD VALUE IF NOT EXISTS 'multiple_response'`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "shuffle_questions" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "shuffle_answers" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "session_players" ADD COLUMN IF NOT EXISTS "question_order" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_players" DROP COLUMN IF EXISTS "question_order"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN IF EXISTS "shuffle_answers"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN IF EXISTS "shuffle_questions"`);
    }
}
