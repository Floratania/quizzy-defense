import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GameSession } from '@/game-sessions/entities/game-session.entity';
import { GamePlayer } from '@/game-players/entities/game-player.entity';

@Entity({ name: 'session_teams' })
export class SessionTeam {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => GameSession, (session) => session.teams, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'session_id' })
    session: GameSession;

    @Column({ name: 'session_id' })
    sessionId: string;

    @Column({ length: 50 })
    name: string;

    @Column({ type: 'int', default: 0 })
    position: number;

    @Column({ name: 'join_code', type: 'varchar', length: 12, nullable: true, unique: true })
    joinCode: string | null;

    @OneToMany(() => GamePlayer, (player) => player.team)
    players: GamePlayer[];
}
