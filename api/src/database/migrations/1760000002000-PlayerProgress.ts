import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlayerProgress1760000002000 implements MigrationInterface {
    name = 'PlayerProgress1760000002000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_players" ADD COLUMN IF NOT EXISTS "currentQuestionIndex" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "session_players" ADD COLUMN IF NOT EXISTS "completedAt" timestamp`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_players" DROP COLUMN IF EXISTS "completedAt"`);
        await queryRunner.query(`ALTER TABLE "session_players" DROP COLUMN IF EXISTS "currentQuestionIndex"`);
    }
}
