import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne, JoinColumn,
} from 'typeorm';
import {Question} from "@/questions/entities/question.entity";

@Entity({ name: 'answers' })
export class Answer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Question, (question) => question.answers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'question_id' })
    question: Question;

    @Column({name: 'question_id'})
    questionId: string;

    @Column({ type: 'text' })
    text: string;

    @Column({ type: 'text', nullable: true })
    mediaUrl: string | null;

    @Column({ default: false })
    isCorrect: boolean;
}
