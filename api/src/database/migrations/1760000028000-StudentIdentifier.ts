import {MigrationInterface,QueryRunner} from 'typeorm';
export class StudentIdentifier1760000028000 implements MigrationInterface {
 async up(q:QueryRunner){await q.query(`ALTER TABLE "user" ADD COLUMN student_code varchar(15) NOT NULL DEFAULT ('QZ-' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 12))) UNIQUE`);}
 async down(q:QueryRunner){await q.query('ALTER TABLE "user" DROP COLUMN student_code');}
}
