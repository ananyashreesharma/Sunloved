import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Min, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'morningTime must be HH:mm' })
  morningTime?: string | null;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'nightTime must be HH:mm' })
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
