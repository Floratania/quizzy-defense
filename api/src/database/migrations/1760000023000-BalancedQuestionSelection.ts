import { MigrationInterface, QueryRunner } from 'typeorm';
export class BalancedQuestionSelection1760000023000 implements MigrationInterface {
    async up(q: QueryRunner) {
        await q.query(`ALTER TABLE questions ADD COLUMN difficulty varchar(10) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard'))`);
        await q.query('ALTER TABLE quizzes ADD COLUMN "questionSelection" jsonb');
    }
    async down(q: QueryRunner) {
        await q.query('ALTER TABLE quizzes DROP COLUMN "questionSelection"');
        await q.query('ALTER TABLE questions DROP COLUMN difficulty');
    }
}
