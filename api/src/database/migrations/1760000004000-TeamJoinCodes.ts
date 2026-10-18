import { MigrationInterface, QueryRunner } from 'typeorm';

export class TeamJoinCodes1760000004000 implements MigrationInterface {
    name = 'TeamJoinCodes1760000004000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_teams" ADD COLUMN IF NOT EXISTS "join_code" character varying(12)`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_session_teams_join_code" ON "session_teams" ("join_code") WHERE "join_code" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_session_teams_join_code"`);
        await queryRunner.query(`ALTER TABLE "session_teams" DROP COLUMN IF EXISTS "join_code"`);
    }
}
