import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuizTopicsAndQuestionBank1760000008000 implements MigrationInterface {
    name = 'QuizTopicsAndQuestionBank1760000008000';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quizzes" ADD COLUMN "topic" varchar(100) NOT NULL DEFAULT 'Без теми'`);
        await queryRunner.query(`
            CREATE TABLE "question_bank_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" integer NOT NULL,
                "topic" varchar(100) NOT NULL DEFAULT 'Без теми',
                "text" text NOT NULL,
                "payload" jsonb NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_question_bank_items" PRIMARY KEY ("id"),
                CONSTRAINT "FK_question_bank_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_question_bank_user_topic" ON "question_bank_items" ("user_id", "topic")`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "question_bank_items"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "topic"`);
    }
}
