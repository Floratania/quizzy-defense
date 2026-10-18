import { MigrationInterface, QueryRunner } from 'typeorm';

export class FillBlankQuestion1760000006000 implements MigrationInterface {
    name = 'FillBlankQuestion1760000006000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."questions_type_enum" ADD VALUE IF NOT EXISTS 'fill_blank'`);
    }

    public async down(): Promise<void> {
        // PostgreSQL enum values cannot be removed safely without recreating the enum.
    }
}
