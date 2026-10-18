import { MigrationInterface, QueryRunner } from 'typeorm';
export class AccountRolesAndBankAccess1760000025000 implements MigrationInterface {
 async up(q: QueryRunner) {
  await q.query(`ALTER TABLE "user" ALTER COLUMN role SET DEFAULT 'STUDENT'`);
  await q.query(`ALTER TABLE "user" ADD COLUMN "teacherRequested" boolean NOT NULL DEFAULT false`);
  await q.query(`UPDATE "user" SET role=CASE WHEN lower(email)='tania.flyora@gmail.com' THEN 'ADMIN' ELSE 'STUDENT' END`);
  await q.query(`CREATE TABLE question_bank_access (owner_id integer REFERENCES "user"(id) ON DELETE CASCADE, member_id integer REFERENCES "user"(id) ON DELETE CASCADE, role varchar(10) NOT NULL CHECK(role IN ('VIEWER','EDITOR')), PRIMARY KEY(owner_id,member_id), CHECK(owner_id<>member_id))`);
 }
 async down(q:QueryRunner) { await q.query('DROP TABLE question_bank_access'); await q.query('ALTER TABLE "user" DROP COLUMN "teacherRequested"'); await q.query(`ALTER TABLE "user" ALTER COLUMN role SET DEFAULT 'TEACHER'`); }
}
