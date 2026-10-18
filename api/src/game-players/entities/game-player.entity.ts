import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn, JoinColumn,
} from 'typeorm';
import {GameSession} from "@/game-sessions/entities/game-session.entity";
import {PlayerAnswer} from "@/player-answers/entities/player-answer.entity";
import {SessionTeam} from "@/game-teams/entities/session-team.entity";

@Entity({name: 'session_players'})
export class GamePlayer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => GameSession, (s) => s.players, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({name: 'session_id'})
    session: GameSession;

    @Column({name: 'session_id'})
    session_id: string;

    @Column({length: 30})
    nickname: string;
    @Column({type:'uuid',nullable:true})
    activeQuestionId: string | null;
    @Column({type:'timestamptz',nullable:true})
    questionStartedAt: Date | null;
    @Column({ name: 'student_id', type: 'int', nullable: true })
    studentId: number | null;

    @Column({nullable: true})
    socketId?: string;

    @Column({default: 0})
    totalScore: number;
    @Column({ name: 'integrity_events', type: 'int', default: 0 })
    integrityEvents: number;

    @Column({ type: 'int', default: 0 })
    currentQuestionIndex: number;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    eliminatedAt: Date | null;

    @Column({ name: 'question_order', type: 'jsonb', nullable: true })
    questionOrder: string[] | null;

    @ManyToOne(() => SessionTeam, (team) => team.players, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'team_id' })
    team: SessionTeam | null;

    @Column({ name: 'team_id', nullable: true })
    teamId: string | null;

    @OneToMany(() => PlayerAnswer, (a) => a.player)
    answers: PlayerAnswer[];

    @CreateDateColumn()
    joinedAt: Date;
}
