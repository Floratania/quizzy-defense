import {Injectable} from '@nestjs/common';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {FindOptionsWhere, Repository} from "typeorm";
import {User} from "./entities/user.entity";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {
    }

    async create(createUserDto: CreateUserDto) {
        const user = this.usersRepository.create(createUserDto);
        return await this.usersRepository.save(user);
    }

    findAll() {
        return `This action returns all users`;
    }

    async findOne(id: number) {
        return await this.usersRepository.findOne({
            where: { id },
        });
    }

    update(id: number, updateUserDto: UpdateUserDto) {
        return `This action updates a #${id} user`;
    }

    remove(id: number) {
        return `This action removes a #${id} user`;
    }

    async findUserByEmail(email: string): Promise<User | null> {
        const where: FindOptionsWhere<User> = { email };

        return this.usersRepository.findOne({ where });
    }
}
