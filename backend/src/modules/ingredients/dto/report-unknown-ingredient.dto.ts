import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class ReportUnknownIngredientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  context?: string;
}
