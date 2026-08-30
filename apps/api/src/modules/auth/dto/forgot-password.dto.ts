import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'student@mahbereahaw.org' })
  @IsEmail()
  email!: string;
}
