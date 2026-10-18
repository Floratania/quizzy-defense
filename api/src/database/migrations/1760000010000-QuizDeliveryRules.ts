import {MigrationInterface,QueryRunner} from 'typeorm';
export class QuizDeliveryRules1760000010000 implements MigrationInterface {
 async up(q:QueryRunner){await q.query(`ALTER TABLE "quizzes" ADD "pass_threshold" integer NOT NULL DEFAULT 60, ADD "available_from" timestamp NULL, ADD "available_until" timestamp NULL, ADD "max_attempts" integer NOT NULL DEFAULT 0, ADD "require_fullscreen" boolean NOT NULL DEFAULT false, ADD "track_tab_switches" boolean NOT NULL DEFAULT false`)}
 async down(q:QueryRunner){await q.query(`ALTER TABLE "quizzes" DROP COLUMN "track_tab_switches", DROP COLUMN "require_fullscreen", DROP COLUMN "max_attempts", DROP COLUMN "available_until", DROP COLUMN "available_from", DROP COLUMN "pass_threshold"`)}
}
