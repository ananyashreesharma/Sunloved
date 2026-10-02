import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { EnrichmentService } from '../enrichment/enrichment.service';
import { SubmitContributionDto } from './dto/submit-contribution.dto';

const AUTO_PUBLISH_HOURS = 24;

@Injectable()
export class ContributionsService {
  constructor(
    private prisma: PrismaService,
    private ingredients: IngredientsService,
    private enrichment: EnrichmentService,
  ) {}

  /**
   * Crowdsourced "here's a product + its ingredient list" submission, scoped to a country since
   * the same product name can have a different formulation per market. New ProductIngredient
   * links start `pending` — they become visible in verdicts once an admin approves them or
   * AUTO_PUBLISH_HOURS elapses (see ContributionsCronService).
   */
  async submit(userId: string, dto: SubmitContributionDto) {
    let brand = await this.prisma.brand.findFirst({
      where: { name: { equals: dto.brandName, mode: 'insensitive' } },
    });
    if (!brand) {
      brand = await this.prisma.brand.create({ data: { name: dto.brandName } });
    }

    const country = dto.country.toUpperCase();

    let product = await this.prisma.product.findFirst({
      where: {
        brandId: brand.id,
        name: { equals: dto.productName, mode: 'insensitive' },
        country,
      },
    });
    if (!product) {
      product = await this.prisma.product.create({
        data: {
          name: dto.productName,
          brandId: brand.id,
          country,
          categoryLegacy: dto.category ?? 'Uncategorized',
          markets: [country],
          source: 'community_contribution',
        },
      });
    }

    const names = this.ingredients.parseIngredientNames(dto.rawIngredientText);

    const contribution = await this.prisma.productContribution.create({
      data: {
        userId,
        productId: product.id,
        rawIngredientText: dto.rawIngredientText,
        autoPublishAt: new Date(Date.now() + AUTO_PUBLISH_HOURS * 60 * 60 * 1000),
      },
    });

    let position = await this.prisma.productIngredient.count({ where: { productId: product.id } });
    let matched = 0;
    let aiEnriched = 0;

    for (const name of names) {
      let ingredient = await this.ingredients.findIngredientByName(name);

      if (ingredient) {
        matched++;
      } else {
        const enrichment = await this.enrichment.enrichIngredient(name);
        ingredient = await this.prisma.ingredient.create({
          data: {
            inciName: name,
            displayName: name,
            shortDescription: enrichment.shortDescription ?? undefined,
            zone: enrichment.zone ?? undefined,
            function: enrichment.function ?? undefined,
            source: 'ai_generated',
          },
        });
        aiEnriched++;
      }

      await this.prisma.productIngredient.upsert({
        where: { productId_ingredientId: { productId: product.id, ingredientId: ingredient.id } },
        create: {
          productId: product.id,
          ingredientId: ingredient.id,
          position: position++,
          moderationStatus: 'pending',
          contributionId: contribution.id,
        },
        update: {
          moderationStatus: 'pending',
          contributionId: contribution.id,
        },
      });
    }

    return {
      productId: product.id,
      contributionId: contribution.id,
      matched,
      aiEnriched,
      coverage: names.length > 0 ? (matched + aiEnriched) / names.length : 0,
      autoPublishAt: contribution.autoPublishAt,
    };
  }
}
