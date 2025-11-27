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

    @Column({nullable: true})
    socketId?: string;

    @Column({default: 0})
    totalScore: number;

    @OneToMany(() => PlayerAnswer, (a) => a.player)
    answers: PlayerAnswer[];

    @CreateDateColumn()
    joinedAt: Date;
}
