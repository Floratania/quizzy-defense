import { MigrationInterface, QueryRunner } from 'typeorm';

// Original schema, before incremental migrations. Existing databases already have these tables.
export class InitialSchema1759999999000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasTable('user')) return;
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        await queryRunner.query("CREATE TABLE \"answers\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"question_id\" uuid NOT NULL, \"text\" text NOT NULL, \"isCorrect\" boolean NOT NULL DEFAULT false, CONSTRAINT \"PK_9c32cec6c71e06da0254f2226c6\" PRIMARY KEY (\"id\"))");
        await queryRunner.query("CREATE TYPE \"public\".\"questions_type_enum\" AS ENUM('multiple_choice', 'true_false', 'open_text')");
        await queryRunner.query("CREATE TABLE \"questions\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"quiz_id\" uuid NOT NULL, \"text\" text NOT NULL, \"mediaUrl\" text, \"points\" integer NOT NULL DEFAULT '100', \"timeLimit\" integer NOT NULL DEFAULT '20', \"type\" \"public\".\"questions_type_enum\" NOT NULL DEFAULT 'multiple_choice', CONSTRAINT \"PK_08a6d4b0f49ff300bf3a0ca60ac\" PRIMARY KEY (\"id\"))");
        await queryRunner.query("CREATE TABLE \"quizzes\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"title\" character varying(200) NOT NULL, \"description\" text, \"user_id\" integer NOT NULL, \"createdAt\" TIMESTAMP NOT NULL DEFAULT now(), \"updatedAt\" TIMESTAMP NOT NULL DEFAULT now(), \"deletedAt\" TIMESTAMP, CONSTRAINT \"PK_b24f0f7662cf6b3a0e7dba0a1b4\" PRIMARY KEY (\"id\"))");
        await queryRunner.query("CREATE TABLE \"player_answers\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"player_id\" uuid NOT NULL, \"question_id\" uuid NOT NULL, \"selected_answer_id\" uuid NOT NULL, \"earnedPoints\" integer NOT NULL DEFAULT '0', \"timeTaken\" integer, \"answeredAt\" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT \"PK_ae9d18a286e5b5e0c4bfcb057c1\" PRIMARY KEY (\"id\"))");
        await queryRunner.query("CREATE TABLE \"session_players\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"session_id\" uuid NOT NULL, \"nickname\" character varying(30) NOT NULL, \"socketId\" character varying, \"totalScore\" integer NOT NULL DEFAULT '0', \"joinedAt\" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT \"PK_553400b7551b527e9452e67f5ee\" PRIMARY KEY (\"id\"))");
        await queryRunner.query("CREATE TYPE \"public\".\"game_sessions_status_enum\" AS ENUM('WAITING', 'RUNNING', 'FINISHED')");
        await queryRunner.query("CREATE TABLE \"game_sessions\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"quiz_id\" uuid NOT NULL, \"roomCode\" character varying(12) NOT NULL, \"status\" \"public\".\"game_sessions_status_enum\" NOT NULL DEFAULT 'WAITING', \"user_id\" integer NOT NULL, \"currentQuestionIndex\" integer NOT NULL DEFAULT '0', \"createdAt\" TIMESTAMP NOT NULL DEFAULT now(), \"updatedAt\" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT \"UQ_66b7cd23683dc3886ffa0ed9cdd\" UNIQUE (\"roomCode\"), CONSTRAINT \"PK_e25fa82d55744e55000c3288fdc\" PRIMARY KEY (\"id\"))");
        await queryRunner.query("CREATE TABLE \"user\" (\"id\" SERIAL NOT NULL, \"name\" character varying NOT NULL, \"email\" character varying NOT NULL, \"password\" character varying NOT NULL, CONSTRAINT \"PK_cace4a159ff9f2512dd42373760\" PRIMARY KEY (\"id\"))");
        await queryRunner.query("CREATE TABLE \"session_reports\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"session_id\" uuid NOT NULL, \"summary\" jsonb NOT NULL, \"players\" jsonb NOT NULL, \"questions\" jsonb NOT NULL, \"metadata\" jsonb, \"createdAt\" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT \"PK_bce9e40f36bf25dcd63bedf0822\" PRIMARY KEY (\"id\"))");
        await queryRunner.query("CREATE TABLE \"refresh_token\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"token\" character varying NOT NULL, \"expiresAt\" TIMESTAMP NOT NULL, \"userId\" integer, CONSTRAINT \"REL_8e913e288156c133999341156a\" UNIQUE (\"userId\"), CONSTRAINT \"PK_b575dd3c21fb0831013c909e7fe\" PRIMARY KEY (\"id\"))");
        await queryRunner.query("ALTER TABLE \"answers\" ADD CONSTRAINT \"FK_677120094cf6d3f12df0b9dc5d3\" FOREIGN KEY (\"question_id\") REFERENCES \"questions\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE \"questions\" ADD CONSTRAINT \"FK_46b3c125e02f7242662e4ccb307\" FOREIGN KEY (\"quiz_id\") REFERENCES \"quizzes\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE \"quizzes\" ADD CONSTRAINT \"FK_bd065910c0f4250052c844730dc\" FOREIGN KEY (\"user_id\") REFERENCES \"user\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE \"player_answers\" ADD CONSTRAINT \"FK_3827c31e4b3cddf22bf97b42739\" FOREIGN KEY (\"player_id\") REFERENCES \"session_players\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE \"player_answers\" ADD CONSTRAINT \"FK_d41eb479036ff9b200571579610\" FOREIGN KEY (\"question_id\") REFERENCES \"questions\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE \"player_answers\" ADD CONSTRAINT \"FK_6d4f47a9a93374313520058b7f3\" FOREIGN KEY (\"selected_answer_id\") REFERENCES \"answers\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE \"session_players\" ADD CONSTRAINT \"FK_6611d88b21374f0d4ec3bea0afa\" FOREIGN KEY (\"session_id\") REFERENCES \"game_sessions\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE \"game_sessions\" ADD CONSTRAINT \"FK_382b4709640494499963066cd09\" FOREIGN KEY (\"quiz_id\") REFERENCES \"quizzes\"(\"id\") ON DELETE SET NULL ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE \"game_sessions\" ADD CONSTRAINT \"FK_34e9014c98588c0aea0917afe01\" FOREIGN KEY (\"user_id\") REFERENCES \"user\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE \"session_reports\" ADD CONSTRAINT \"FK_6e2eb8987d046b480923c178d33\" FOREIGN KEY (\"session_id\") REFERENCES \"game_sessions\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE \"refresh_token\" ADD CONSTRAINT \"FK_8e913e288156c133999341156ad\" FOREIGN KEY (\"userId\") REFERENCES \"user\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    }

    async down(): Promise<void> {
        throw new Error('The initial schema cannot be reverted automatically. Restore a database backup instead.');
    }
}
