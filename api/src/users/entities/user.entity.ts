import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Quiz} from "@/quizzes/entities/quiz.entity";
import {GameSession} from "@/game-sessions/entities/game-session.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'student_code', type: 'varchar', length: 15, unique: true, default: () => "'QZ-' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 12))" })
    studentCode: string;

    @Column({name: 'personal_data_consent_at', type: 'timestamptz', nullable: true})
    personalDataConsentAt: Date | null;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    password?: string;

    @Column({ type: 'varchar', length: 20, default: 'STUDENT' })
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';

    @Column({ default: false }) teacherRequested: boolean;

    @Column({ default: false }) teacherPromptSeen: boolean;

    @Column({ name: 'managed_by_teacher_id', type: 'int', nullable: true }) managedByTeacherId: number | null;

    @OneToMany(() => Quiz, (quiz) => quiz.user)
    quizzes: Quiz[];

    @OneToMany(() => GameSession, (gameSession) => gameSession.user)
    gameSessions: Quiz[];
}
