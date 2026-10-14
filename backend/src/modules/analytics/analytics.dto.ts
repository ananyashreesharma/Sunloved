import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/** The only events we record. No ingredient text, names or emails: just what happened, and when. */
export const EVENT_TYPES = ['app_first_open', 'label_checked', 'routine_step_ticked', 'routine_completed', 'account_created'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export class TrackEventDto {
  @IsIn(EVENT_TYPES as unknown as string[])
  type: EventType;

  /** Random per-install id made on the device; not linked to a person unless they sign in. */
  @Matches(/^[a-zA-Z0-9-]{8,64}$/)
  installId: string;

  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  platform?: string;

  /** For routine events: which routine. For label_checked: the verdict. Nothing free-form. */
  @IsOptional()
  @IsIn(['morning', 'night', 'GREEN', 'YELLOW', 'RED', 'NONE'])
  detail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;
}
