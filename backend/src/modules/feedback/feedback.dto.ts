import { IsEmail, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

/** A message from "Talk to me". The reply address is optional. */
export class SendFeedbackDto {
  @IsString()
  @Length(2, 4000)
  message!: string;

  @IsOptional()
  @IsEmail()
  replyTo?: string;

  @IsOptional()
  @Matches(/^[A-Z]{2}$/)
  country?: string;

  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  platform?: string;
}
