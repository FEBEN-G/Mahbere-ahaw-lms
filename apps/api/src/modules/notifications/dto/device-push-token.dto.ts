import { DevicePlatform } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDevicePushTokenDto {
  @IsString()
  @MinLength(16)
  token!: string;

  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class DeleteDevicePushTokenDto {
  @IsString()
  @MinLength(16)
  token!: string;
}
