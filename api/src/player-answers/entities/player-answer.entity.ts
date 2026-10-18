import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn, JoinColumn,
} from 'typeorm';
import {GamePlayer} from "@/game-players/entities/game-player.entity";
import {Question} from "@/questions/entities/question.entity";
import {Answer} from "@/answers/entities/answer.entity";

@Entity({ name: 'player_answers' })
export class PlayerAnswer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => GamePlayer, (player) => player.answers, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'player_id' })
    player: GamePlayer;

    @Column({name: 'player_id'})
    player_id: string;

    @ManyToOne(() => Question, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'question_id' })
    question: Question;

    @Column({name: 'question_id'})
    question_id: string;

    @ManyToOne(() => Answer, { nullable: true })
    @JoinColumn({ name: 'selected_answer_id' })
    selectedAnswer: Answer | null;

    @Column({name: 'selected_answer_id', nullable: true})
    selectedAnswerId: string | null;

    @Column({ type: 'jsonb', nullable: true })
    response: Record<string, unknown> | null;

    @Column({ default: false })
    isCorrect: boolean;

    @Column({ type: 'int', default: 0 })
    earnedPoints: number; // points for this answer

    @Column({ type: 'int', nullable: true })
    timeTaken: number | null; // how fast they answered

    @CreateDateColumn()
    answeredAt: Date;
}
