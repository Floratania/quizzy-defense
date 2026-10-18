import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity({name:'quiz_assignments'})
export class QuizAssignment {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({name:'class_id'}) classId:string;
 @Column({name:'quiz_id'}) quizId:string;
 @Column({length:64,unique:true}) token:string;
 @Column({name:'room_code',length:12}) roomCode:string;
 @Column({name:'due_at',type:'timestamp',nullable:true}) dueAt:Date|null;
 @Column({name:'max_attempts',default:1}) maxAttempts:number;
 @Column({name:'variant_settings',type:'jsonb',default:()=>"'{}'::jsonb"}) variantSettings:Record<string,unknown>;
 @CreateDateColumn() createdAt:Date;
}
