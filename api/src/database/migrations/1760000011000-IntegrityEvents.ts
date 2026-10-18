import {MigrationInterface,QueryRunner} from 'typeorm';
export class IntegrityEvents1760000011000 implements MigrationInterface { async up(q:QueryRunner){await q.query(`ALTER TABLE "session_players" ADD "integrity_events" integer NOT NULL DEFAULT 0`)} async down(q:QueryRunner){await q.query(`ALTER TABLE "session_players" DROP COLUMN "integrity_events"`)} }
