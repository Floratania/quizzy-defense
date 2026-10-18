import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillAnswerCorrectness1760000001000 implements MigrationInterface {
    name = 'BackfillAnswerCorrectness1760000001000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "player_answers" AS player_answer
            SET "isCorrect" = answer."isCorrect"
            FROM "answers" AS answer
            WHERE player_answer."selected_answer_id" = answer."id"
        `);
    }

    public async down(): Promise<void> {}
}
