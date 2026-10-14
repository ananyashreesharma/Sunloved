import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InternalKeyGuard } from './internal-key.guard';

const ctx = (headers: Record<string, string>) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ headers }) }) }) as unknown as ExecutionContext;

describe('InternalKeyGuard', () => {
  const guard = new InternalKeyGuard();
  const saved = process.env.INTERNAL_API_KEY;
  afterEach(() => {
    process.env.INTERNAL_API_KEY = saved;
  });

  it('lets the right key through', () => {
    process.env.INTERNAL_API_KEY = 'secret';
    expect(guard.canActivate(ctx({ 'x-internal-api-key': 'secret' }))).toBe(true);
  });
  it.each([{}, { 'x-internal-api-key': 'wrong' }, { 'x-internal-api-key': 'secre' }, { 'x-internal-api-key': '' }])(
    'refuses %j',
    (headers) => {
      process.env.INTERNAL_API_KEY = 'secret';
      expect(() => guard.canActivate(ctx(headers))).toThrow(UnauthorizedException);
    },
  );
  it('refuses everything when no key is configured', () => {
    delete process.env.INTERNAL_API_KEY;
    expect(() => guard.canActivate(ctx({ 'x-internal-api-key': '' }))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(ctx({ 'x-internal-api-key': 'undefined' }))).toThrow(UnauthorizedException);
  });
});
