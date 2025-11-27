import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany, JoinColumn,
} from 'typeorm';
import {Quiz} from "@/quizzes/entities/quiz.entity";
import {Answer} from "@/answers/entities/answer.entity";

export enum QuestionType {
    MULTIPLE_CHOICE = 'multiple_choice',
    TRUE_FALSE = 'true_false',
    OPEN_TEXT = 'open_text'
}


@Entity({ name: 'questions' })
export class Question {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'quiz_id' })
    quiz: Quiz;

    @Column({name: 'quiz_id'})
    quizId: string;

    @Column({ type: 'text' })
    text: string;

    @Column({ type: 'text', nullable: true })
    mediaUrl: string | null;

    @Column({ type: 'int', default: 100 })
    points: number;

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
}
