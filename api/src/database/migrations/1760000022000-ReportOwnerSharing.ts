import { MigrationInterface, QueryRunner } from 'typeorm';
export class ReportOwnerSharing1760000022000 implements MigrationInterface {
    async up(q: QueryRunner) { await q.query('ALTER TABLE game_sessions ADD COLUMN "reportSharedWithOwner" boolean NOT NULL DEFAULT false'); }
    async down(q: QueryRunner) { await q.query('ALTER TABLE game_sessions DROP COLUMN "reportSharedWithOwner"'); }
}
