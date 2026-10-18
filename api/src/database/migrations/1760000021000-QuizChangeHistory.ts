import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuizChangeHistory1760000021000 implements MigrationInterface {
    async up(q: QueryRunner) {
        await q.query(`CREATE TABLE quiz_change_history (
            id bigserial PRIMARY KEY,
            "quizId" uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
            "actorId" integer REFERENCES "user"(id) ON DELETE SET NULL,
            action varchar(30) NOT NULL,
            details jsonb NOT NULL DEFAULT '{}',
            "createdAt" timestamptz NOT NULL DEFAULT now()
        )`);
        await q.query('CREATE INDEX ON quiz_change_history ("quizId", id DESC)');
    }
    async down(q: QueryRunner) { await q.query('DROP TABLE quiz_change_history'); }
}
