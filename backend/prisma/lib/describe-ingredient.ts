/**
 * Plain explanations built from what an ingredient is (its name) and what it does (its EU function
 * list), for the thousands of ingredients whose EU-function text says only "Keeps skin in good
 * condition". Says what the thing is ("Rosemary leaf extract") and what it does; never claims a
 * benefit the EU function list doesn't support. Returns null when nothing better than the
 * existing text can be said.
 */

// Common names by botanical genus. Only well-established names: a genus not listed falls back to
// "a plant extract", never a guess.
const GENUS: Record<string, string> = {
  Abies: 'fir', Acacia: 'acacia', Acer: 'maple', Achillea: 'yarrow', Actinidia: 'kiwi', Adansonia: 'baobab',
  Aesculus: 'horse chestnut', Agrimonia: 'agrimony', Alaria: 'winged kelp', Allium: 'onion family', Alnus: 'alder',
  Aloe: 'aloe vera', Alpinia: 'galangal', Althaea: 'marshmallow', Amaranthus: 'amaranth', Ananas: 'pineapple',
  Anemarrhena: 'anemarrhena', Angelica: 'angelica', Annona: 'custard apple', Anthemis: 'chamomile', Apium: 'celery',
  Aquilaria: 'agarwood', Arctium: 'burdock', Arctostaphylos: 'bearberry', Argania: 'argan', Aronia: 'chokeberry',
  Artemisia: 'mugwort', Ascophyllum: 'knotted wrack seaweed', Aspalathus: 'rooibos', Asparagus: 'asparagus',
  Astragalus: 'astragalus', Astrocaryum: 'murumuru palm', Avena: 'oat', Azadirachta: 'neem', Bambusa: 'bamboo',
  Bellis: 'daisy', Berberis: 'barberry', Bertholletia: 'Brazil nut', Beta: 'beetroot', Betula: 'birch',
  Boswellia: 'frankincense', Borago: 'borage', Brassica: 'cabbage family', Butyrospermum: 'shea', Buxus: 'box',
  Calendula: 'calendula (marigold)', Calluna: 'heather', Calophyllum: 'tamanu', Camelina: 'camelina', Camellia: 'tea plant (camellia)',
  Cannabis: 'hemp', Capsicum: 'chilli pepper', Carica: 'papaya', Carthamus: 'safflower', Carum: 'caraway', Carya: 'pecan',
  Cassia: 'cassia', Castanea: 'chestnut', Cedrus: 'cedar', Centaurea: 'cornflower', Centella: 'centella asiatica (cica)',
  Ceratonia: 'carob', Serenoa: 'saw palmetto', Pulsatilla: 'pasque flower', Chamaecyparis: 'cypress', Chamomilla: 'chamomile', Chenopodium: 'quinoa', Chlorella: 'chlorella algae',
  Chrysanthemum: 'chrysanthemum', Cicer: 'chickpea', Cichorium: 'chicory', Cinnamomum: 'cinnamon', Cistus: 'rock rose',
  Citrullus: 'watermelon', Citrus: 'citrus', Clitoria: 'butterfly pea', Coccinia: 'ivy gourd', Cocos: 'coconut',
  Coffea: 'coffee', Coix: "Job's tears", Commiphora: 'myrrh', Coriandrum: 'coriander', Corylus: 'hazelnut', Crataegus: 'hawthorn',
  Crocus: 'saffron', Cucumis: 'cucumber', Cucurbita: 'pumpkin', Curcuma: 'turmeric', Cymbopogon: 'lemongrass',
  Cynara: 'artichoke', Daucus: 'carrot', Dioscorea: 'yam', Echinacea: 'echinacea', Eclipta: 'bhringraj', Elaeis: 'palm',
  Elettaria: 'cardamom', Emblica: 'amla (Indian gooseberry)', Epilobium: 'willowherb', Equisetum: 'horsetail', Eruca: 'rocket',
  Eucalyptus: 'eucalyptus', Eugenia: 'clove', Euterpe: 'açaí', Ficus: 'fig', Foeniculum: 'fennel', Fragaria: 'strawberry',
  Fraxinus: 'ash tree', Ganoderma: 'reishi mushroom', Garcinia: 'garcinia (kokum, mangosteen)', Gardenia: 'gardenia', Gentiana: 'gentian',
  Geranium: 'geranium', Ginkgo: 'ginkgo', Glycine: 'soybean', Glycyrrhiza: 'liquorice', Gossypium: 'cotton', Grifola: 'maitake mushroom',
  Hamamelis: 'witch hazel', Hedychium: 'ginger lily', Helianthus: 'sunflower', Helichrysum: 'everlasting flower', Hibiscus: 'hibiscus',
  Hippophae: 'sea buckthorn', Hordeum: 'barley', Houttuynia: 'houttuynia (fish mint)', Hylocereus: 'dragon fruit', Hypericum: "St John's wort",
  Ilex: 'holly (incl. yerba mate)', Inula: 'elecampane', Ipomoea: 'sweet potato family', Iris: 'iris', Jasminum: 'jasmine',
  Juglans: 'walnut', Juniperus: 'juniper', Kigelia: 'sausage tree', Laminaria: 'kelp', Laurus: 'bay laurel', Lavandula: 'lavender',
  Lawsonia: 'henna', Lens: 'lentil', Leontopodium: 'edelweiss', Lilium: 'lily', Linum: 'flax', Litchi: 'lychee', Lonicera: 'honeysuckle',
  Luffa: 'loofah', Lupinus: 'lupin', Lycium: 'goji berry', Macadamia: 'macadamia', Macrocystis: 'giant kelp', Magnolia: 'magnolia',
  Malpighia: 'acerola cherry', Malus: 'apple', Malva: 'mallow', Mangifera: 'mango', Matricaria: 'chamomile', Mauritia: 'buriti palm',
  Medicago: 'alfalfa', Melaleuca: 'tea tree', Melia: 'neem', Melissa: 'lemon balm', Mentha: 'mint', Mesua: 'nagkesar', Morinda: 'noni',
  Moringa: 'moringa', Morus: 'mulberry', Musa: 'banana', Myrciaria: 'camu camu', Nelumbium: 'lotus', Nelumbo: 'lotus',
  Nephelium: 'rambutan', Nigella: 'black seed (kalonji)', Nymphaea: 'water lily', Ocimum: 'basil (incl. tulsi)', Oenothera: 'evening primrose',
  Olea: 'olive', Opuntia: 'prickly pear cactus', Orbignya: 'babassu palm', Origanum: 'oregano', Oryza: 'rice', Paeonia: 'peony',
  Palmaria: 'dulse seaweed', Panax: 'ginseng', Papaver: 'poppy', Passiflora: 'passion fruit', Pelargonium: 'geranium', Perilla: 'perilla',
  Persea: 'avocado', Phaseolus: 'bean', Phoenix: 'date palm', Phyllanthus: 'amla (Indian gooseberry)', Phyllostachys: 'bamboo',
  Picea: 'spruce', Pimpinella: 'anise', Pinus: 'pine', Piper: 'pepper', Pisum: 'pea', Plantago: 'plantain herb', Pongamia: 'karanja',
  Populus: 'poplar', Porphyra: 'nori seaweed', Portulaca: 'purslane', Potentilla: 'cinquefoil', Prunus: 'stone fruit (almond, cherry, apricot, peach, plum)',
  Pueraria: 'kudzu', Punica: 'pomegranate', Pyrus: 'pear', Quercus: 'oak', Rehmannia: 'rehmannia', Rheum: 'rhubarb', Rhodiola: 'rhodiola',
  Ribes: 'currant', Rosa: 'rose', Rosmarinus: 'rosemary', Rubia: 'manjistha (Indian madder)', Rubus: 'raspberry and blackberry',
  Rumex: 'sorrel', Saccharomyces: 'yeast', Salicornia: 'samphire', Salix: 'willow', Salvia: 'sage', Sambucus: 'elder', Santalum: 'sandalwood',
  Sapindus: 'soapnut (reetha)', Saponaria: 'soapwort', Schisandra: 'schisandra berry', Scutellaria: 'skullcap', Sesamum: 'sesame',
  Silybum: 'milk thistle', Simmondsia: 'jojoba', Solanum: 'nightshade family (tomato, aubergine, potato)', Sophora: 'sophora', Spinacia: 'spinach',
  Symphytum: 'comfrey', Tamarindus: 'tamarind', Taraxacum: 'dandelion', Terminalia: 'terminalia (incl. haritaki)', Theobroma: 'cocoa',
  Thymus: 'thyme', Tilia: 'linden', Tinospora: 'giloy', Tremella: 'snow mushroom', Trifolium: 'clover', Triticum: 'wheat', Tuber: 'truffle',
  Ulmus: 'elm', Urtica: 'nettle', Vaccinium: 'blueberry and cranberry', Valeriana: 'valerian', Vanilla: 'vanilla', Verbena: 'verbena',
  Vetiveria: 'vetiver', Vigna: 'mung and adzuki bean', Viola: 'violet', Vitex: 'chaste tree', Vitis: 'grape', Withania: 'ashwagandha',
  Yucca: 'yucca', Zanthoxylum: 'Sichuan pepper', Zea: 'corn', Zingiber: 'ginger', Ziziphus: 'jujube',
};

// Where one genus covers very different plants, the species decides ("Prunus Armeniaca" is apricot).
const SPECIES: Record<string, string> = {
  'prunus amygdalus': 'sweet almond', 'prunus armeniaca': 'apricot', 'prunus persica': 'peach', 'prunus avium': 'cherry',
  'prunus cerasus': 'sour cherry', 'prunus domestica': 'plum', 'prunus mume': 'Japanese apricot', 'prunus yedoensis': 'cherry blossom',
  'prunus serrulata': 'cherry blossom', 'prunus speciosa': 'cherry blossom', 'citrus limon': 'lemon', 'citrus aurantium': 'orange',
  'citrus sinensis': 'sweet orange', 'citrus paradisi': 'grapefruit', 'citrus reticulata': 'mandarin', 'citrus junos': 'yuzu',
  'citrus aurantifolia': 'lime', 'citrus unshiu': 'satsuma', 'citrus grandis': 'pomelo', 'citrus medica': 'citron',
  'camellia sinensis': 'tea (green tea)', 'camellia japonica': 'camellia', 'camellia oleifera': 'camellia', 'brassica oleracea': 'cabbage',
  'brassica campestris': 'rapeseed', 'brassica napus': 'rapeseed', 'solanum lycopersicum': 'tomato', 'solanum melongena': 'aubergine',
  'solanum tuberosum': 'potato', 'rubus idaeus': 'raspberry', 'rubus fruticosus': 'blackberry', 'vaccinium myrtillus': 'bilberry',
  'vaccinium macrocarpon': 'cranberry', 'vaccinium angustifolium': 'blueberry', 'garcinia indica': 'kokum', 'garcinia mangostana': 'mangosteen',
  'ilex paraguariensis': 'yerba mate', 'ocimum sanctum': 'tulsi (holy basil)', 'ocimum tenuiflorum': 'tulsi (holy basil)',
  'ocimum basilicum': 'basil', 'terminalia chebula': 'haritaki', 'terminalia arjuna': 'arjuna', 'terminalia ferdinandiana': 'Kakadu plum',
  'vigna radiata': 'mung bean', 'allium cepa': 'onion', 'allium sativum': 'garlic', 'cassia angustifolia': 'senna',
  'cassia obtusifolia': 'sicklepod', 'ipomoea batatas': 'sweet potato', 'citrullus lanatus': 'watermelon', 'piper nigrum': 'black pepper',
  'piper methysticum': 'kava', 'piper betle': 'betel leaf', 'mentha piperita': 'peppermint', 'mentha spicata': 'spearmint',
  'rosa canina': 'rosehip', 'rosa damascena': 'damask rose', 'rosa centifolia': 'cabbage rose', 'artemisia vulgaris': 'mugwort',
  'artemisia princeps': 'Korean mugwort', 'artemisia annua': 'sweet wormwood', 'opuntia ficus-indica': 'prickly pear',
};

// Common ingredients the rules below can't describe well, by exact name (lower case).
const EXACT: Record<string, string> = {
  'dipotassium glycyrrhizate': 'From liquorice root. Soothes skin and helps calm redness.',
  'madecassic acid': 'From centella asiatica (cica). Soothes skin and supports its repair.',
  'asiatic acid': 'From centella asiatica (cica). Soothes skin and supports its repair.',
  'madecassoside': 'From centella asiatica (cica). Soothes skin and supports its repair.',
  'asiaticoside': 'From centella asiatica (cica). Soothes skin and supports its repair.',
  'adenosine': 'Helps smooth the look of fine lines. Gentle for most skin.',
  'snail secretion filtrate': 'Snail mucin. Hydrates and conditions skin.',
  'acetyl glucosamine': 'An amino sugar that helps skin hold moisture and can help even out tone.',
  'papain': 'Enzyme from papaya that gently loosens dead skin cells.',
  'bromelain': 'Enzyme from pineapple that gently loosens dead skin cells.',
  'tribehenin': 'Emollient wax-like fat. Thickens the formula and softens skin.',
  'biosaccharide gum-1': 'Sugar-based ingredient that draws water into the skin and leaves it feeling smooth.',
  'lactobacillus': 'Probiotic bacteria (as a ferment). Used to condition skin.',
  'chondrus crispus': 'Irish moss seaweed. Thickens the formula and adds moisture.',
  'apple cider vinegar': 'Apple cider vinegar. Mildly acidic; used to balance pH and in clarifying hair and skin products.',
  'magnesium gluconate': 'Mineral salt that conditions skin.',
  'sodium levulinate': 'From fermented plant sugars. Helps keep the product free of microbes, often in "natural" formulas.',
  'hydroxypropyl tetrahydropyrantriol': 'Pro-Xylane, a sugar-derived anti-ageing ingredient that helps skin look firmer and plumper.',
  'ethylhexyl methoxycrylene': 'Keeps sunscreen filters stable in sunlight so the protection lasts.',
  'diethylhexyl syringylidenemalonate': 'Keeps sunscreen filters stable in sunlight and protects the formula from oxidising.',
  'bis-aminopropyl diglycol dimaleate': 'Bond-building ingredient that helps repair damaged, chemically treated hair.',
  'oleanolic acid': 'Plant compound (found in olives) that conditions skin.',
  'hydroxypropyl cyclodextrin': 'Sugar-based ring molecule that holds and slowly releases other ingredients.',
  'phospholipids': 'Fats like those in skin cell walls. Soften skin and help it hold moisture.',
  'glycolipids': 'Sugar-linked fats that soften skin and help it hold moisture.',
  'glycine soja sterols': 'Plant sterols from soybean. Help skin hold moisture.',
  'acetyl methionine': 'A form of the amino acid methionine. Conditions skin and hair.',
  'dipalmitoyl hydroxyproline': 'Amino-acid-based ingredient used in anti-ageing products for firmer-looking skin.',
  'almond oil': 'Almond oil. Softens and nourishes dry skin. Skip it if you have a nut allergy.',
  'sweet almond oil': 'Sweet almond oil. Softens and nourishes dry skin. Skip it if you have a nut allergy.',
};

// Not plants: yeast, mushrooms, algae and seaweeds.
const NOT_PLANT = new Set(['Saccharomyces', 'Ganoderma', 'Grifola', 'Tremella', 'Tuber', 'Chlorella', 'Laminaria', 'Macrocystis', 'Palmaria', 'Porphyra', 'Ascophyllum', 'Alaria']);

// Plants whose oil is an essential oil (scent), not a nourishing carrier oil.
const ESSENTIAL_OIL_GENUS = new Set(['Eucalyptus', 'Lavandula', 'Melaleuca', 'Mentha', 'Rosmarinus', 'Cymbopogon', 'Pelargonium', 'Eugenia', 'Cinnamomum', 'Santalum', 'Vetiveria', 'Juniperus', 'Cedrus', 'Thymus', 'Origanum', 'Salvia', 'Foeniculum', 'Pimpinella', 'Zingiber', 'Elettaria', 'Boswellia', 'Commiphora', 'Cananga', 'Jasminum', 'Pogostemon', 'Abies', 'Picea', 'Chamaecyparis', 'Ocimum', 'Melissa', 'Helichrysum', 'Coriandrum', 'Carum', 'Laurus']);
const ESSENTIAL_OIL_WORD = /^(eucalyptus|lavender|tea tree|peppermint|spearmint|rosemary|lemongrass|geranium|clove|cinnamon|sandalwood|vetiver|juniper|cedarwood|thyme|oregano|sage|fennel|ginger|frankincense|myrrh|ylang ylang|jasmine|patchouli|lemon|orange|bergamot|grapefruit|lime|mandarin|basil|citronella|pine|camphor)\b/i;

const AMINO_ACIDS = /^(l-)?(alanine|arginine|asparagine|aspartic acid|cysteine|glutamic acid|glutamine|glycine|histidine|isoleucine|leucine|lysine|lysine hcl|methionine|phenylalanine|proline|serine|threonine|tryptophan|tyrosine|valine|citrulline|ornithine)$/i;
const VITAMINS: Array<[RegExp, string]> = [
  [/^(pyridoxine( hcl)?)$/i, 'Vitamin B6. Conditions skin and hair.'],
  [/^(biotin)$/i, 'Vitamin B7. Conditions skin and hair.'],
  [/^(calcium pantothenate)$/i, 'A form of vitamin B5. Helps skin and hair hold moisture.'],
  [/^(retinyl|tocopher)/i, ''],
];

const PART = /\b(Leaf|Root|Flower|Fruit|Seed|Kernel|Bark|Stem|Rhizome|Peel|Bud|Callus|Sprout|Berry|Nut|Wood|Herb|Bulb|Shoot|Twig|Needle|Cone|Tuber|Thallus)\b/i;
const MICROBE = /\b(Lactobacillus|Bifida|Saccharomyces|Lactococcus|Leuconostoc|Streptococcus|Pseudozyma|Aspergillus|Bacillus|Galactomyces|Aureobasidium|Pichia|Yeast)\b/i;

const has = (fn: string, re: RegExp) => re.test(fn);

/** A better explanation than the EU-function boilerplate, or null when there's nothing better to say. */
export function plainDescription(rawName: string, fn = ''): string | null {
  const name = rawName.replace(/[­​-‏⁠﻿]/g, '').replace(/\s+/g, ' ').trim();
  const f = fn.toLowerCase();

  const exact = EXACT[name.toLowerCase()];
  if (exact) return exact;
  if (AMINO_ACIDS.test(name)) return 'Amino acid, one of the building blocks of skin. Helps skin hold moisture.';
  for (const [re, text] of VITAMINS) if (re.test(name)) return text || null;
  if (/^ceramide\b/i.test(name)) return 'Ceramide, one of the fats that make up the skin barrier. Helps skin keep moisture in.';
  if (/^(phytosphingosine|sphingolipids?|phytosteryl|phytosterols?|cholesterol)\b/i.test(name)) return 'A skin-barrier fat (lipid). Helps skin keep moisture in.';
  if (/peptide|^(sh|rh)-oligopeptide|^carnosine$/i.test(name)) return 'Peptide (a short chain of amino acids), used in anti-ageing products for smoother, firmer-looking skin.';
  if (/(hyaluron|^sodium pca$|^pca$|polyglutam)/i.test(name)) return 'Humectant: draws water into the skin and holds it there, so skin looks plumper and feels less tight.';
  if (/(icone|siloxane|silsesquioxane|siloxysilicate)\b/i.test(name)) return 'Silicone. Leaves a smooth, silky feel and helps the product spread.';
  if (/\b(ferment|lysate|filtrate)\b/i.test(name) && MICROBE.test(name)) return 'Ferment, made by growing yeast or friendly bacteria. Used to condition skin.';
  if (/^hydrolyzed .*(protein|collagen|keratin|silk|elastin|amino acids)|^soluble collagen$|^soy amino acids$/i.test(name)) return 'Protein broken into small pieces so it can coat skin and hair, leaving them softer.';
  if (/^(honey|mel)\b|honey extract/i.test(name)) return 'Honey. Draws water into the skin and conditions it.';
  if (/^urea$|^hydroxyethyl urea$/i.test(name)) return 'Humectant that helps skin hold water; in higher amounts it also softens rough, dry skin.';
  if (/^(sorbitol|diglycerin|glyceryl glucoside|xylitylglucoside|anhydroxylitol|pantolactone|inulin|fructooligosaccharides|fructan|raffinose|ectoin)$/i.test(name))
    return 'Humectant: draws water into the skin to keep it hydrated.';

  if (/^(cetyl|stearyl|cetearyl|myristyl|behenyl|lauryl|arachidyl|oleyl|isostearyl) alcohol$/i.test(name))
    return 'Fatty alcohol (not a drying alcohol). Thickens the formula and softens skin.';
  if (/^polyglyceryl-\d+ /i.test(name)) return 'Plant-derived emulsifier. Helps oil and water mix, so the formula stays smooth.';
  if (/(acrylate|carbomer|\bgum\b|cellulose|polyacrylamide)/i.test(name) && /viscosity|binding|film|emulsion stabilising|absorbent/.test(f))
    return 'Thickener. Gives the product its gel or cream texture.';

  // Plants: "<Genus> <species> <part> <Extract|Oil|Butter|Juice|Water|Wax>".
  const PRODUCT = /^(extract|oil|butter|juice|water|gel|wax|powder)$/i;
  const plant = name.match(/^([A-Z][a-z]{2,}) ([A-Za-z][a-z-]+)/);
  const species = plant ? SPECIES[`${plant[1]} ${plant[2]}`.toLowerCase()] : undefined;
  let common = species ?? (plant ? GENUS[plant[1]] : undefined);
  // An English name already ("Rose Extract", "Orchid Extract", "Argan Oil"): use it as written.
  if (!common && plant && /^hydrolyzed$/i.test(plant[1])) common = `hydrolysed ${plant[2].toLowerCase()}`;
  if (!common && plant && PRODUCT.test(plant[2]) && !/^(hydrogenated|hydrolyzed|organic|sweet|black|white|virgin|mineral|vegetable)$/i.test(plant[1]))
    common = plant[1].toLowerCase();
  const partWord = name.match(PART)?.[1]?.toLowerCase();
  const what = common ? `${common.charAt(0).toUpperCase()}${common.slice(1)}${partWord ? ` ${partWord}` : ''}` : null;
  if (plant && /\bbutter\b/i.test(name)) return `${what ?? 'A plant'} butter. A rich butter that softens and nourishes dry skin.`;
  // Essential oils are scent, not nourishment: leave their text to the essential-oil rule.
  if (/\boil\b/i.test(name) && ((plant && ESSENTIAL_OIL_GENUS.has(plant[1])) || ESSENTIAL_OIL_WORD.test(name) || (/perfum/.test(f) && !/emollient/.test(f)))) return null;
  if (plant && /\boil\b/i.test(name) && has(f, /emollient|skin conditioning/)) return `${what ?? 'A plant'} oil. Softens and nourishes skin.`;
  if (plant && /\b(juice|water|gel)\b/i.test(name)) return `${what ?? 'Plant'} ${name.match(/\b(juice|water|gel)\b/i)![1].toLowerCase()}. Adds light moisture and conditions skin.`;
  if (plant && /\bwax\b/i.test(name)) return `${what ?? 'A plant'} wax. Thickens the formula and helps seal moisture in.`;
  if (plant && /\bextract\b/i.test(name))
    return what
      ? `${what} extract. ${plant && NOT_PLANT.has(plant[1]) ? 'A natural extract' : 'A plant extract'} used to condition skin.`
      : PRODUCT.test(plant[2]) ? null : `A plant extract (${plant[0]}), used to condition skin.`;

  // Everything else, by what it does.
  if (has(f, /emollient/) && /(ate|ates|ester|esters|ether|carbonate|ane|ene|triglycerides?|oil)$/i.test(name))
    return 'Emollient. Softens skin and helps the product spread smoothly.';
  if (has(f, /emulsifying/)) return 'Helps oil and water mix, so the formula stays smooth.';
  if (has(f, /humectant/)) return 'Humectant: draws water into the skin to keep it hydrated.';
  return null;
}
