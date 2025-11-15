import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create products with ethics data
  const product1 = await prisma.product.create({
    data: {
      id: 'the-ordinary-niacinamide-10-zinc-1',
      name: 'Niacinamide 10% + Zinc 1%',
      brand: 'The Ordinary',
      volume: '30ml',
      description:
        'A lightweight serum containing niacinamide and zinc PCA. Hydrating and brightening formula with low irritation risk for most skin types.',
      category: 'Serum',
      pricePerUnit: 0.55,
      currentPrice: 16.5,
      originalProduct: 'Glossier Super Pure',
      imageUrl: 'https://example.com/ordinary-niacinamide.jpg',
      ethicsData: {
        create: {
          crueltyFree: true,
          vegan: true,
          fragranceFree: true,
          alcoholFree: true,
          fungalAcneSafe: true,
          parabenFree: true,
          sulfateFree: true,
          siliconesFree: false,
          lastVerifiedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
          sourceUrl: 'https://theordinary.com',
        },
      },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      id: 'minimalist-niacinamide-10',
      name: '10% Niacinamide Face Serum',
      brand: 'Minimalist',
      volume: '30ml',
      description:
        'Simple niacinamide serum focused on oil control and texture. Lightweight and suitable for oily to combination skin.',
      category: 'Serum',
      pricePerUnit: 0.62,
      currentPrice: 18.6,
      imageUrl: 'https://example.com/minimalist-niacinamide.jpg',
      ethicsData: {
        create: {
          crueltyFree: true,
          vegan: true,
          fragranceFree: true,
          alcoholFree: true,
          fungalAcneSafe: true,
          parabenFree: true,
          sulfateFree: true,
          siliconesFree: true,
          lastVerifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
      },
    },
  });

  const product3 = await prisma.product.create({
    data: {
      id: 'la-roche-posay-anthelios',
      name: 'Anthelios Melt-in Milk',
      brand: 'La Roche-Posay',
      volume: '90ml',
      description:
        'Broad-spectrum chemical filters in a cosmetically elegant, fragrance-free formula suitable for daily use.',
      category: 'Sunscreen',
      pricePerUnit: 0.24,
      currentPrice: 21.6,
      originalProduct: 'Supergoop! Unseen Sunscreen',
      imageUrl: 'https://example.com/lrp-anthelios.jpg',
      ethicsData: {
        create: {
          crueltyFree: false,
          vegan: false,
          fragranceFree: true,
          alcoholFree: false,
          fungalAcneSafe: true,
          parabenFree: false,
          sulfateFree: true,
          siliconesFree: true,
          lastVerifiedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        },
      },
    },
  });

  const product4 = await prisma.product.create({
    data: {
      id: 'krave-beauty-great-barrier-relief',
      name: 'Great Barrier Relief',
      brand: 'Krave Beauty',
      volume: '45ml',
      description:
        'Focuses on barrier repair with tamanu oil, ceramides, and niacinamide. Free of fragrance and essential oils.',
      category: 'Serum',
      pricePerUnit: 0.62,
      currentPrice: 27.9,
      originalProduct: 'Dr. Jart+ Ceramidin Cream',
      imageUrl: 'https://example.com/krave-barrier.jpg',
      ethicsData: {
        create: {
          crueltyFree: true,
          vegan: true,
          fragranceFree: true,
          alcoholFree: true,
          fungalAcneSafe: true,
          parabenFree: true,
          sulfateFree: true,
          siliconesFree: true,
          lastVerifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
      },
    },
  });

  // Hero product 5: CeraVe Moisturizing Cream
  const product5 = await prisma.product.create({
    data: {
      id: 'cerave-moisturizing-cream',
      name: 'Moisturizing Cream',
      brand: 'CeraVe',
      volume: '454g',
      description:
        'Fragrance-free, non-comedogenic moisturizing cream with ceramides and hyaluronic acid. Ideal for dry to very dry skin.',
      category: 'Moisturizer',
      pricePerUnit: 0.09,
      currentPrice: 20,
      imageUrl: 'https://example.com/cerave-cream.jpg',
      ethicsData: {
        create: {
          crueltyFree: false,
          vegan: false,
          fragranceFree: true,
          alcoholFree: true,
          fungalAcneSafe: true,
          parabenFree: true,
          sulfateFree: true,
          siliconesFree: false,
          lastVerifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          sourceUrl: 'https://cerave.com',
        },
      },
    },
  });

  // Hero product 6: Paula's Choice 10% Niacinamide Booster
  const product6 = await prisma.product.create({
    data: {
      id: 'paulas-choice-niacinamide-booster',
      name: '10% Niacinamide Booster',
      brand: "Paula's Choice",
      volume: '20ml',
      description:
        'Lightweight niacinamide booster that reduces shine, minimizes pores, and improves skin texture. No fragrance or dyes.',
      category: 'Serum',
      pricePerUnit: 3.5,
      currentPrice: 70,
      imageUrl: 'https://example.com/paulas-choice-nia.jpg',
      ethicsData: {
        create: {
          crueltyFree: true,
          vegan: false,
          fragranceFree: true,
          alcoholFree: true,
          fungalAcneSafe: false,
          parabenFree: false,
          sulfateFree: true,
          siliconesFree: false,
          lastVerifiedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          sourceUrl: 'https://paulaschoice.com',
        },
      },
    },
  });

  // Hero product 7: Neutrogena Hydro Boost Hydrating Toner
  const product7 = await prisma.product.create({
    data: {
      id: 'neutrogena-hydro-boost-toner',
      name: 'Hydro Boost Hydrating Toner',
      brand: 'Neutrogena',
      volume: '200ml',
      description:
        'Oil-free hydrating toner with hyaluronic acid. Lightweight and refreshing for all skin types.',
      category: 'Toner',
      pricePerUnit: 0.05,
      currentPrice: 10,
      imageUrl: 'https://example.com/neutrogena-toner.jpg',
      ethicsData: {
        create: {
          crueltyFree: false,
          vegan: false,
          fragranceFree: false,
          alcoholFree: true,
          fungalAcneSafe: true,
          parabenFree: true,
          sulfateFree: true,
          siliconesFree: false,
          lastVerifiedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // Hero product 8: La Roche-Posay Toleriane Purifying Foaming Cleanser
  const product8 = await prisma.product.create({
    data: {
      id: 'lrp-toleriane-cleanser',
      name: 'Toleriane Purifying Foaming Cleanser',
      brand: 'La Roche-Posay',
      volume: '150ml',
      description:
        'Soap-free foaming cleanser that removes makeup and impurities without disrupting skin barrier. Suitable for sensitive skin.',
      category: 'Cleanser',
      pricePerUnit: 0.2,
      currentPrice: 12,
      imageUrl: 'https://example.com/lrp-cleanser.jpg',
      ethicsData: {
        create: {
          crueltyFree: false,
          vegan: false,
          fragranceFree: true,
          alcoholFree: true,
          fungalAcneSafe: true,
          parabenFree: false,
          sulfateFree: true,
          siliconesFree: false,
          lastVerifiedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // Hero product 9: Isntree Hyaluronic Acid Plus Toner
  const product9 = await prisma.product.create({
    data: {
      id: 'isntree-hyaluronic-toner',
      name: 'Hyaluronic Acid Plus Toner',
      brand: 'Isntree',
      volume: '200ml',
      description:
        'Multi-weight hyaluronic acid toner for deep hydration. Lightweight, non-sticky, perfect for layering.',
      category: 'Toner',
      pricePerUnit: 0.15,
      currentPrice: 18,
      imageUrl: 'https://example.com/isntree-toner.jpg',
      ethicsData: {
        create: {
          crueltyFree: true,
          vegan: true,
          fragranceFree: true,
          alcoholFree: true,
          fungalAcneSafe: true,
          parabenFree: true,
          sulfateFree: true,
          siliconesFree: false,
          lastVerifiedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // Create ingredients
  const niacinamide = await prisma.ingredient.create({
    data: {
      name: 'Niacinamide',
      scientificName: 'Nicotinamide',
      category: 'Vitamin',
      function: 'Brightening, oil control, barrier support',
      isIrritant: false,
      fungalAcneSafe: true,
    },
  });

  const zinc = await prisma.ingredient.create({
    data: {
      name: 'Zinc PCA',
      scientificName: 'Zinc Pyrrolidone Carboxylic Acid',
      category: 'Mineral',
      function: 'Oil control, antimicrobial',
      isIrritant: false,
      fungalAcneSafe: true,
    },
  });

  const tocopherol = await prisma.ingredient.create({
    data: {
      name: 'Tocopherol',
      scientificName: 'Vitamin E',
      category: 'Vitamin',
      function: 'Antioxidant, anti-inflammatory',
      isIrritant: false,
      fungalAcneSafe: true,
    },
  });

  const ceramides = await prisma.ingredient.create({
    data: {
      name: 'Ceramides',
      scientificName: 'N-Palmitoyl Sphinganine',
      category: 'Lipid',
      function: 'Barrier repair, moisturizing',
      isIrritant: false,
      fungalAcneSafe: true,
    },
  });

  const tamanuOil = await prisma.ingredient.create({
    data: {
      name: 'Tamanu Oil',
      scientificName: 'Calophyllum Inophyllum Oil',
      category: 'Oil',
      function: 'Healing, anti-inflammatory, barrier repair',
      isIrritant: false,
      fungalAcneSafe: true,
    },
  });

  const hyaluronicAcid = await prisma.ingredient.create({
    data: {
      name: 'Hyaluronic Acid',
      scientificName: 'Sodium Hyaluronate',
      category: 'Humectant',
      function: 'Hydration, moisture binding',
      isIrritant: false,
      fungalAcneSafe: true,
    },
  });

  // Link ingredients to products
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

  // Create retailers
  console.log('💳 Creating retailers...');
  const retailers = await Promise.all([
    prisma.retailer.create({
      data: {
        name: 'Sephora',
        slug: 'sephora',
        url: 'https://www.sephora.com',
      },
    }),
    prisma.retailer.create({
      data: {
        name: 'Amazon',
        slug: 'amazon',
        url: 'https://www.amazon.com',
      },
    }),
    prisma.retailer.create({
      data: {
        name: 'Ulta Beauty',
        slug: 'ulta',
        url: 'https://www.ulta.com',
      },
    }),
    prisma.retailer.create({
      data: {
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
    { productId: product2.id, retailerId: retailers[3].id, amount: 499, currency: 'INR' }, // INR price
    
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
      prisma.productPrice.create({
        data: {
          ...data,
          currency: data.currency || 'USD',
        },
      }),
    ),
  );

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

