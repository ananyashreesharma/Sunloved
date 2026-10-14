import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class AnalyzeIngredientsDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Ingredients list must be at least 3 characters' })
  @MaxLength(5000, { message: 'Ingredients list is too long (max 5000 characters)' })
  ingredients: string;
}

