import {MigrationInterface, QueryRunner} from 'typeorm';

export class QuestionBankFolders1760000041000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE question_bank_folders (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id integer NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
            name varchar(100) NOT NULL,
            UNIQUE(user_id, name)
        )`);
        await queryRunner.query(`INSERT INTO question_bank_folders(user_id,name)
            SELECT DISTINCT user_id,folder FROM question_bank_items ON CONFLICT DO NOTHING`);
    }
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE question_bank_folders');
    }
}
