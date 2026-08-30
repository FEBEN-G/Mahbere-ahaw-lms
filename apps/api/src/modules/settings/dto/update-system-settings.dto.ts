import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateSystemSettingsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  dripDaysPerMonth!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  publishedCoursesPerMonth!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  maxUploadMb!: number;
}
