import { Controller, Post, Body } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { AnalyzeIngredientsDto } from './dto/analyze-ingredients.dto';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  /**
   * POST /api/ingredients/analyze
   * Analyzes a comma-separated list of ingredients
   * 
   * Request body: { "ingredients": "Glycerin, Niacinamide, Hyaluronic Acid" }
   * Response: { data: { foundIngredients, unknownIngredients, actives, tags, ... }, meta: {} }
   */
  @Post('analyze')
  async analyze(@Body() dto: AnalyzeIngredientsDto) {
    return await this.ingredientsService.analyze(dto.ingredients);
  }
}

