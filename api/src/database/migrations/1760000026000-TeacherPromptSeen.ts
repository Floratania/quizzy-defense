import {MigrationInterface,QueryRunner} from 'typeorm';
export class TeacherPromptSeen1760000026000 implements MigrationInterface {
 async up(q:QueryRunner){await q.query('ALTER TABLE "user" ADD COLUMN "teacherPromptSeen" boolean NOT NULL DEFAULT false');}
 async down(q:QueryRunner){await q.query('ALTER TABLE "user" DROP COLUMN "teacherPromptSeen"');}
}
