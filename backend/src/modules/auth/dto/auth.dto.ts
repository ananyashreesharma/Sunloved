import { IsString, IsNotEmpty, IsEmail, Matches, Length, IsArray, ArrayMaxSize, IsOptional } from 'class-validator';

export class SendOtpDto {
  /** E.164 Indian mobile number, e.g. +919876543210 */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'phone must be a valid Indian mobile number in E.164 format (+91XXXXXXXXXX)',
  })
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'phone must be a valid Indian mobile number in E.164 format',
  })
  phone: string;

  @IsString()
  @Length(6, 6, { message: 'code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'code must be exactly 6 digits' })
  code: string;
}

export class SendEmailOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyEmailOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Length(6, 6, { message: 'code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'code must be exactly 6 digits' })
  code: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class UpsertOAuthUserDto {
  @IsString()
  @IsNotEmpty()
  provider: 'google' | 'apple';

  @IsString()
  @IsNotEmpty()
  providerId: string;

  name?: string;
  email?: string;
  avatarUrl?: string;
}

export class CompleteOnboardingDto {
  /** SkinType.code, e.g. "combination" */
  @IsString()
  @IsNotEmpty()
  skinType: string;

  /** SkinConcern.code values, capped at 2 to match the onboarding UI */
  @IsArray()
  @ArrayMaxSize(2)
  @IsString({ each: true })
  concerns: string[];

  /** ISO 3166-1 alpha-2, e.g. "IN". Optional so older app builds keep working. */
  @IsOptional()
  @Matches(/^[A-Z]{2}$/)
  country?: string;
}

export class UpdateCountryDto {
  /** ISO 3166-1 alpha-2, e.g. "GB" */
  @Matches(/^[A-Z]{2}$/)
  country: string;
}
