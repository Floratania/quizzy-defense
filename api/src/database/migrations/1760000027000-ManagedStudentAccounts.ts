import {MigrationInterface,QueryRunner} from 'typeorm';
export class ManagedStudentAccounts1760000027000 implements MigrationInterface {
 async up(q:QueryRunner){await q.query('ALTER TABLE "user" ADD COLUMN managed_by_teacher_id integer NULL REFERENCES "user"(id) ON DELETE SET NULL');}
 async down(q:QueryRunner){await q.query('ALTER TABLE "user" DROP COLUMN managed_by_teacher_id');}
}
