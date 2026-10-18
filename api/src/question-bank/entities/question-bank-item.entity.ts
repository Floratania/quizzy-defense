import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'question_bank_items' })
export class QuestionBankItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @Column({ type: 'varchar', length: 100, default: 'Без теми' })
    topic: string;

    @Column({ type: 'varchar', length: 100, default: 'Загальна' })
    folder: string;

    @Column({ type: 'text', array: true, default: '{}' })
    tags: string[];

    @Column({ type: 'varchar', length: 10, default: 'medium' })
    difficulty: string;

    @Column({ type: 'text' })
    text: string;

    @Column({ type: 'jsonb' })
    payload: Record<string, unknown>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
