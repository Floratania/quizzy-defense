import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {GameSession} from "@/game-sessions/entities/game-session.entity";

@Entity({ name: 'session_reports' })
export class SessionReport {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'session_id' })
    sessionId: string;

    @ManyToOne(() => GameSession)
    @JoinColumn({ name: 'session_id' })
    session: GameSession;

    @Column({ type: 'jsonb' })
    summary: any;

    @Column({ type: 'jsonb' })
    players: any[];

    @Column({ type: 'jsonb' })
    questions: any[];

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @CreateDateColumn()
    createdAt: Date;
}
