import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class SubmitContributionDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsNotEmpty()
  brandName: string;

  /** ISO 3166-1 alpha-2 country code, e.g. "IN" / "US" / "GB" — scopes which formulation this is */
  @IsString()
  @Length(2, 2)
  country: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  @IsNotEmpty()
  rawIngredientText: string;
}
