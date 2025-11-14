import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './modules/products/products.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Feature modules
    ProductsModule,
    IngredientsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

