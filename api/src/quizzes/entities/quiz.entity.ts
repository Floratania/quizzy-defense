import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import {Question} from "@/questions/entities/question.entity";
import {User} from "@/users/entities/user.entity";
import type { QuestionSelection } from '../question-selection';

export enum QuizFeedbackMode {
    IMMEDIATE = 'IMMEDIATE',
    END_WITH_ANSWERS = 'END_WITH_ANSWERS',
    END_SCORE_ONLY = 'END_SCORE_ONLY',
}

@Entity({ name: 'quizzes' })
export class Quiz {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    title: string;

    @Column({ type: 'jsonb', nullable: true })
    questionSelection: QuestionSelection | null;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'varchar', length: 100, default: 'Без теми' })
    topic: string;
    @Column({ name: 'allow_mistake_practice', default: true }) allowMistakePractice: boolean;
    @Column({ name: 'time_penalty_enabled', default: true }) timePenaltyEnabled: boolean;
    @Column({ name: 'pass_threshold', type: 'int', default: 60 }) passThreshold: number;
    @Column({ name: 'available_from', type: 'timestamp', nullable: true }) availableFrom: Date | null;
    @Column({ name: 'available_until', type: 'timestamp', nullable: true }) availableUntil: Date | null;
    @Column({ name: 'max_attempts', type: 'int', default: 0 }) maxAttempts: number;
    @Column({ name: 'require_fullscreen', default: false }) requireFullscreen: boolean;
    @Column({ name: 'track_tab_switches', default: false }) trackTabSwitches: boolean;

    @Column({ name: 'feedback_mode', type: 'varchar', length: 30, default: QuizFeedbackMode.IMMEDIATE })
    feedbackMode: QuizFeedbackMode;

    @Column({ name: 'show_question_leaderboard', default: false }) showQuestionLeaderboard: boolean;

    @Column({ name: 'shuffle_questions', default: false })
    shuffleQuestions: boolean;

    @Column({ name: 'shuffle_answers', default: false })
    shuffleAnswers: boolean;

    @OneToMany(() => Question, (q) => q.quiz, { cascade: true })
    questions: Question[];

    @ManyToOne(() => User, (user) => user.quizzes, {nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({name: 'user_id'})
    userId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}
