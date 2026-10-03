import { IsIn, IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

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
