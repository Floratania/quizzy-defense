import {PlayerAnswersModule} from '@/player-answers/player-answers.module';
import {StudentLearningService} from './student-learning.service';
import {AccountController} from './account.controller';
import {Module} from '@nestjs/common';
import {UsersService} from './users.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "@/users/entities/user.entity";

@Module({
    imports: [TypeOrmModule.forFeature([User]), PlayerAnswersModule],
    // Authentication routes expose only the signed-in user's public profile.
    // The generated CRUD controller has no authorization and is not used by the UI.
    controllers: [AccountController],
    providers: [UsersService, StudentLearningService],
})
export class UsersModule {
}
