import { PartialType } from '@nestjs/mapped-types';
import { CreatePlayerAnswerDto } from './create-player-answer.dto';

export class UpdatePlayerAnswerDto extends PartialType(CreatePlayerAnswerDto) {}
