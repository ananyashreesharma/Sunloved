import { IsString, Length, Matches } from 'class-validator';

/** A label checked in the app, sent anonymously to the catalogue review queue. */
export class SubmitLabelDto {
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  country!: string;

  @IsString()
  @Length(2, 120)
  name!: string;

  @IsString()
  @Length(3, 20000)
  ingredients!: string;
}
