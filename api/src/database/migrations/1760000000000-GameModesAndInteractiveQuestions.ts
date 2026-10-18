import { MigrationInterface, QueryRunner } from 'typeorm';

export class GameModesAndInteractiveQuestions1760000000000 implements MigrationInterface {
    name = 'GameModesAndInteractiveQuestions1760000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`ALTER TYPE "public"."questions_type_enum" ADD VALUE IF NOT EXISTS 'matching'`);
        await queryRunner.query(`ALTER TYPE "public"."questions_type_enum" ADD VALUE IF NOT EXISTS 'ordering'`);
        await queryRunner.query(`ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "configuration" jsonb`);
        await queryRunner.query(`ALTER TABLE "player_answers" ALTER COLUMN "selected_answer_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "player_answers" ADD COLUMN IF NOT EXISTS "response" jsonb`);
        await queryRunner.query(`ALTER TABLE "player_answers" ADD COLUMN IF NOT EXISTS "isCorrect" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."game_sessions_mode_enum" AS ENUM('CLASSIC', 'TEAM', 'PROGRESS', 'SURVIVAL'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
        await queryRunner.query(`ALTER TABLE "game_sessions" ADD COLUMN IF NOT EXISTS "mode" "public"."game_sessions_mode_enum" NOT NULL DEFAULT 'CLASSIC'`);
        await queryRunner.query(`ALTER TABLE "game_sessions" ADD COLUMN IF NOT EXISTS "settings" jsonb NOT NULL DEFAULT '{}'::jsonb`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "session_teams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "name" character varying(50) NOT NULL, "position" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_session_teams" PRIMARY KEY ("id"), CONSTRAINT "FK_session_teams_session" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE)`);
        await queryRunner.query(`ALTER TABLE "session_players" ADD COLUMN IF NOT EXISTS "team_id" uuid`);
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "session_players" ADD CONSTRAINT "FK_session_players_team" FOREIGN KEY ("team_id") REFERENCES "session_teams"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN null; END $$`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_players" DROP CONSTRAINT IF EXISTS "FK_session_players_team"`);
        await queryRunner.query(`ALTER TABLE "session_players" DROP COLUMN IF EXISTS "team_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "session_teams"`);
        await queryRunner.query(`ALTER TABLE "game_sessions" DROP COLUMN IF EXISTS "settings"`);
        await queryRunner.query(`ALTER TABLE "game_sessions" DROP COLUMN IF EXISTS "mode"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."game_sessions_mode_enum"`);
        await queryRunner.query(`ALTER TABLE "player_answers" DROP COLUMN IF EXISTS "isCorrect"`);
        await queryRunner.query(`ALTER TABLE "player_answers" DROP COLUMN IF EXISTS "response"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN IF EXISTS "configuration"`);
    }
}
