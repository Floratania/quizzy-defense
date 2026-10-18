import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity({name:'class_students'})
export class ClassStudent {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({name:'class_id'}) classId:string;
 @Column({name:'student_id'}) studentId:number;
 @CreateDateColumn() createdAt:Date;
}
