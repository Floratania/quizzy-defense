import { MigrationInterface, QueryRunner } from 'typeorm';

export class SurvivalAndFeedback1760000005000 implements MigrationInterface {
    name = 'SurvivalAndFeedback1760000005000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "feedback_mode" character varying(30) NOT NULL DEFAULT 'IMMEDIATE'`);
        await queryRunner.query(`ALTER TABLE "session_players" ADD COLUMN IF NOT EXISTS "eliminatedAt" timestamp`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_players" DROP COLUMN IF EXISTS "eliminatedAt"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN IF EXISTS "feedback_mode"`);
    }
}
