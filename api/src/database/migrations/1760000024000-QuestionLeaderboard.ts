import { MigrationInterface, QueryRunner } from 'typeorm';
export class QuestionLeaderboard1760000024000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE quizzes ADD COLUMN show_question_leaderboard boolean NOT NULL DEFAULT false`);
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE quizzes DROP COLUMN show_question_leaderboard`);
    }
}
