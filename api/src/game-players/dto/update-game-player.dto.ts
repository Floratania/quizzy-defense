import { PartialType } from '@nestjs/mapped-types';
import { CreateGamePlayerDto } from './create-game-player.dto';

export class UpdateGamePlayerDto extends PartialType(CreateGamePlayerDto) {}
