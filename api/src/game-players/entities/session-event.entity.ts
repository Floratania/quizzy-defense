import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('session_events')
export class SessionEvent {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ type: 'uuid' }) sessionId: string;
    @Column({ type: 'uuid' }) playerId: string;
    @Column({ type: 'varchar', length: 30 }) nickname: string;
    @Column({ type: 'varchar', length: 30 }) type: string;
    @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
