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

    @Column({ type: 'varchar', length: 20, default: 'STUDENT' })
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';

    @Column({ default: false }) teacherRequested: boolean;

    @OneToMany(() => Quiz, (quiz) => quiz.user)
    quizzes: Quiz[];

    @OneToMany(() => GameSession, (gameSession) => gameSession.user)
    gameSessions: Quiz[];
}
