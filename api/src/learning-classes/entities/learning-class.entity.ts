import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity({name:'learning_classes'})
export class LearningClass {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({length:100}) name:string;
 @Column({name:'teacher_id'}) teacherId:number;
 @Column({name:'join_code',length:12,unique:true}) joinCode:string;
 @CreateDateColumn() createdAt:Date;
}
