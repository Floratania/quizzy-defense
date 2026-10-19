import {MigrationInterface,QueryRunner} from 'typeorm';
export class QuizTimePenalty1760000030000 implements MigrationInterface {
 async up(q:QueryRunner){await q.query('ALTER TABLE quizzes ADD COLUMN time_penalty_enabled boolean NOT NULL DEFAULT true');}
 async down(q:QueryRunner){await q.query('ALTER TABLE quizzes DROP COLUMN time_penalty_enabled');}
}
