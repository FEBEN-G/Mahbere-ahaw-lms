import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

class PushKeysDto {
  @IsString()
  p256dh!: string;

  @IsString()
  auth!: string;
}

export class CreatePushSubscriptionDto {
  @IsUrl({ require_tld: false })
  endpoint!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class DeletePushSubscriptionDto {
  @IsUrl({ require_tld: false })
  endpoint!: string;
}
