import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class AnalyzeIngredientsDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Ingredients list must be at least 3 characters' })
  ingredients: string;
}

