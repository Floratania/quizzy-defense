import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Quiz} from "@/quizzes/entities/quiz.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @OneToMany(() => Quiz, (quiz) => quiz.user)
    quizzes: Quiz[];
}
