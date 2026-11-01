import {MigrationInterface,QueryRunner} from 'typeorm';
export class PersonalDataConsent1760000042000 implements MigrationInterface {
 async up(q:QueryRunner){await q.query('ALTER TABLE "user" ADD COLUMN personal_data_consent_at timestamptz NULL');}
 async down(q:QueryRunner){await q.query('ALTER TABLE "user" DROP COLUMN personal_data_consent_at');}
}
