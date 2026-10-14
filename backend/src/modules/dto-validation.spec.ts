// Inputs that used to be rejected wrongly (OAuth sign-in) or reach the database and fail as a 500.
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpsertOAuthUserDto } from './auth/dto/auth.dto';
import { CreateRoutineStepDto, StreakHistoryQueryDto } from './ouma/dto/routine.dto';
import { UpdateNotificationPreferencesDto, SaveScanDto } from './ouma/dto/notification-preferences.dto';

// Same options as the global ValidationPipe in main.ts.
function errors<T extends object>(cls: new () => T, body: object): string[] {
  return validateSync(plainToInstance(cls, body) as object, { whitelist: true, forbidNonWhitelisted: true }).map((e) => e.property);
}

describe('UpsertOAuthUserDto', () => {
  it('accepts what NextAuth sends after Google sign-in', () => {
    expect(errors(UpsertOAuthUserDto, { provider: 'google', providerId: '1', name: 'Asha', email: 'a@x.test', avatarUrl: null })).toEqual([]);
  });
  it('rejects other providers and bad emails', () => {
    expect(errors(UpsertOAuthUserDto, { provider: 'github', providerId: '1' })).toContain('provider');
    expect(errors(UpsertOAuthUserDto, { provider: 'google', providerId: '1', email: 'nope' })).toContain('email');
  });
});

describe('routine DTOs', () => {
  it.each(['00:00', '07:30', '23:59'])('accepts reminder time %s', (t) => {
    expect(errors(UpdateNotificationPreferencesDto, { morningTime: t, nightTime: t })).toEqual([]);
  });
  it.each(['24:00', '99:99', '7:30', '12:60'])('rejects reminder time %s', (t) => {
    expect(errors(UpdateNotificationPreferencesDto, { morningTime: t })).toContain('morningTime');
  });
  it.each(['garbage', '2026-13', '2026-00', '2026-1'])('rejects month %s', (month) => {
    expect(errors(StreakHistoryQueryDto, { month })).toContain('month');
  });
  it('accepts a real month', () => {
    expect(errors(StreakHistoryQueryDto, { month: '2026-10' })).toEqual([]);
  });
  it('caps step names and scan text', () => {
    expect(errors(CreateRoutineStepDto, { type: 'night', customName: 'a'.repeat(121) })).toContain('customName');
    expect(errors(SaveScanDto, { rawIngredientText: 'a'.repeat(10001), scanResult: {}, flagCount: 0 })).toContain('rawIngredientText');
  });
});
