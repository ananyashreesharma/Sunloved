import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Min, Matches, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'morningTime must be HH:mm' })
  morningTime?: string | null;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'nightTime must be HH:mm' })
  nightTime?: string | null;

  @IsOptional()
  @IsIn(['push', 'whatsapp'])
  channel?: 'push' | 'whatsapp';

  @IsOptional()
  @IsIn(['coach', 'plain', 'off'])
  reminderTone?: 'coach' | 'plain' | 'off';

  @IsOptional()
  @IsBoolean()
  muted?: boolean;
}

export class SaveScanDto {
  @IsString()
  @MaxLength(10000)
  rawIngredientText: string;

  @IsObject()
  scanResult: Record<string, unknown>;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  flagCount: number;

  @IsOptional()
  @IsString()
  productId?: string;
}
