import { MigrationInterface, QueryRunner } from 'typeorm';
export class ExplanationsAndSharing1760000019000 implements MigrationInterface {
    async up(q: QueryRunner) {
        await q.query('ALTER TABLE "questions" ADD "explanation" text NULL');
        await q.query(`CREATE TABLE "quiz_collaborators" ("quizId" uuid NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE, "userId" integer NOT NULL REFERENCES "user"("id") ON DELETE CASCADE, "role" varchar(10) NOT NULL CHECK ("role" IN ('VIEWER','EDITOR')), PRIMARY KEY ("quizId", "userId"))`);
    }
    async down(q: QueryRunner) { await q.query('DROP TABLE "quiz_collaborators"'); await q.query('ALTER TABLE "questions" DROP COLUMN "explanation"'); }
}
