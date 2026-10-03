import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, IsNotEmpty, Matches, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRoutineDto {
  @IsIn(['morning', 'night'])
  type: 'morning' | 'night';
}

export class CreateRoutineStepDto {
  @IsIn(['morning', 'night', 'both'])
  type: 'morning' | 'night' | 'both';

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  customName?: string;

  @IsOptional()
  @IsIn(['daily', 'alternate', 'twice_weekly'])
  frequency?: 'daily' | 'alternate' | 'twice_weekly';
}

export class StreakHistoryQueryDto {
  /** YYYY-MM */
  @IsString()
  @IsNotEmpty()
  month: string;
}

export class UpdateRoutineStepDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  customName?: string;

  @IsOptional()
  @IsIn(['daily', 'alternate', 'twice_weekly'])
  frequency?: 'daily' | 'alternate' | 'twice_weekly';
}

export class HistoryDayDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsIn(['both', 'one'])
  status: 'both' | 'one';
}

export class ImportHistoryDto {
  @IsArray()
  @ArrayMaxSize(400)
  @ValidateNested({ each: true })
  @Type(() => HistoryDayDto)
  days: HistoryDayDto[];
}
