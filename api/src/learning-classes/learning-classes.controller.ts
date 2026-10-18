import {Body,Controller,Get,Param,Patch,Post,Req,UseGuards} from '@nestjs/common';
import {AuthGuard} from '@/guards/auth.guard';import {LearningClassesService} from './learning-classes.service';
@Controller('learning-classes') export class LearningClassesController {constructor(private service:LearningClassesService){}
 @UseGuards(AuthGuard) @Get() all(@Req()r){return this.service.all(r.user.id)}
 @UseGuards(AuthGuard) @Post() create(@Body()d:{name:string},@Req()r){return this.service.create(d.name,r.user.id)}
 @UseGuards(AuthGuard) @Post(':id/students') student(@Param('id')id:string,@Body()d:{name:string,email:string,password:string},@Req()r){return this.service.addStudent(id,r.user.id,d)}
 @UseGuards(AuthGuard) @Patch(':id/students/:studentId') updateStudent(@Param('id')id:string,@Param('studentId')studentId:string,@Body()d:{name?:string,email?:string,password?:string},@Req()r){return this.service.updateStudent(id,Number(studentId),r.user.id,d)}
 @UseGuards(AuthGuard) @Post(':id/assignments') assign(@Param('id')id:string,@Body()d:any,@Req()r){return this.service.assign(id,r.user.id,d)}
 @Get('assignment/:token') assignment(@Param('token')token:string){return this.service.assignment(token)}
}
