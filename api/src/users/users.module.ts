import {Module} from '@nestjs/common';
import {UsersService} from './users.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "@/users/entities/user.entity";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    // Authentication routes expose only the signed-in user's public profile.
    // The generated CRUD controller has no authorization and is not used by the UI.
    controllers: [],
    providers: [UsersService],
})
export class UsersModule {
}
