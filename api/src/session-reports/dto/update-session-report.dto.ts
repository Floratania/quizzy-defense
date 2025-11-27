import { PartialType } from '@nestjs/mapped-types';
import { CreateSessionReportDto } from './create-session-report.dto';

export class UpdateSessionReportDto extends PartialType(CreateSessionReportDto) {}
