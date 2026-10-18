import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@/users/entities/user.entity';
@Injectable()
export class TeacherGuard implements CanActivate {
    constructor(private readonly data: DataSource) {}
    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const user = request.user?.id && await this.data.getRepository(User).findOneBy({id:request.user.id});
        if (!user || !['TEACHER','ADMIN'].includes(user.role)) throw new ForbiddenException('Потрібен підтверджений акаунт викладача');
        request.user.role = user.role;
        return true;
    }
}
