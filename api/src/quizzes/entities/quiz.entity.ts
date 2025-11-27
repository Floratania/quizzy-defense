import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import {Question} from "@/questions/entities/question.entity";
import {User} from "@/users/entities/user.entity";

@Entity({ name: 'quizzes' })
export class Quiz {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @OneToMany(() => Question, (q) => q.quiz, { cascade: true })
    questions: Question[];

    @ManyToOne(() => User, (user) => user.quizzes, {nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({name: 'user_id'})
    userId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}
