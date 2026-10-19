import {MigrationInterface,QueryRunner} from 'typeorm';
export class QuizMistakePractice1760000040000 implements MigrationInterface {
 async up(q:QueryRunner){await q.query('ALTER TABLE quizzes ADD COLUMN allow_mistake_practice boolean NOT NULL DEFAULT true');}
 async down(q:QueryRunner){await q.query('ALTER TABLE quizzes DROP COLUMN allow_mistake_practice');}
}
