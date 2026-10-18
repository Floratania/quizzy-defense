import { MigrationInterface, QueryRunner } from 'typeorm';

export class TournamentMode1760000015000 implements MigrationInterface {
    name = 'TournamentMode1760000015000';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."game_sessions_mode_enum" ADD VALUE IF NOT EXISTS 'TOURNAMENT'`);
    }

    async down(): Promise<void> {
        // PostgreSQL enum values cannot be removed safely without recreating the enum.
    }
}
