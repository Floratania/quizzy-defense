import { MigrationInterface, QueryRunner } from 'typeorm';
export class QuestionBankMetadata1760000009000 implements MigrationInterface {
  async up(q: QueryRunner) { await q.query(`ALTER TABLE "question_bank_items" ADD "folder" varchar(100) NOT NULL DEFAULT 'Загальна', ADD "tags" text[] NOT NULL DEFAULT '{}', ADD "difficulty" varchar(10) NOT NULL DEFAULT 'medium'`); }
  async down(q: QueryRunner) { await q.query(`ALTER TABLE "question_bank_items" DROP COLUMN "difficulty", DROP COLUMN "tags", DROP COLUMN "folder"`); }
}
