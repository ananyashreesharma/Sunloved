import { IsString, IsNotEmpty, IsEmail, Matches, Length, IsArray, ArrayMaxSize, IsOptional, IsIn, MaxLength } from 'class-validator';

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
  @IsIn(['google', 'apple'])
  provider: 'google' | 'apple';

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  providerId: string;

  // Undecorated, the global whitelist rejected these, so every Google/Apple sign-in got a 400.
  // NextAuth sends null for fields the provider leaves out.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  avatarUrl?: string | null;
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
