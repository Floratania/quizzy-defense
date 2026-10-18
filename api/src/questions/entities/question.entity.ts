import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany, JoinColumn,
} from 'typeorm';
import {Quiz} from "@/quizzes/entities/quiz.entity";
import {Answer} from "@/answers/entities/answer.entity";
import type { Difficulty } from '@/quizzes/question-selection';

export enum QuestionType {
    MULTIPLE_CHOICE = 'multiple_choice',
    MULTIPLE_RESPONSE = 'multiple_response',
    TRUE_FALSE = 'true_false',
    OPEN_TEXT = 'open_text',
    FILL_BLANK = 'fill_blank',
    MATCHING = 'matching',
    ORDERING = 'ordering',
}

export type QuestionConfiguration = {
    pairs?: Array<{ leftId: string; left: string; rightId: string; right: string }>;
    items?: Array<{ id: string; text: string; correctPosition: number }>;
    caseSensitive?: boolean;
};


@Entity({ name: 'questions' })
export class Question {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 10, default: 'medium' })
    difficulty: Difficulty;

    @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'quiz_id' })
    quiz: Quiz;

    @Column({name: 'quiz_id'})
    quizId: string;

    @Column({ type: 'text' })
    text: string;
    @Column({ type: 'text', nullable: true })
    explanation: string | null;

    @Column({ type: 'text', nullable: true })
    mediaUrl: string | null;

    @Column({ type: 'int', default: 100 })
    points: number;

    @Column({ type: 'int', default: 0 })
    position: number;

    @Column({ type: 'int', default: 20 })
    timeLimit: number;

    @OneToMany(() => Answer, (answer) => answer.question, { cascade: true })
    answers: Answer[];

    @Column({
        type: 'enum',
        enum: QuestionType,
        default: QuestionType.MULTIPLE_CHOICE,
    })
    type: QuestionType;

    @Column({ type: 'jsonb', nullable: true })
    configuration: QuestionConfiguration | null;
}
