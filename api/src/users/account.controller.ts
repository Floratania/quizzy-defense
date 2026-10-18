import { Body, Controller, ForbiddenException, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IsIn, IsInt, Min } from 'class-validator';
import { User } from './entities/user.entity';
import { AuthGuard } from '@/guards/auth.guard';
class SetRoleDto { @IsInt() @Min(1) userId:number; @IsIn(['STUDENT','TEACHER']) role:'STUDENT'|'TEACHER'; }
@Controller('account') @UseGuards(AuthGuard)
export class AccountController {
 constructor(private data:DataSource) {}
 private async admin(id:number) { const u=await this.data.getRepository(User).findOneBy({id}); if(u?.role!=='ADMIN')throw new ForbiddenException('Лише адміністратор підтверджує викладачів'); }
 @Post('teacher-request') async request(@Req()r) { const repo=this.data.getRepository(User); const u=await repo.findOneByOrFail({id:r.user.id}); if(u.role==='STUDENT')await repo.update(u.id,{teacherRequested:true}); return {requested:true}; }
 @Get('users') async users(@Req()r) { await this.admin(r.user.id); return this.data.getRepository(User).find({select:{id:true,name:true,email:true,role:true,teacherRequested:true},order:{id:'DESC'}}); }
 @Patch('role') async role(@Req()r,@Body()dto:SetRoleDto) { await this.admin(r.user.id); return this.data.transaction(async manager=>{ const repo=manager.getRepository(User);const target=await repo.findOneByOrFail({id:dto.userId});if(target.role==='ADMIN')throw new ForbiddenException('Роль адміністратора не змінюється тут');await repo.update(target.id,{role:dto.role,teacherRequested:false});if(dto.role==='STUDENT') {await manager.query('DELETE FROM question_bank_access WHERE member_id=$1',[target.id]);await manager.query('DELETE FROM quiz_collaborators WHERE "userId"=$1',[target.id]);}return {id:target.id,role:dto.role}; }); }
}
