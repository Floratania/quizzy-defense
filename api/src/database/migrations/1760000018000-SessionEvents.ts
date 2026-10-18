import { MigrationInterface, QueryRunner } from 'typeorm';
export class SessionEvents1760000018000 implements MigrationInterface {
    async up(q: QueryRunner) {
        await q.query(`CREATE TABLE "session_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionId" uuid NOT NULL REFERENCES "game_sessions"("id") ON DELETE CASCADE, "playerId" uuid NOT NULL REFERENCES "session_players"("id") ON DELETE CASCADE, "nickname" varchar(30) NOT NULL, "type" varchar(30) NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id"))`);
        await q.query(`CREATE INDEX "session_events_session_time" ON "session_events" ("sessionId", "createdAt")`);
    }
    async down(q: QueryRunner) { await q.query('DROP TABLE "session_events"'); }
}
