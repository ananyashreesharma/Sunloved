import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoutineType, StepFrequency, Streak } from '@prisma/client';
import { isDueOn } from './schedule';

/** Skincare step order, matched against Product.categoryLegacy (see scraper.service.ts's normalized labels). */
const CATEGORY_STEP_ORDER: Record<string, number> = {
  cleanser: 0,
  exfoliator: 1,
  toner: 2,
  essence: 3,
  serum: 4,
  treatment: 4,
  oil: 5,
  mask: 5,
  moisturizer: 6,
  sunscreen: 7,
};

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfUtcDay(a).getTime() - startOfUtcDay(b).getTime()) / 86_400_000);
}

/**
 * The stored counter only changes when a routine is completed, so after two missed days it is
 * stale: report 0 instead of yesterday's number. Same rule as packages/shared/src/streak.ts
 * (one missed day pauses the streak, a second ends it).
 */
function liveCurrentStreak(streak: Streak | null): number {
  if (!streak?.lastActiveDate) return 0;
  return daysBetween(new Date(), streak.lastActiveDate) <= 2 ? streak.currentStreak : 0;
}

@Injectable()
export class OumaService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateRoutine(userId: string, type: RoutineType) {
    let routine = await this.prisma.routine.findFirst({ where: { userId, type, isActive: true } });
    if (!routine) {
      routine = await this.prisma.routine.create({
        data: {
          userId,
          type,
          name: type === 'morning' ? 'AM routine' : type === 'night' ? 'PM routine' : 'Weekly routine',
        },
      });
    }
    return routine;
  }

  private async getOrCreateTodayLog(userId: string, routineId: string) {
    const logDate = startOfUtcDay(new Date());
    return this.prisma.routineLog.upsert({
      where: { userId_routineId_logDate: { userId, routineId, logDate } },
      update: {},
      create: { userId, routineId, logDate, completedStepIds: [] },
    });
  }

  private stepPosition(categoryLegacy: string | null | undefined, fallback: number): number {
    if (!categoryLegacy) return fallback;
    const rank = CATEGORY_STEP_ORDER[categoryLegacy.toLowerCase()];
    return rank ?? fallback;
  }

  /** Per-user, per-type routine: today's steps, done-state, and any ingredient conflicts among them. */
  async getRoutine(userId: string, type: 'morning' | 'night') {
    const routine = await this.getOrCreateRoutine(userId, type as RoutineType);
    const steps = await this.prisma.routineStep.findMany({
      where: { routineId: routine.id },
      orderBy: { stepOrder: 'asc' },
      include: {
        product: {
          include: {
            brand: true,
            ingredients: {
              where: { moderationStatus: 'approved' },
              include: { ingredient: true },
            },
          },
        },
      },
    });

    const todayLog = await this.getOrCreateTodayLog(userId, routine.id);
    const doneIds = new Set(todayLog.completedStepIds);

    // Cross-reference every ingredient across today's linked products against known conflicts.
    const ingredientIds = new Set<string>();
    const ingredientIdToStepId = new Map<string, string>();
    for (const step of steps) {
      for (const pi of step.product?.ingredients ?? []) {
        ingredientIds.add(pi.ingredientId);
        ingredientIdToStepId.set(pi.ingredientId, step.id);
      }
    }
    const conflictRows =
      ingredientIds.size > 1
        ? await this.prisma.ingredientConflict.findMany({
            where: {
              ingredientAId: { in: Array.from(ingredientIds) },
              ingredientBId: { in: Array.from(ingredientIds) },
            },
            include: { ingredientA: true, ingredientB: true },
          })
        : [];
    const conflicts = conflictRows
      .filter((c) => ingredientIds.has(c.ingredientAId) && ingredientIds.has(c.ingredientBId))
      .map((c) => ({
        ingredientAName: c.ingredientA.displayName ?? c.ingredientA.inciName,
        ingredientBName: c.ingredientB.displayName ?? c.ingredientB.inciName,
        severity: c.severity,
        reason: c.reason,
        timingNote: c.timingNote,
        stepIds: [ingredientIdToStepId.get(c.ingredientAId), ingredientIdToStepId.get(c.ingredientBId)].filter(
          Boolean,
        ),
      }));

    const stepDtos = steps.map((s) => ({
      id: s.id,
      productId: s.productId,
      name: s.customName ?? s.product?.name ?? 'Step',
      brand: s.product?.brand?.name ?? null,
      position: s.stepOrder,
      frequency: s.frequency,
      waitAfterMins: s.waitAfterMins,
      done: doneIds.has(s.id),
      // Rest day for an every-other-day or twice-a-week step: shown, but not counted.
      rest: !isDueOn(s.frequency, new Date()),
      // A linked product with no ingredient rows was never scanned/entered — prompt the user to enrich it.
      enrich: Boolean(s.productId) && (s.product?.ingredients.length ?? 0) === 0,
    }));

    return {
      routineId: routine.id,
      type,
      steps: stepDtos,
      allDone: stepDtos.some((s) => !s.rest) && stepDtos.every((s) => s.rest || s.done),
      conflicts,
    };
  }

  async createStep(
    userId: string,
    input: { type: 'morning' | 'night' | 'both'; productId?: string; customName?: string; frequency?: StepFrequency },
  ) {
    if (!input.productId && !input.customName) {
      throw new NotFoundException('Either productId or customName is required');
    }

    const types: RoutineType[] = input.type === 'both' ? ['morning', 'night'] : [input.type as RoutineType];
    const product = input.productId
      ? await this.prisma.product.findUnique({ where: { id: input.productId } })
      : null;

    const created: string[] = [];
    for (const type of types) {
      const routine = await this.getOrCreateRoutine(userId, type);
      const existing = await this.prisma.routineStep.findMany({
        where: { routineId: routine.id },
        orderBy: { stepOrder: 'asc' },
      });
      // Same product or same typed name already in this routine: don't add it twice (a double
      // submit, or a guest routine moved to the account more than once).
      const name = input.customName?.trim().toLowerCase();
      if (existing.some((e) => (input.productId && e.productId === input.productId) || (name && e.customName?.trim().toLowerCase() === name))) {
        continue;
      }
      const rank = this.stepPosition(product?.categoryLegacy, existing.length + 100);
      // Slot in after every existing step whose own rank is <= this one, keeping stepOrder contiguous.
      const insertAt = existing.length; // existing steps don't carry a stored rank, so append and let stepOrder reflect insertion order for now

      const step = await this.prisma.routineStep.create({
        data: {
          routineId: routine.id,
          productId: input.productId,
          customName: input.customName,
          stepOrder: rank < existing.length ? rank : insertAt,
          frequency: input.frequency ?? 'daily',
        },
      });
      created.push(step.id);
    }
    return { created };
  }

  private async ownedStep(userId: string, stepId: string) {
    const step = await this.prisma.routineStep.findUnique({ where: { id: stepId }, include: { routine: true } });
    if (!step || step.routine.userId !== userId) throw new NotFoundException('Step not found');
    return step;
  }

  /** Rename a step or change how often it's used (e.g. "Alternate them" for retinol and an acid). */
  async updateStep(userId: string, stepId: string, input: { customName?: string; frequency?: StepFrequency }) {
    await this.ownedStep(userId, stepId);
    const step = await this.prisma.routineStep.update({
      where: { id: stepId },
      data: {
        ...(input.customName !== undefined ? { customName: input.customName.trim() } : {}),
        ...(input.frequency ? { frequency: input.frequency } : {}),
      },
    });
    return { id: step.id, frequency: step.frequency, name: step.customName };
  }

  /** Remove a step from its routine. Streak history is untouched. */
  async deleteStep(userId: string, stepId: string) {
    await this.ownedStep(userId, stepId);
    await this.prisma.routineStep.delete({ where: { id: stepId } });
    return { deleted: stepId };
  }

  /** Toggle today's done-state for one step; marks the whole routine/day done once every step is checked. */
  async toggleStep(userId: string, stepId: string) {
    const step = await this.prisma.routineStep.findUnique({ where: { id: stepId } });
    if (!step) throw new NotFoundException('Step not found');
    const routine = await this.prisma.routine.findUnique({ where: { id: step.routineId } });
    if (!routine || routine.userId !== userId) throw new NotFoundException('Step not found');

    const allSteps = await this.prisma.routineStep.findMany({ where: { routineId: routine.id } });
    const log = await this.getOrCreateTodayLog(userId, routine.id);

    const wasDone = log.completedStepIds.includes(stepId);
    const nextCompleted = wasDone
      ? log.completedStepIds.filter((id) => id !== stepId)
      : [...log.completedStepIds, stepId];
    // Only steps due today count; rest days of alternating steps never block "done".
    const due = allSteps.filter((s) => isDueOn(s.frequency, new Date()));
    const allDone = due.length > 0 && due.every((s) => nextCompleted.includes(s.id));

    const wasFullyDoneBefore = log.completedAt != null;
    await this.prisma.routineLog.update({
      where: { id: log.id },
      data: {
        completedStepIds: nextCompleted,
        completedAt: allDone ? (log.completedAt ?? new Date()) : null,
      },
    });

    let streak = await this.prisma.streak.findUnique({ where: { userId } });
    if (allDone && !wasFullyDoneBefore) {
      streak = await this.bumpStreak(userId, streak);
    }

    return {
      done: !wasDone,
      allDone,
      streak: { currentStreak: liveCurrentStreak(streak), longestStreak: streak?.longestStreak ?? 0 },
    };
  }

  /**
   * Increments the streak at most once per calendar day, the first time any routine reaches 100%
   * completion that day. A single missed day pauses the count (frozen, not reset) — only a second
   * consecutive missed day resets it to 0. Unchecking a step later the same day never revokes credit.
   */
  private async bumpStreak(userId: string, streak: Streak | null) {
    const today = startOfUtcDay(new Date());
    if (!streak) {
      return this.prisma.streak.create({
        data: { userId, currentStreak: 1, longestStreak: 1, lastActiveDate: today, totalDaysCompleted: 1 },
      });
    }
    const gap = daysBetween(today, streak.lastActiveDate);
    if (gap === 0) {
      return streak; // already counted today via another routine
    }
    const nextCurrent = gap <= 2 ? streak.currentStreak + 1 : 1; // gap===1 consecutive; gap===2 one paused day, still resumes
    return this.prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: nextCurrent,
        longestStreak: Math.max(streak.longestStreak, nextCurrent),
        lastActiveDate: today,
        totalDaysCompleted: { increment: 1 },
      },
    });
  }

  async getStreak(userId: string) {
    const streak = await this.prisma.streak.findUnique({ where: { userId } });
    return {
      currentStreak: liveCurrentStreak(streak),
      longestStreak: streak?.longestStreak ?? 0,
      totalDaysCompleted: streak?.totalDaysCompleted ?? 0,
    };
  }

  async getStreakHistory(userId: string, month: string) {
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 1));
    const today = startOfUtcDay(new Date());

    const logs = await this.prisma.routineLog.findMany({
      where: { userId, logDate: { gte: start, lt: end } },
      include: { routine: true },
    });

    const byDay = new Map<string, { morning: boolean; night: boolean }>();
    for (const log of logs) {
      const key = log.logDate.toISOString().slice(0, 10);
      const entry = byDay.get(key) ?? { morning: false, night: false };
      if (log.routine.type === 'morning' && log.completedAt) entry.morning = true;
      if (log.routine.type === 'night' && log.completedAt) entry.night = true;
      byDay.set(key, entry);
    }

    // A routine type with no steps (e.g. only a night routine) doesn't count against a day, so
    // finishing the routines someone actually has is a full day. Same rule as the guest logic.
    const withSteps = await this.prisma.routine.findMany({
      where: { userId, deletedAt: null, steps: { some: {} } },
      select: { type: true },
    });
    const hasMorning = withSteps.some((r) => r.type === 'morning');
    const hasNight = withSteps.some((r) => r.type === 'night');

    const days: { date: string; status: 'both' | 'one' | 'paused' | 'future' }[] = [];
    for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      if (d > today) {
        days.push({ date: key, status: 'future' });
        continue;
      }
      const entry = byDay.get(key);
      const any = !!(entry?.morning || entry?.night);
      const full = any && (entry?.morning || !hasMorning) && (entry?.night || !hasNight);
      const status = full ? 'both' : any ? 'one' : 'paused';
      days.push({ date: key, status });
    }
    return { days };
  }

  /** Every product the user has ever added to a routine, plus whether/where it's in use and its last verdict. */
  async getProducts(userId: string) {
    const steps = await this.prisma.routineStep.findMany({
      where: { routine: { userId }, productId: { not: null } },
      include: { routine: true, product: { include: { brand: true } } },
    });

    const byProduct = new Map<string, { product: (typeof steps)[number]['product']; usage: Set<string> }>();
    for (const step of steps) {
      if (!step.product) continue;
      const existing = byProduct.get(step.product.id) ?? { product: step.product, usage: new Set<string>() };
      existing.usage.add(step.routine.type === 'morning' ? 'AM' : 'PM');
      byProduct.set(step.product.id, existing);
    }

    const productIds = Array.from(byProduct.keys());
    const scanRows = productIds.length
      ? await this.prisma.skinScanHistory.findMany({
          where: { userId, productId: { in: productIds } },
          orderBy: { scannedAt: 'desc' },
        })
      : [];
    const latestScanByProduct = new Map<string, (typeof scanRows)[number]>();
    for (const scan of scanRows) {
      if (scan.productId && !latestScanByProduct.has(scan.productId)) {
        latestScanByProduct.set(scan.productId, scan);
      }
    }

    return {
      products: Array.from(byProduct.values()).map(({ product, usage }) => ({
        id: product!.id,
        name: product!.name,
        brand: product!.brand.name,
        usage: Array.from(usage),
        scan: latestScanByProduct.get(product!.id)?.scanResult ?? null,
      })),
    };
  }

  async getNotificationPreferences(userId: string) {
    const pref = await this.prisma.notificationPreference.findUnique({ where: { userId } });
    return {
      morningTime: pref?.morningTime ?? null,
      nightTime: pref?.nightTime ?? null,
      channel: pref?.channel ?? 'push',
      reminderTone: pref?.reminderTone ?? 'coach',
      muted: pref?.muted ?? false,
    };
  }

  async updateNotificationPreferences(
    userId: string,
    input: {
      morningTime?: string | null;
      nightTime?: string | null;
      channel?: 'push' | 'whatsapp';
      reminderTone?: 'coach' | 'plain' | 'off';
      muted?: boolean;
    },
  ) {
    // Prisma's Time(6) columns just need any Date; only the time-of-day component is stored.
    const toTime = (t?: string | null) => (t ? new Date(`1970-01-01T${t}:00Z`) : null);
    const data = {
      ...(input.morningTime !== undefined && { morningTime: toTime(input.morningTime) }),
      ...(input.nightTime !== undefined && { nightTime: toTime(input.nightTime) }),
      ...(input.channel !== undefined && { channel: input.channel }),
      ...(input.reminderTone !== undefined && { reminderTone: input.reminderTone }),
      ...(input.muted !== undefined && { muted: input.muted }),
    };
    const pref = await this.prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    return this.getNotificationPreferences(pref.userId);
  }

  async saveScan(
    userId: string,
    input: { rawIngredientText: string; scanResult: unknown; flagCount: number; productId?: string },
  ) {
    const scan = await this.prisma.skinScanHistory.create({
      data: {
        userId,
        productId: input.productId,
        rawIngredientText: input.rawIngredientText,
        scanResult: input.scanResult as never,
        flagCount: input.flagCount,
      },
    });
    return { id: scan.id };
  }

  /** Last few saved scans for the "Recent scans" list — most recent first. */
  async getRecentScans(userId: string, limit = 8) {
    const rows = await this.prisma.skinScanHistory.findMany({
      where: { userId },
      orderBy: { scannedAt: 'desc' },
      take: limit,
      include: { product: { include: { brand: true } } },
    });

    return rows.map((row) => {
      const result = (row.scanResult ?? {}) as Record<string, unknown>;
      const bd = (result.bd ?? {}) as Record<string, unknown>;
      return {
        id: row.id,
        productId: row.productId,
        rawIngredientText: row.productId ? null : row.rawIngredientText,
        name: row.product?.name ?? (result.title as string | undefined) ?? 'Ingredient analysis',
        brand: row.product?.brand?.name ?? (result.brand as string | undefined) ?? null,
        score: typeof bd.score === 'number' ? bd.score : null,
        scannedAt: row.scannedAt,
      };
    });
  }

  async getInsightsSummary() {
    const [productCount, ingredientCount, pricedCount] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.ingredient.count(),
      this.prisma.product.count({
        where: { deletedAt: null, prices: { some: {} } },
      }),
    ]);

    const scoreAgg = await this.prisma.product.aggregate({
      where: { deletedAt: null, overallScore: { not: null } },
      _avg: { overallScore: true },
    });

    return {
      catalogProducts: productCount,
      catalogIngredients: ingredientCount,
      productsWithPrices: pricedCount,
      avgProductScore: scoreAgg._avg.overallScore != null ? Number(scoreAgg._avg.overallScore) : null,
    };
  }
}
