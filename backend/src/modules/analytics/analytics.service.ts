import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { TrackEventDto } from './analytics.dto';

const DAY = 86_400_000;

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(dto: TrackEventDto, userId?: string) {
    await this.prisma.analyticsEvent.create({
      data: {
        eventType: dto.type,
        sessionId: dto.installId,
        userId: userId ?? null,
        properties: { platform: dto.platform ?? null, detail: dto.detail ?? null, country: dto.country ?? null },
      },
    });
    return { ok: true };
  }

  /**
   * The three numbers that say whether SkinLens is working, for installs first seen in the
   * last `days` days:
   * 1. Checked a label within 60 seconds of first opening the app.
   * 2. Still active a week later (any event on days 7-13 after the first open).
   * 3. Nightly routine completion: share of active install-days with a night routine completed.
   */
  async metrics(days = 30) {
    const since = new Date(Date.now() - days * DAY);
    const firstOpens = await this.prisma.analyticsEvent.findMany({
      where: { eventType: 'app_first_open', occurredAt: { gte: since } },
      select: { sessionId: true, occurredAt: true },
    });
    const installs = new Map<string, Date>();
    for (const e of firstOpens) if (e.sessionId && !installs.has(e.sessionId)) installs.set(e.sessionId, e.occurredAt);
    const ids = [...installs.keys()];
    const events = ids.length
      ? await this.prisma.analyticsEvent.findMany({
          where: { sessionId: { in: ids } },
          select: { sessionId: true, eventType: true, occurredAt: true, properties: true },
        })
      : [];

    let checkedFast = 0;
    let weekEligible = 0;
    let weekRetained = 0;
    const activeDays = new Set<string>();
    const nightDays = new Set<string>();
    for (const [id, first] of installs) {
      const mine = events.filter((e) => e.sessionId === id);
      if (mine.some((e) => e.eventType === 'label_checked' && e.occurredAt.getTime() - first.getTime() <= 60_000)) checkedFast++;
      if (Date.now() - first.getTime() >= 14 * DAY) {
        weekEligible++;
        if (mine.some((e) => { const d = (e.occurredAt.getTime() - first.getTime()) / DAY; return d >= 7 && d < 14; })) weekRetained++;
      }
      for (const e of mine) {
        const day = `${id}:${e.occurredAt.toISOString().slice(0, 10)}`;
        activeDays.add(day);
        const p = (e.properties ?? {}) as Record<string, unknown>;
        if (e.eventType === 'routine_completed' && p.detail === 'night') nightDays.add(day);
      }
    }
    const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : null);
    return {
      periodDays: days,
      newInstalls: installs.size,
      checkedLabelInFirstMinute: { count: checkedFast, percent: pct(checkedFast, installs.size) },
      activeAfterOneWeek: { eligible: weekEligible, count: weekRetained, percent: pct(weekRetained, weekEligible), goalPercent: 25 },
      nightlyRoutineCompletion: { activeDays: activeDays.size, nightsCompleted: nightDays.size, percent: pct(nightDays.size, activeDays.size) },
    };
  }
}
