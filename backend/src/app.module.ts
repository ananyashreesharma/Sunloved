import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './modules/products/products.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { ComparisonsModule } from './modules/comparisons/comparisons.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database
    PrismaModule,
    
    // Feature modules
    ProductsModule,
    IngredientsModule,
    ComparisonsModule,
    PricingModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

