import { MigrationInterface, QueryRunner } from 'typeorm';

export class AnswerMedia1760000016000 implements MigrationInterface {
    name = 'AnswerMedia1760000016000';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "answers" ADD COLUMN IF NOT EXISTS "mediaUrl" text`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN IF EXISTS "mediaUrl"`);
    }
}
