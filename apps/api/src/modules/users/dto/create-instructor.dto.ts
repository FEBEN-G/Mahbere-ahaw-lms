import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateInstructorDto {
  @ApiProperty({ example: 'instructor@mahbereahaw.org' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Sara' })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: 'Bekele' })
  @IsString()
  @MinLength(2)
  lastName!: string;

  @ApiPropertyOptional({ example: 'Theology Instructor' })
  @IsOptional()
  @IsString()
  title?: string;
}
