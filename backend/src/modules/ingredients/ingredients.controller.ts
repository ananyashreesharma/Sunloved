import { Controller, Post, Body } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  // POST /api/ingredients/analyze
  @Post('analyze')
  analyze(@Body('ingredients') ingredients: string) {
    return this.ingredientsService.analyze(ingredients);
  }
}

