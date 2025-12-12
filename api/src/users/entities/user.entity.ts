import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Quiz} from "@/quizzes/entities/quiz.entity";
import {GameSession} from "@/game-sessions/entities/game-session.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    password?: string;

    @OneToMany(() => Quiz, (quiz) => quiz.user)
    quizzes: Quiz[];

    @OneToMany(() => GameSession, (gameSession) => gameSession.user)
    gameSessions: Quiz[];
}
