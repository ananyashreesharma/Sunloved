/**
 * Full Sunloved product category tree (handoff April 2026).
 * Run: npx ts-node prisma/seed-categories.ts
 * Or: imported from seed.ts
 */
import { PrismaClient } from '@prisma/client';

export type ProductCategorySeedNode = {
  slug: string;
  name: string;
  depth: number;
  sortOrder: number;
  description?: string;
  isActive?: boolean;
  children?: ProductCategorySeedNode[];
};

const L = (
  slug: string,
  name: string,
  sortOrder: number,
): ProductCategorySeedNode => ({ slug, name, depth: 2, sortOrder });

const G = (
  slug: string,
  name: string,
  sortOrder: number,
  children: ProductCategorySeedNode[],
): ProductCategorySeedNode => ({ slug, name, depth: 1, sortOrder, children });

const R = (
  slug: string,
  name: string,
  sortOrder: number,
  children: ProductCategorySeedNode[],
  isActive?: boolean,
): ProductCategorySeedNode => ({
  slug,
  name,
  depth: 0,
  sortOrder,
  children,
  ...(isActive === false ? { isActive: false } : {}),
});

export const PRODUCT_CATEGORY_TREE: ProductCategorySeedNode[] = [
  R('skincare', 'Skincare', 1, [
    G('skincare-cleansers', 'Cleansers', 1, [
      L('face-wash', 'Face Wash', 1),
      L('micellar-water', 'Micellar Water', 2),
      L('cleansing-balm', 'Cleansing Balm', 3),
      L('cleansing-oil', 'Cleansing Oil', 4),
      L('face-scrub', 'Face Scrub', 5),
      L('cleansing-mousse', 'Cleansing Mousse', 6),
    ]),
    G('skincare-toners', 'Toners & Essences', 2, [
      L('toner', 'Toner', 1),
      L('essence', 'Essence', 2),
      L('facial-mist', 'Facial Mist', 3),
      L('toning-pad', 'Toning Pads', 4),
    ]),
    G('skincare-treatments', 'Treatments', 3, [
      L('face-serum', 'Face Serum', 1),
      L('face-ampoule', 'Ampoule', 2),
      L('face-oil', 'Face Oil', 3),
      L('retinol-treatment', 'Retinol Treatment', 4),
      L('vitamin-c', 'Vitamin C', 5),
      L('aha-bha-pha', 'AHA / BHA / PHA', 6),
      L('niacinamide', 'Niacinamide', 7),
      L('eye-serum', 'Eye Serum', 8),
    ]),
    G('skincare-moisturisers', 'Moisturisers', 4, [
      L('gel-moisturiser', 'Gel Moisturiser', 1),
      L('cream-moisturiser', 'Cream Moisturiser', 2),
      L('lotion-moisturiser', 'Lotion', 3),
      L('night-cream', 'Night Cream', 4),
      L('eye-cream', 'Eye Cream', 5),
      L('lip-balm', 'Lip Balm', 6),
      L('face-mist-hydrating', 'Hydrating Mist', 7),
    ]),
    G('skincare-suncare', 'Sun Care', 5, [
      L('spf-sunscreen', 'Sunscreen / SPF', 1),
      L('tinted-spf', 'Tinted SPF', 2),
      L('spf-lip', 'SPF Lip Balm', 3),
      L('after-sun', 'After Sun', 4),
    ]),
    G('skincare-masks', 'Masks', 6, [
      L('sheet-mask', 'Sheet Mask', 1),
      L('clay-mask', 'Clay Mask', 2),
      L('overnight-mask', 'Overnight Mask', 3),
      L('peel-off-mask', 'Peel-Off Mask', 4),
      L('gel-mask', 'Gel Mask', 5),
      L('eye-patch', 'Eye Patches', 6),
    ]),
    G('skincare-exfoliators', 'Exfoliators', 7, [
      L('physical-exfoliator', 'Physical Exfoliator', 1),
      L('chemical-exfoliator', 'Chemical Exfoliator', 2),
      L('enzyme-exfoliator', 'Enzyme Exfoliator', 3),
    ]),
    G('skincare-lip', 'Lip Care', 8, [
      L('lip-scrub', 'Lip Scrub', 1),
      L('lip-mask', 'Lip Mask', 2),
      L('lip-serum', 'Lip Serum', 3),
    ]),
    G('skincare-tools', 'Skincare Tools', 9, [
      L('face-roller', 'Face Roller', 1),
      L('gua-sha', 'Gua Sha', 2),
      L('cleansing-brush', 'Cleansing Brush', 3),
      L('led-device', 'LED Device', 4),
    ]),
  ]),

  R('haircare', 'Haircare', 2, [
    G('haircare-cleansers', 'Cleansers', 1, [
      L('shampoo', 'Shampoo', 1),
      L('co-wash', 'Co-Wash', 2),
      L('clarifying-shampoo', 'Clarifying Shampoo', 3),
      L('dry-shampoo', 'Dry Shampoo', 4),
    ]),
    G('haircare-conditioning', 'Conditioning', 2, [
      L('conditioner', 'Conditioner', 1),
      L('hair-mask', 'Hair Mask', 2),
      L('deep-conditioner', 'Deep Conditioner', 3),
      L('leave-in-conditioner', 'Leave-In Conditioner', 4),
      L('hair-rinse', 'Hair Rinse', 5),
    ]),
    G('haircare-scalp', 'Scalp Care', 3, [
      L('scalp-serum', 'Scalp Serum', 1),
      L('scalp-scrub', 'Scalp Scrub', 2),
      L('scalp-tonic', 'Scalp Tonic', 3),
      L('anti-dandruff', 'Anti-Dandruff', 4),
    ]),
    G('haircare-treatments', 'Hair Treatments', 4, [
      L('hair-oil', 'Hair Oil', 1),
      L('hair-serum', 'Hair Serum', 2),
      L('hair-cream', 'Hair Cream', 3),
      L('heat-protectant', 'Heat Protectant', 4),
      L('hair-growth', 'Hair Growth', 5),
    ]),
    G('haircare-styling', 'Styling', 5, [
      L('hair-gel', 'Hair Gel', 1),
      L('hair-mousse', 'Hair Mousse', 2),
      L('hair-spray', 'Hair Spray', 3),
      L('hair-wax', 'Hair Wax', 4),
    ]),
  ]),

  R('bodycare', 'Bodycare', 3, [
    G('bodycare-cleansers', 'Cleansers', 1, [
      L('body-wash', 'Body Wash', 1),
      L('soap-bar', 'Soap Bar', 2),
      L('shower-oil', 'Shower Oil', 3),
      L('body-scrub', 'Body Scrub', 4),
    ]),
    G('bodycare-moisturisers', 'Moisturisers', 2, [
      L('body-lotion', 'Body Lotion', 1),
      L('body-butter', 'Body Butter', 2),
      L('body-oil', 'Body Oil', 3),
      L('body-gel', 'Body Gel', 4),
      L('body-cream', 'Body Cream', 5),
    ]),
    G('bodycare-suncare', 'Body Sun Care', 3, [
      L('body-spf', 'Body SPF', 1),
      L('body-after-sun', 'After Sun Body', 2),
    ]),
    G('bodycare-treatments', 'Body Treatments', 4, [
      L('stretch-mark', 'Stretch Mark', 1),
      L('body-serum', 'Body Serum', 2),
      L('body-exfoliator', 'Body Exfoliator', 3),
      L('intimate-care', 'Intimate Care', 4),
    ]),
    G('bodycare-deodorant', 'Deodorant', 5, [
      L('deodorant-stick', 'Deodorant Stick', 1),
      L('deodorant-spray', 'Deodorant Spray', 2),
      L('deodorant-cream', 'Deodorant Cream', 3),
      L('natural-deodorant', 'Natural Deodorant', 4),
    ]),
    G('bodycare-hand-foot', 'Hand & Foot', 6, [
      L('hand-cream', 'Hand Cream', 1),
      L('foot-cream', 'Foot Cream', 2),
      L('nail-care', 'Nail Care', 3),
      L('foot-scrub', 'Foot Scrub', 4),
    ]),
  ]),

  R('bath-body', 'Bath & Body', 4, [
    G('bath-body-soaks', 'Bath Soaks', 1, [
      L('bath-salts', 'Bath Salts', 1),
      L('bath-bomb', 'Bath Bombs', 2),
      L('bubble-bath', 'Bubble Bath', 3),
    ]),
  ]),

  R('makeup', 'Makeup', 5, [
    G('makeup-face', 'Face', 1, [
      L('foundation', 'Foundation', 1),
      L('concealer', 'Concealer', 2),
      L('primer', 'Primer', 3),
      L('blush', 'Blush', 4),
      L('bronzer', 'Bronzer', 5),
      L('setting-powder', 'Setting Powder', 6),
      L('setting-spray', 'Setting Spray', 7),
      L('bb-cc-cream', 'BB / CC Cream', 8),
    ]),
    G('makeup-eyes', 'Eyes', 2, [
      L('mascara', 'Mascara', 1),
      L('eyeliner', 'Eyeliner', 2),
      L('eyeshadow', 'Eyeshadow', 3),
      L('eyebrow', 'Eyebrow', 4),
    ]),
    G('makeup-lips', 'Lips', 3, [
      L('lipstick', 'Lipstick', 1),
      L('lip-gloss', 'Lip Gloss', 2),
      L('lip-liner', 'Lip Liner', 3),
      L('lip-tint', 'Lip Tint', 4),
    ]),
  ], false),

  R('wellness', 'Wellness', 6, [
    G('wellness-supplements', 'Supplements', 1, [
      L('collagen', 'Collagen', 1),
      L('biotin', 'Biotin', 2),
      L('skin-supplements', 'Skin Supplements', 3),
      L('hair-supplements', 'Hair Supplements', 4),
    ]),
    G('wellness-ayurvedic', 'Ayurvedic', 2, [
      L('ayurvedic-oil', 'Ayurvedic Oil', 1),
      L('ubtan', 'Ubtan', 2),
      L('kumkumadi', 'Kumkumadi', 3),
      L('herbal-pack', 'Herbal Pack', 4),
    ]),
  ]),
];

async function seedCategoryNode(
  prisma: PrismaClient,
  node: ProductCategorySeedNode,
  parentId: string | null,
): Promise<void> {
  const { children, ...fields } = node;
  const row = await prisma.productCategory.upsert({
    where: { slug: node.slug },
    update: {
      name: fields.name,
      description: fields.description ?? null,
      depth: fields.depth,
      sortOrder: fields.sortOrder,
      isActive: fields.isActive ?? true,
      parentId,
    },
    create: {
      name: fields.name,
      slug: fields.slug,
      description: fields.description ?? null,
      depth: fields.depth,
      sortOrder: fields.sortOrder,
      isActive: fields.isActive ?? true,
      parentId,
    },
  });
  if (children?.length) {
    for (const ch of children) {
      await seedCategoryNode(prisma, ch, row.id);
    }
  }
}

export async function seedProductCategories(prisma: PrismaClient): Promise<void> {
  console.log('📂 Seeding product_categories tree...');
  for (const root of PRODUCT_CATEGORY_TREE) {
    await seedCategoryNode(prisma, root, null);
  }
  console.log('✅ Product categories seeded.');
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedProductCategories(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
