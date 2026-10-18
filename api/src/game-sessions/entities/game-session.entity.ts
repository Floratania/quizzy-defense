import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn, JoinColumn,
} from 'typeorm';
import {Quiz} from "@/quizzes/entities/quiz.entity";
import {GamePlayer} from "@/game-players/entities/game-player.entity";
import {User} from "@/users/entities/user.entity";
import {SessionTeam} from "@/game-teams/entities/session-team.entity";

export enum GameSessionStatus {
    WAITING = 'WAITING',
    RUNNING = 'RUNNING',
    FINISHED = 'FINISHED',
}

export enum GameMode {
    CLASSIC = 'CLASSIC',
    TEAM = 'TEAM',
    PROGRESS = 'PROGRESS',
    SURVIVAL = 'SURVIVAL',
    TOURNAMENT = 'TOURNAMENT',
}

@Entity({ name: 'game_sessions' })
export class GameSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Quiz, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'quiz_id' })
    quiz: Quiz;

    @Column({ name: 'quiz_id'})
    quizId: string;

    @Column({ length: 12, unique: true })
    roomCode: string;

    @Column({
        type: 'enum',
        enum: GameSessionStatus,
        default: GameSessionStatus.WAITING,
    })
    status: GameSessionStatus;

    @Column({ type: 'enum', enum: GameMode, default: GameMode.CLASSIC })
    mode: GameMode;

    @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
    settings: Record<string, unknown>;

    @ManyToOne(() => User, (user) => user.gameSessions, {nullable: false})
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({name: 'user_id'})
    userId: number;

    @OneToMany(() => GamePlayer, (p) => p.session)
    players: GamePlayer[];

    @OneToMany(() => SessionTeam, (team) => team.session)
    teams: SessionTeam[];

    @Column({ type: 'int', default: 0 })
    currentQuestionIndex: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
