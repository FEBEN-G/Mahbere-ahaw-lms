import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'student@mahbereahaw.org' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Abebe' })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: 'Kebede' })
  @IsString()
  @MinLength(2)
  lastName!: string;

  @ApiPropertyOptional({ example: 'STU-2026-001' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  studentCode?: string;

  @ApiPropertyOptional({
    description:
      'Cohort start date (ISO). Defaults to now. Drives monthly drip unlock.',
  })
  @IsOptional()
  @IsDateString()
  cohortStartedAt?: string;
}
