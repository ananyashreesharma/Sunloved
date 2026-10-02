import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ProductsModule } from './modules/products/products.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { ComparisonsModule } from './modules/comparisons/comparisons.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { AdminModule } from './modules/admin/admin.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { OumaModule } from './modules/ouma/ouma.module';
import { AuthModule } from './modules/auth/auth.module';
import { EnrichmentModule } from './modules/enrichment/enrichment.module';
import { ContributionsModule } from './modules/contributions/contributions.module';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),

    // Generous global default — basic flood/bot protection on every route, deliberately loose
    // enough not to interfere with normal app usage (e.g. rapid ingredient-analyze calls while
    // typing). The OTP endpoints layer stricter per-route @Throttle() limits plus per-identifier
    // DB-backed checks in AuthService on top of this (see auth.service.ts) — this alone is not
    // what stops someone spamming a specific victim's email/phone from many IPs.
    // errorMessage overrides @nestjs/throttler's default rejection text, which is literally the
    // string "ThrottlerException: Too Many Requests" — that leaks straight through
    // AllExceptionsFilter to client error states verbatim (e.g. ScanResultScreen's `err` text) with
    // no way for a client to catch it separately, since it's a plain HttpException like any other.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      errorMessage: 'Too many requests. Please wait a moment and try again.',
    }),

    // Database
    PrismaModule,

    // Feature modules
    ProductsModule,
    IngredientsModule,
    ComparisonsModule,
    PricingModule,
    AdminModule,
    ScraperModule,
    OumaModule,
    AuthModule,
    EnrichmentModule,
    ContributionsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

