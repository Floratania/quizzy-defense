import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import {User} from "@/users/entities/user.entity";

@Entity()
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: false })
    token: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @Column({ type: 'timestamp', nullable: false })
    expiresAt: Date;
}
