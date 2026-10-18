import {MigrationInterface,QueryRunner} from 'typeorm';
export class ServerQuestionClock1760000017000 implements MigrationInterface {
    async up(r:QueryRunner){await r.query(`ALTER TABLE session_players ADD COLUMN IF NOT EXISTS "activeQuestionId" uuid, ADD COLUMN IF NOT EXISTS "questionStartedAt" timestamptz`);}
    async down(r:QueryRunner){await r.query(`ALTER TABLE session_players DROP COLUMN IF EXISTS "activeQuestionId", DROP COLUMN IF EXISTS "questionStartedAt"`);}
}
