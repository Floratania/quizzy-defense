import {Column, Entity, PrimaryGeneratedColumn, Unique} from 'typeorm';

@Entity({name: 'question_bank_folders'})
@Unique(['userId', 'name'])
export class QuestionBankFolder {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({name: 'user_id', type: 'int'}) userId: number;
    @Column({length: 100}) name: string;
}
