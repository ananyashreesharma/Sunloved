import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to parse volume string into value and unit
function parseVolume(volumeStr: string): { value: number | null; unit: string | null } {
  if (!volumeStr) return { value: null, unit: null };
  const match = volumeStr.match(/^(\d+\.?\d*)\s*(ml|g|oz|fl oz|fl\.?\s*oz\.?)$/i);
  if (match) {
    return {
      value: parseFloat(match[1]),
      unit: match[2].toLowerCase().replace(/\./g, ''),
    };
  }
  return { value: null, unit: null };
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create brands first
  console.log('🏷️  Creating brands...');
  const brand1 = await prisma.brand.upsert({
    where: { name: 'The Ordinary' },
    update: {},
    create: {
      name: 'The Ordinary',
      isCrueltyFree: true,
      isVeganBrand: true,
    },
  });

  const brand2 = await prisma.brand.upsert({
    where: { name: 'Minimalist' },
    update: {},
    create: {
      name: 'Minimalist',
      isCrueltyFree: true,
      isVeganBrand: true,
    },
  });

  const brand3 = await prisma.brand.upsert({
    where: { name: 'La Roche-Posay' },
    update: {},
    create: {
      name: 'La Roche-Posay',
      isCrueltyFree: false,
      isVeganBrand: false,
    },
  });

  const brand4 = await prisma.brand.upsert({
    where: { name: 'Krave Beauty' },
    update: {},
    create: {
      name: 'Krave Beauty',
      isCrueltyFree: true,
      isVeganBrand: true,
    },
  });

  const brand5 = await prisma.brand.upsert({
    where: { name: 'CeraVe' },
    update: {},
    create: {
      name: 'CeraVe',
      isCrueltyFree: false,
      isVeganBrand: false,
    },
  });

  const brand6 = await prisma.brand.upsert({
    where: { name: "Paula's Choice" },
    update: {},
    create: {
      name: "Paula's Choice",
      isCrueltyFree: true,
      isVeganBrand: false,
    },
  });

  const brand7 = await prisma.brand.upsert({
    where: { name: 'Neutrogena' },
    update: {},
    create: {
      name: 'Neutrogena',
      isCrueltyFree: false,
      isVeganBrand: false,
    },
  });

  const brand8 = await prisma.brand.upsert({
    where: { name: 'Isntree' },
    update: {},
    create: {
      name: 'Isntree',
      isCrueltyFree: true,
      isVeganBrand: true,
    },
  });

  // Create products
  console.log('📦 Creating products...');
  const vol1 = parseVolume('30ml');
  const product1 = await prisma.product.create({
    data: {
      id: 'the-ordinary-niacinamide-10-zinc-1',
      name: 'Niacinamide 10% + Zinc 1%',
      brandId: brand1.id,
      volumeValue: vol1.value,
      volumeUnit: vol1.unit,
      description:
        'A lightweight serum containing niacinamide and zinc PCA. Hydrating and brightening formula with low irritation risk for most skin types.',
      category: 'Serum',
      pricePerUnit: 0.55,
      price: 16.5,
      imageUrl: 'https://example.com/ordinary-niacinamide.jpg',
      ethics: {
        create: {
          isCrueltyFree: true,
          isVegan: true,
          isFragranceFree: true,
          isAlcoholFree: true,
          isParabenFree: true,
          isSulfateFree: true,
          lastVerifiedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const vol2 = parseVolume('30ml');
  const product2 = await prisma.product.create({
    data: {
      id: 'minimalist-niacinamide-10',
      name: '10% Niacinamide Face Serum',
      brandId: brand2.id,
      volumeValue: vol2.value,
      volumeUnit: vol2.unit,
      description:
        'Simple niacinamide serum focused on oil control and texture. Lightweight and suitable for oily to combination skin.',
      category: 'Serum',
      pricePerUnit: 0.62,
      price: 18.6,
      imageUrl: 'https://example.com/minimalist-niacinamide.jpg',
      ethics: {
        create: {
          isCrueltyFree: true,
          isVegan: true,
          isFragranceFree: true,
          isAlcoholFree: true,
          isParabenFree: true,
          isSulfateFree: true,
          lastVerifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const vol3 = parseVolume('90ml');
  const product3 = await prisma.product.create({
    data: {
      id: 'la-roche-posay-anthelios',
      name: 'Anthelios Melt-in Milk',
      brandId: brand3.id,
      volumeValue: vol3.value,
      volumeUnit: vol3.unit,
      description:
        'Broad-spectrum chemical filters in a cosmetically elegant, fragrance-free formula suitable for daily use.',
      category: 'Sunscreen',
      pricePerUnit: 0.24,
      price: 21.6,
      imageUrl: 'https://example.com/lrp-anthelios.jpg',
      ethics: {
        create: {
          isCrueltyFree: false,
          isVegan: false,
          isFragranceFree: true,
          isAlcoholFree: false,
          isParabenFree: false,
          isSulfateFree: true,
          lastVerifiedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const vol4 = parseVolume('45ml');
  const product4 = await prisma.product.create({
    data: {
      id: 'krave-beauty-great-barrier-relief',
      name: 'Great Barrier Relief',
      brandId: brand4.id,
      volumeValue: vol4.value,
      volumeUnit: vol4.unit,
      description:
        'Focuses on barrier repair with tamanu oil, ceramides, and niacinamide. Free of fragrance and essential oils.',
      category: 'Serum',
      pricePerUnit: 0.62,
      price: 27.9,
      imageUrl: 'https://example.com/krave-barrier.jpg',
      ethics: {
        create: {
          isCrueltyFree: true,
          isVegan: true,
          isFragranceFree: true,
          isAlcoholFree: true,
          isParabenFree: true,
          isSulfateFree: true,
          lastVerifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const vol5 = parseVolume('454g');
  const product5 = await prisma.product.create({
    data: {
      id: 'cerave-moisturizing-cream',
      name: 'Moisturizing Cream',
      brandId: brand5.id,
      volumeValue: vol5.value,
      volumeUnit: vol5.unit,
      description:
        'Fragrance-free, non-comedogenic moisturizing cream with ceramides and hyaluronic acid. Ideal for dry to very dry skin.',
      category: 'Moisturizer',
      pricePerUnit: 0.09,
      price: 20,
      imageUrl: 'https://example.com/cerave-cream.jpg',
      ethics: {
        create: {
          isCrueltyFree: false,
          isVegan: false,
          isFragranceFree: true,
          isAlcoholFree: true,
          isParabenFree: true,
          isSulfateFree: true,
          lastVerifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const vol6 = parseVolume('20ml');
  const product6 = await prisma.product.create({
    data: {
      id: 'paulas-choice-niacinamide-booster',
      name: '10% Niacinamide Booster',
      brandId: brand6.id,
      volumeValue: vol6.value,
      volumeUnit: vol6.unit,
      description:
        'Lightweight niacinamide booster that reduces shine, minimizes pores, and improves skin texture. No fragrance or dyes.',
      category: 'Serum',
      pricePerUnit: 3.5,
      price: 70,
      imageUrl: 'https://example.com/paulas-choice-nia.jpg',
      ethics: {
        create: {
          isCrueltyFree: true,
          isVegan: false,
          isFragranceFree: true,
          isAlcoholFree: true,
          isParabenFree: false,
          isSulfateFree: true,
          lastVerifiedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const vol7 = parseVolume('200ml');
  const product7 = await prisma.product.create({
    data: {
      id: 'neutrogena-hydro-boost-toner',
      name: 'Hydro Boost Hydrating Toner',
      brandId: brand7.id,
      volumeValue: vol7.value,
      volumeUnit: vol7.unit,
      description:
        'Oil-free hydrating toner with hyaluronic acid. Lightweight and refreshing for all skin types.',
      category: 'Toner',
      pricePerUnit: 0.05,
      price: 10,
      imageUrl: 'https://example.com/neutrogena-toner.jpg',
      ethics: {
        create: {
          isCrueltyFree: false,
          isVegan: false,
          isFragranceFree: false,
          isAlcoholFree: true,
          isParabenFree: true,
          isSulfateFree: true,
          lastVerifiedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const vol8 = parseVolume('150ml');
  const product8 = await prisma.product.create({
    data: {
      id: 'lrp-toleriane-cleanser',
      name: 'Toleriane Purifying Foaming Cleanser',
      brandId: brand3.id,
      volumeValue: vol8.value,
      volumeUnit: vol8.unit,
      description:
        'Soap-free foaming cleanser that removes makeup and impurities without disrupting skin barrier. Suitable for sensitive skin.',
      category: 'Cleanser',
      pricePerUnit: 0.2,
      price: 12,
      imageUrl: 'https://example.com/lrp-cleanser.jpg',
      ethics: {
        create: {
          isCrueltyFree: false,
          isVegan: false,
          isFragranceFree: true,
          isAlcoholFree: true,
          isParabenFree: false,
          isSulfateFree: true,
          lastVerifiedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const vol9 = parseVolume('200ml');
  const product9 = await prisma.product.create({
    data: {
      id: 'isntree-hyaluronic-toner',
      name: 'Hyaluronic Acid Plus Toner',
      brandId: brand8.id,
      volumeValue: vol9.value,
      volumeUnit: vol9.unit,
      description:
        'Multi-weight hyaluronic acid toner for deep hydration. Lightweight, non-sticky, perfect for layering.',
      category: 'Toner',
      pricePerUnit: 0.15,
      price: 18,
      imageUrl: 'https://example.com/isntree-toner.jpg',
      ethics: {
        create: {
          isCrueltyFree: true,
          isVegan: true,
          isFragranceFree: true,
          isAlcoholFree: true,
          isParabenFree: true,
          isSulfateFree: true,
          lastVerifiedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // Create ingredients
  console.log('🧪 Creating ingredients...');
  const niacinamide = await prisma.ingredient.upsert({
    where: { inciName: 'Niacinamide' },
    update: {},
    create: {
      inciName: 'Niacinamide',
      displayName: 'Nicotinamide',
      function: 'Brightening, oil control, barrier support',
    },
  });

  const zinc = await prisma.ingredient.upsert({
    where: { inciName: 'Zinc PCA' },
    update: {},
    create: {
      inciName: 'Zinc PCA',
      displayName: 'Zinc Pyrrolidone Carboxylic Acid',
      function: 'Oil control, antimicrobial',
    },
  });

  const tocopherol = await prisma.ingredient.upsert({
    where: { inciName: 'Tocopherol' },
    update: {},
    create: {
      inciName: 'Tocopherol',
      displayName: 'Vitamin E',
      function: 'Antioxidant, anti-inflammatory',
    },
  });

  const ceramides = await prisma.ingredient.upsert({
    where: { inciName: 'Ceramides' },
    update: {},
    create: {
      inciName: 'Ceramides',
      displayName: 'N-Palmitoyl Sphinganine',
      function: 'Barrier repair, moisturizing',
    },
  });

  const tamanuOil = await prisma.ingredient.upsert({
    where: { inciName: 'Tamanu Oil' },
    update: {},
    create: {
      inciName: 'Tamanu Oil',
      displayName: 'Calophyllum Inophyllum Oil',
      function: 'Healing, anti-inflammatory, barrier repair',
    },
  });

  const hyaluronicAcid = await prisma.ingredient.upsert({
    where: { inciName: 'Hyaluronic Acid' },
    update: {},
    create: {
      inciName: 'Hyaluronic Acid',
      displayName: 'Sodium Hyaluronate',
      function: 'Hydration, moisture binding',
    },
  });

  // Link ingredients to products
  console.log('🔗 Linking ingredients to products...');
  await prisma.productIngredient.createMany({
    data: [
      { productId: product1.id, ingredientId: niacinamide.id, position: 1 },
      { productId: product1.id, ingredientId: zinc.id, position: 2 },
      { productId: product1.id, ingredientId: tocopherol.id, position: 3 },
      { productId: product2.id, ingredientId: niacinamide.id, position: 1 },
      { productId: product4.id, ingredientId: niacinamide.id, position: 1 },
      { productId: product4.id, ingredientId: ceramides.id, position: 2 },
      { productId: product4.id, ingredientId: tamanuOil.id, position: 3 },
      { productId: product5.id, ingredientId: ceramides.id, position: 1 },
      { productId: product5.id, ingredientId: hyaluronicAcid.id, position: 2 },
      { productId: product6.id, ingredientId: niacinamide.id, position: 1 },
      { productId: product7.id, ingredientId: hyaluronicAcid.id, position: 1 },
      { productId: product9.id, ingredientId: hyaluronicAcid.id, position: 1 },
    ],
  });

  // Create retailers (if not already created by seed-reference-data.ts)
  console.log('💳 Creating retailers...');
  const retailers = await Promise.all([
    prisma.retailer.upsert({
      where: { slug: 'sephora' },
      update: {},
      create: {
        name: 'Sephora',
        slug: 'sephora',
        url: 'https://www.sephora.com',
      },
    }),
    prisma.retailer.upsert({
      where: { slug: 'amazon' },
      update: {},
      create: {
        name: 'Amazon',
        slug: 'amazon',
        url: 'https://www.amazon.com',
      },
    }),
    prisma.retailer.upsert({
      where: { slug: 'ulta' },
      update: {},
      create: {
        name: 'Ulta Beauty',
        slug: 'ulta',
        url: 'https://www.ulta.com',
      },
    }),
    prisma.retailer.upsert({
      where: { slug: 'nykaa' },
      update: {},
      create: {
        name: 'Nykaa',
        slug: 'nykaa',
        url: 'https://www.nykaa.com',
      },
    }),
  ]);

  // Create product prices for each product across retailers
  console.log('💰 Adding prices...');
  const priceData = [
    // The Ordinary Niacinamide
    { productId: product1.id, retailerId: retailers[0].id, amount: 16.5 },
    { productId: product1.id, retailerId: retailers[1].id, amount: 17.99 },
    { productId: product1.id, retailerId: retailers[2].id, amount: 16.0 },
    
    // Minimalist Niacinamide
    { productId: product2.id, retailerId: retailers[0].id, amount: 18.6 },
    { productId: product2.id, retailerId: retailers[1].id, amount: 19.5 },
    { productId: product2.id, retailerId: retailers[3].id, amount: 499, currency: 'INR' },
    
    // La Roche-Posay Anthelios
    { productId: product3.id, retailerId: retailers[0].id, amount: 21.6 },
    { productId: product3.id, retailerId: retailers[1].id, amount: 22.99 },
    { productId: product3.id, retailerId: retailers[2].id, amount: 20.99 },
    
    // Krave Beauty Great Barrier Relief
    { productId: product4.id, retailerId: retailers[0].id, amount: 27.9 },
    { productId: product4.id, retailerId: retailers[1].id, amount: 29.95 },
    { productId: product4.id, retailerId: retailers[2].id, amount: 26.99 },
    
    // CeraVe Moisturizing Cream
    { productId: product5.id, retailerId: retailers[0].id, amount: 20.0 },
    { productId: product5.id, retailerId: retailers[1].id, amount: 18.99 },
    { productId: product5.id, retailerId: retailers[2].id, amount: 19.99 },
    
    // Paula's Choice Niacinamide Booster
    { productId: product6.id, retailerId: retailers[0].id, amount: 70.0 },
    { productId: product6.id, retailerId: retailers[1].id, amount: 72.5 },
    
    // Neutrogena Toner
    { productId: product7.id, retailerId: retailers[0].id, amount: 10.0 },
    { productId: product7.id, retailerId: retailers[1].id, amount: 9.99 },
    { productId: product7.id, retailerId: retailers[2].id, amount: 10.5 },
    
    // Isntree Hyaluronic Toner
    { productId: product9.id, retailerId: retailers[3].id, amount: 18.0 },
    { productId: product9.id, retailerId: retailers[1].id, amount: 19.99 },
  ];

  await Promise.all(
    priceData.map((data) =>
      prisma.productPrice.upsert({
        where: {
          productId_retailerId: {
            productId: data.productId,
            retailerId: data.retailerId,
          },
        },
        update: {
          amount: data.amount,
          currency: data.currency || 'USD',
        },
        create: {
          ...data,
          currency: data.currency || 'USD',
        },
      }),
    ),
  );

  console.log('✅ Seeded 8 brands');
  console.log('✅ Seeded 9 products with ethics data');
  console.log('✅ Seeded 6 key ingredients');
  console.log('✅ Created product-ingredient relationships');
  console.log('✅ Seeded 4 retailers');
  console.log('✅ Created 21 product-price relationships');
  console.log('');
  console.log('📦 Checkpoint 6-8 Dataset Ready:');
  console.log('   - The Ordinary (niacinamide)');
  console.log('   - Minimalist (niacinamide)');
  console.log('   - Krave Beauty (barrier repair)');
  console.log('   - CeraVe (moisturizer)');
  console.log("   - Paula's Choice (niacinamide booster)");
  console.log('   - Neutrogena (toner)');
  console.log('   - La Roche-Posay (cleanser)');
  console.log('   - Isntree (hyaluronic toner)');
  console.log('');
  console.log('💰 With prices from:');
  console.log('   - Sephora');
  console.log('   - Amazon');
  console.log('   - Ulta Beauty');
  console.log('   - Nykaa');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
