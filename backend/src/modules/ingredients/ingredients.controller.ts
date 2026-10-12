import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { Throttle, seconds } from '@nestjs/throttler';
import { IngredientsService } from './ingredients.service';
import { AnalyzeIngredientsDto } from './dto/analyze-ingredients.dto';
import { ReportUnknownIngredientDto } from './dto/report-unknown-ingredient.dto';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  /**
   * POST /api/ingredients/analyze
   * Analyzes a comma-separated list of ingredients
   *
   * Request body: { "ingredients": "Glycerin, Niacinamide, Hyaluronic Acid" }
   * Response: { data: { foundIngredients, unknownIngredients, actives, tags, coverage, ... }, meta: {} }
   *
   * Public and unauthenticated by design (guests can scan without an account), so it gets its own
   * tighter-than-default throttle rather than relying on the global 120/min guard — one query per
   * parsed ingredient name with no upstream cost brake (no LLM call in here), so it's cheap to hammer.
   */
  @Post('analyze')
  @Throttle({ default: { limit: 20, ttl: seconds(60) } })
  async analyze(@Body() dto: AnalyzeIngredientsDto) {
    return await this.ingredientsService.analyze(dto.ingredients);
  }

  /** GET /api/ingredients/index: rated ingredients found in products (sitemap, ingredient pages). */
  @Get('index')
  index() {
    return this.ingredientsService.index();
  }

  /** GET /api/ingredients/page/:slug: one ingredient's public page data. */
  @Get('page/:slug')
  async page(@Param('slug') slug: string) {
    const page = await this.ingredientsService.page(slug.slice(0, 120));
    if (!page) throw new NotFoundException('Ingredient not found');
    return page;
  }

  /**
   * POST /api/ingredients/report-unknown
   * Crowdsourced signal for ingredient names our catalog doesn't recognize yet.
   */
  @Post('report-unknown')
  @Throttle({ default: { limit: 10, ttl: seconds(60) } })
  async reportUnknown(@Body() dto: ReportUnknownIngredientDto) {
    return await this.ingredientsService.reportUnknown(dto.name, dto.context);
  }
}

