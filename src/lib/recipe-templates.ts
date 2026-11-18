/**
 * Production-grade recipe schema, templates, and free open-source web resources catalog.
 */

export interface NormalizedRecipe {
  name: string;
  category: string;
  cookingTime: number;
  prepTime?: number;
  servings?: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description?: string;
  instructions: string[];
  ingredients: Array<{ name: string; quantity: string }>;
  imageUrl?: string;
  videoUrl?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Free open-source web resources where users can freely download recipes for their app.
 */
export const FREE_RECIPE_RESOURCES = [
  {
    id: 'themealdb',
    name: 'TheMealDB Open API & Dataset',
    category: 'Public Domain / Free API',
    description: 'An open, crowd-sourced database of thousands of international recipes with ingredients, measures, high-res photos, and YouTube links.',
    url: 'https://www.themealdb.com/api.php',
    directDataUrl: 'https://www.themealdb.com/api/json/v1/1/search.php?s=chicken',
    format: 'JSON / REST API',
    license: 'Free / Creative Commons',
    usageTip: 'Query `search.php?s=<ingredient>` or `filter.php?c=Seafood` to fetch ready-to-import JSON recipes.',
    badge: 'Recommended',
    recommended: true,
  },
  {
    id: 'openrecipes',
    name: 'OpenRecipes by Edamam (GitHub)',
    category: 'Open Source Community Repo',
    description: 'Large open-source dataset of structured recipes scraped and compiled in clean JSON schema, maintained by open-data contributors.',
    url: 'https://github.com/fictivekin/openrecipes',
    directDataUrl: 'https://raw.githubusercontent.com/fictivekin/openrecipes/master/sample.json',
    format: 'JSON',
    license: 'Open Source / MIT',
    usageTip: 'Download raw JSON files from the repository containing tens of thousands of ingredient and step entries.',
    badge: 'Popular',
    recommended: true,
  },
  {
    id: 'kaggle-food',
    name: 'Kaggle Food.com Recipes & Reviews (230k+)',
    category: 'Large Scale Dataset',
    description: 'Comprehensive dataset containing over 230,000 recipes with cooking times, step-by-step instructions, and nutritional breakdowns.',
    url: 'https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-reviews',
    format: 'CSV / Parquet',
    license: 'CC0 Public Domain',
    usageTip: 'Download `recipes.csv` and import any slice directly using our CSV Importer.',
    badge: '230k+ Recipes',
    recommended: false,
  },
  {
    id: 'openfoodfacts',
    name: 'Open Food Facts Global Database',
    category: 'Collaborative Open Database',
    description: 'World\'s largest collaborative database of food products, ingredients, allergens, and complete nutrition labels.',
    url: 'https://world.openfoodfacts.org/',
    format: 'JSON / CSV Export',
    license: 'Open Database License (ODbL)',
    usageTip: 'Use for verifying nutrition, barcode lookups, and standardized ingredient nomenclature.',
    badge: 'Nutrition & Ingredients',
    recommended: false,
  },
  {
    id: 'usda-fooddata',
    name: 'USDA FoodData Central',
    category: 'Official Government Dataset',
    description: 'The premier scientific food composition data source of the United States Department of Agriculture.',
    url: 'https://fdc.nal.usda.gov/',
    format: 'CSV / JSON / API',
    license: 'Public Domain',
    usageTip: 'Gold-standard reference for calorie, macronutrient, and micronutrient calculations.',
    badge: 'Government Public Domain',
    recommended: false,
  },
];

/**
 * Pre-packaged starter packs that admins can preview and import directly with 1 click.
 */
export const PREPACKAGED_STARTER_PACKS = [
  {
    id: 'global-favorites',
    title: 'Global Favorites Collection',
    count: 4,
    description: 'Beloved international classics: Butter Chicken, Pizza Margherita, Teriyaki Glazed Salmon, and Mexican Guacamole Tacos.',
    recipes: [
      {
        name: 'Classic Indian Butter Chicken (Murgh Makhani)',
        category: 'Indian',
        cookingTime: 40,
        prepTime: 20,
        servings: 4,
        difficulty: 'Medium',
        description: 'Tender chicken pieces simmered in a velvety, spiced butter and tomato-cream gravy.',
        imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
        calories: 520,
        protein: 36,
        carbs: 14,
        fat: 34,
        fiber: 3,
        ingredients: [
          { name: 'Boneless Chicken Breast or Thighs', quantity: '600g (cut into bite-sized pieces)' },
          { name: 'Greek Yogurt', quantity: '0.5 cup' },
          { name: 'Garam Masala', quantity: '1.5 tbsp' },
          { name: 'Butter', quantity: '4 tbsp' },
          { name: 'Tomato Puree', quantity: '400g' },
          { name: 'Heavy Cream', quantity: '0.5 cup' },
          { name: 'Ginger-Garlic Paste', quantity: '2 tbsp' },
          { name: 'Kasuri Methi (Dried Fenugreek)', quantity: '1 tbsp' }
        ],
        instructions: [
          'Marinate diced chicken with yogurt, ginger-garlic paste, 1 tbsp garam masala, and salt for at least 20 minutes.',
          'Sear the marinated chicken in 1 tbsp butter in a deep skillet over high heat until browned (about 6-8 minutes), then remove and set aside.',
          'In the same skillet, melt remaining butter and sauté finely minced aromatics and tomato puree for 10 minutes until oil begins to separate.',
          'Stir in heavy cream, kasuri methi, and remaining garam masala. Lower heat to a gentle simmer.',
          'Return seared chicken to the gravy and simmer covered for 10-12 minutes until cooked through and luscious.',
          'Garnish with a drizzle of cream and fresh coriander; serve hot with naan or basmati rice.'
        ]
      },
      {
        name: 'Artisan Neapolitan Margherita Pizza',
        category: 'Italian',
        cookingTime: 15,
        prepTime: 25,
        servings: 2,
        difficulty: 'Easy',
        description: 'Traditional wood-fired style pizza with crushed San Marzano tomatoes, fresh mozzarella, and aromatic basil.',
        imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
        calories: 640,
        protein: 26,
        carbs: 72,
        fat: 28,
        fiber: 4,
        ingredients: [
          { name: 'Fermented Pizza Dough', quantity: '1 ball (260g)' },
          { name: 'San Marzano Canned Tomatoes', quantity: '150g (hand-crushed)' },
          { name: 'Fresh Mozzarella Di Bufala', quantity: '120g (torn)' },
          { name: 'Fresh Basil Leaves', quantity: '8-10 leaves' },
          { name: 'Extra Virgin Olive Oil', quantity: '1 tbsp' },
          { name: 'Flaky Sea Salt', quantity: '1 pinch' }
        ],
        instructions: [
          'Preheat oven to 500°F (260°C) with a pizza stone or baking steel placed on the highest rack for 45 minutes.',
          'Gently stretch pizza dough on a floured surface by pressing from the center outward, leaving a 1-inch aerated rim.',
          'Spread crushed San Marzano tomatoes evenly across the dough, leaving the outer crust bare.',
          'Distribute torn fresh mozzarella chunks and drizzle lightly with extra virgin olive oil.',
          'Bake for 8-10 minutes until the crust develops blistered charred spots and the cheese bubbles delightfully.',
          'Scatter fresh basil leaves over the piping hot pizza and finish with flaky sea salt.'
        ]
      },
      {
        name: 'Pan-Seared Teriyaki Glazed Salmon',
        category: 'Japanese',
        cookingTime: 18,
        prepTime: 10,
        servings: 2,
        difficulty: 'Easy',
        description: 'Crispy skin salmon fillets coated in a rich homemade sweet soy, mirin, and ginger glaze.',
        imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
        calories: 460,
        protein: 38,
        carbs: 16,
        fat: 26,
        fiber: 1,
        ingredients: [
          { name: 'Fresh Salmon Fillets (skin-on)', quantity: '2 fillets (180g each)' },
          { name: 'Low-Sodium Soy Sauce', quantity: '3 tbsp' },
          { name: 'Mirin (Japanese Sweet Rice Wine)', quantity: '2 tbsp' },
          { name: 'Brown Sugar or Honey', quantity: '1.5 tbsp' },
          { name: 'Grated Fresh Ginger', quantity: '1 tsp' },
          { name: 'Toasted Sesame Seeds & Scallions', quantity: '1 tbsp for garnish' }
        ],
        instructions: [
          'Whisk together soy sauce, mirin, brown sugar, and grated ginger in a small bowl until sugar is dissolved.',
          'Pat salmon fillets thoroughly dry with paper towels and season flesh lightly with salt and pepper.',
          'Heat a non-stick skillet over medium-high heat with 1 tsp oil. Place salmon skin-side down and press gently for 30 seconds.',
          'Sear for 4-5 minutes until the skin is intensely crisp, then flip and cook flesh side for 2 minutes.',
          'Pour the prepared teriyaki sauce into the skillet. Spoon reducing glaze continuously over the salmon for 2 minutes until glossy and thick.',
          'Garnish with toasted sesame seeds and sliced green scallions. Serve with steamed Jasmine rice.'
        ]
      },
      {
        name: 'Zesty Street-Style Guacamole & Black Bean Tacos',
        category: 'Mexican',
        cookingTime: 15,
        prepTime: 15,
        servings: 3,
        difficulty: 'Easy',
        description: 'Warm corn tortillas packed with spiced black beans, hand-mashed lime guacamole, pico de gallo, and cotija.',
        imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
        calories: 380,
        protein: 14,
        carbs: 48,
        fat: 16,
        fiber: 11,
        ingredients: [
          { name: 'Corn Tortillas', quantity: '6 small street-taco size' },
          { name: 'Ripe Hass Avocados', quantity: '2 large' },
          { name: 'Cooked Black Beans', quantity: '1 can (400g, rinsed and drained)' },
          { name: 'Fresh Lime Juice', quantity: '2 limes' },
          { name: 'Cumin & Smoked Paprika', quantity: '1 tsp each' },
          { name: 'Roma Tomatoes & Red Onion', quantity: '1 each, finely diced' },
          { name: 'Crumbled Cotija or Feta Cheese', quantity: '50g' }
        ],
        instructions: [
          'Warm black beans in a skillet with cumin, smoked paprika, salt, and 2 tbsp water; lightly mash half of them for creamy texture.',
          'In a bowl, coarsely mash avocados with lime juice, minced cilantro, diced red onion, and sea salt.',
          'Toast corn tortillas on an open gas burner or cast-iron skillet for 30 seconds each side until lightly charred and pliable.',
          'Spoon warm seasoned black beans down the center of each tortilla, followed by generous dollops of fresh guacamole.',
          'Top with diced tomatoes, crumbled cotija cheese, and fresh cilantro sprigs with extra lime wedges on the side.'
        ]
      }
    ]
  },
  {
    id: 'healthy-weeknights',
    title: 'High-Protein Fitness Essentials',
    count: 2,
    description: 'Nutrient-dense, macro-friendly meals formulated for active lifestyles and meal preppers.',
    recipes: [
      {
        name: 'Mediterranean Lemon Herb Grilled Chicken Bowl',
        category: 'Mediterranean',
        cookingTime: 20,
        prepTime: 15,
        servings: 2,
        difficulty: 'Easy',
        description: 'Juicy marinated grilled chicken breast atop fluffy herbed quinoa, cucumber-tomato salad, and tzatziki.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        calories: 490,
        protein: 48,
        carbs: 38,
        fat: 14,
        fiber: 6,
        ingredients: [
          { name: 'Chicken Breast', quantity: '400g' },
          { name: 'Cooked Quinoa', quantity: '1.5 cups' },
          { name: 'Cucumber & Cherry Tomatoes', quantity: '1 cup diced' },
          { name: 'Greek Tzatziki Sauce', quantity: '4 tbsp' },
          { name: 'Lemon Juice & Oregano', quantity: '2 tbsp' }
        ],
        instructions: [
          'Marinate chicken breast in olive oil, lemon juice, dried oregano, minced garlic, salt, and pepper for 15 minutes.',
          'Grill chicken on medium-high heat for 6-7 minutes per side until internal temperature reaches 165°F (74°C). Let rest 5 minutes, then slice.',
          'Assemble bowls with cooked quinoa as the base.',
          'Arrange sliced chicken, cucumber-tomato salad, and a generous scoop of tzatziki side-by-side.',
          'Drizzle with extra virgin olive oil and garnish with fresh dill.'
        ]
      },
      {
        name: 'Crispy Sesame Tofu & Edamame Power Bowl',
        category: 'Asian',
        cookingTime: 25,
        prepTime: 15,
        servings: 2,
        difficulty: 'Medium',
        description: 'Golden cornstarch-crusted tofu cubes tossed in sweet garlic sesame glaze with shelled edamame and brown rice.',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
        calories: 420,
        protein: 24,
        carbs: 46,
        fat: 16,
        fiber: 8,
        ingredients: [
          { name: 'Extra Firm Tofu', quantity: '350g (pressed and cubed)' },
          { name: 'Cornstarch', quantity: '2 tbsp' },
          { name: 'Shelled Edamame', quantity: '1 cup (steamed)' },
          { name: 'Toasted Sesame Oil & Tamari', quantity: '2 tbsp each' },
          { name: 'Cooked Brown Rice', quantity: '1.5 cups' }
        ],
        instructions: [
          'Toss pressed tofu cubes with cornstarch until evenly coated.',
          'Pan-fry in sesame oil over medium-high heat for 8-10 minutes, turning until all sides are golden brown and crisp.',
          'Deglaze pan with tamari, maple syrup, minced garlic, and toasted sesame seeds.',
          'Serve crispy tofu over warm brown rice with steamed edamame, sliced avocado, and shredded carrots.'
        ]
      }
    ]
  }
];

/**
 * Standard CSV Template Content
 */
export const SAMPLE_RECIPES_CSV = `recipe_name,category,cooking_time,difficulty_level,servings,calories,protein,carbs,fat,fiber,instructions,ingredients,image_url
"Classic Paneer Butter Masala","Indian",35,"Medium",4,450,16,18,32,4,"1. Heat butter in a pan and sauté aromatics.\n2. Add pureed tomatoes and cook until oil separates.\n3. Add cubed paneer, cream, and simmer for 5 minutes.","Paneer: 250g, Butter: 2 tbsp, Tomato Puree: 200g, Fresh Cream: 3 tbsp, Garam Masala: 1 tsp","https://images.unsplash.com/photo-1631452180519-c014fe946bc7"
"Avocado Sourdough Toast with Poached Egg","Breakfast",15,"Easy",2,320,14,28,18,7,"1. Toast sourdough slices until golden and crunchy.\n2. Mash avocado with lemon juice, salt, and chili flakes.\n3. Poach eggs in simmering water for 3 minutes.\n4. Top toast with mashed avocado and warm poached eggs.","Sourdough Bread: 2 slices, Ripe Avocado: 1, Eggs: 2, Lemon Juice: 1 tsp, Red Pepper Flakes: 0.5 tsp","https://images.unsplash.com/photo-1525351484163-7529414344d8"
"Garlic Butter Shrimp Linguine","Italian",20,"Easy",3,480,28,52,16,3,"1. Boil linguine in salted water until al dente.\n2. Sauté garlic and chili flakes in olive oil and melted butter.\n3. Add shrimp and cook for 2 minutes per side until pink.\n4. Toss pasta with shrimp, lemon zest, and fresh parsley.","Linguine: 250g, Raw Peeled Shrimp: 300g, Garlic: 4 cloves, Butter: 2 tbsp, Lemon Zest: 1 tsp, Fresh Parsley: 2 tbsp","https://images.unsplash.com/photo-1551183053-bf91a1d81141"`;

/**
 * Standard JSON Template Content
 */
export const SAMPLE_RECIPES_JSON = JSON.stringify(
  PREPACKAGED_STARTER_PACKS[0].recipes,
  null,
  2
);

/**
 * RFC 4180 Compliant CSV Parser
 */
export function parseCSV(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '').trim();
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // ignore CR
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes any raw object or CSV row into NormalizedRecipe.
 */
export function normalizeRecipe(raw: any): NormalizedRecipe {
  const name = String(raw.recipe_name || raw.name || raw.title || '').trim();
  const category = String(raw.category || raw.strCategory || raw.cuisine || 'General').trim();
  
  // Parse cooking time
  const rawTime = raw.cooking_time ?? raw.cookTimeMinutes ?? raw.cook_time ?? raw.totalTime ?? 20;
  const cookingTime = Math.max(parseInt(String(rawTime), 10) || 0, 5);

  // Parse difficulty
  const rawDiff = String(raw.difficulty_level || raw.difficulty || 'Easy').trim().toUpperCase();
  let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy';
  if (rawDiff.includes('MED')) difficulty = 'Medium';
  if (rawDiff.includes('HARD') || rawDiff.includes('DIFF')) difficulty = 'Hard';

  // Parse instructions
  let instructions: string[] = [];
  if (Array.isArray(raw.instructions)) {
    instructions = raw.instructions.map((s: any) => String(s).trim()).filter((s: string) => s.length > 0);
  } else if (typeof raw.instructions === 'string') {
    instructions = raw.instructions
      .split(/\r?\n|\.\s+(?=[A-Z0-9])/)
      .map((s: string) => s.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter((s: string) => s.length > 0);
  } else if (typeof raw.strInstructions === 'string') {
    instructions = raw.strInstructions
      .split(/\r?\n/)
      .map((s: string) => s.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter((s: string) => s.length > 0);
  }

  if (instructions.length === 0 && raw.description) {
    instructions = [String(raw.description).trim()];
  }

  // Parse ingredients
  const ingredients: Array<{ name: string; quantity: string }> = [];

  if (Array.isArray(raw.ingredients)) {
    for (const item of raw.ingredients) {
      if (typeof item === 'string') {
        const idx = item.indexOf(':');
        if (idx !== -1) {
          ingredients.push({
            name: item.substring(0, idx).trim(),
            quantity: item.substring(idx + 1).trim() || 'as needed',
          });
        } else {
          ingredients.push({ name: item.trim(), quantity: 'as needed' });
        }
      } else if (item && typeof item === 'object') {
        const ingName = String(item.name || item.ingredient || '').trim();
        if (ingName) {
          ingredients.push({
            name: ingName,
            quantity: String(item.quantity || item.amount || item.measure || 'as needed').trim(),
          });
        }
      }
    }
  } else if (typeof raw.ingredients === 'string') {
    // Comma-separated or colon-separated list
    const parts = raw.ingredients.split(',');
    for (const p of parts) {
      const idx = p.indexOf(':');
      if (idx !== -1) {
        const iName = p.substring(0, idx).trim();
        const iQty = p.substring(idx + 1).trim();
        if (iName) ingredients.push({ name: iName, quantity: iQty || 'as needed' });
      } else {
        const trimmed = p.trim();
        if (trimmed) ingredients.push({ name: trimmed, quantity: 'as needed' });
      }
    }
  }

  // TheMealDB format support: strIngredient1, strMeasure1, ...
  if (ingredients.length === 0) {
    for (let i = 1; i <= 20; i++) {
      const ing = raw[`strIngredient${i}`];
      const measure = raw[`strMeasure${i}`];
      if (ing && String(ing).trim()) {
        ingredients.push({
          name: String(ing).trim(),
          quantity: String(measure || 'as needed').trim(),
        });
      }
    }
  }

  const imageUrl = String(raw.image_url || raw.imageUrl || raw.strMealThumb || raw.image || '').trim() || undefined;

  return {
    name,
    category,
    cookingTime,
    prepTime: parseInt(String(raw.prepTime || raw.prepTimeMinutes || 0), 10) || undefined,
    servings: parseInt(String(raw.servings || raw.yield || 4), 10) || 4,
    difficulty,
    description: String(raw.description || raw.summary || '').trim() || undefined,
    instructions: instructions.length > 0 ? instructions : ['Follow standard preparation procedures.'],
    ingredients: ingredients.length > 0 ? ingredients : [{ name: 'Assorted Seasonings', quantity: 'to taste' }],
    imageUrl,
    calories: parseInt(String(raw.calories || raw.caloriesKcal || 0), 10) || undefined,
    protein: parseFloat(String(raw.protein || raw.proteinG || 0)) || undefined,
    carbs: parseFloat(String(raw.carbs || raw.carbohydratesG || 0)) || undefined,
    fat: parseFloat(String(raw.fat || raw.fatG || 0)) || undefined,
    fiber: parseFloat(String(raw.fiber || raw.fibreG || 0)) || undefined,
  };
}

/**
 * Validates a normalized recipe object.
 */
export function validateRecipe(recipe: NormalizedRecipe): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!recipe.name || recipe.name.length < 2) {
    errors.push('Recipe name is missing or too short.');
  }

  if (!recipe.instructions || recipe.instructions.length === 0) {
    errors.push('Recipe instructions/steps are missing.');
  }

  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    warnings.push('No ingredients listed.');
  }

  if (recipe.cookingTime <= 0) {
    warnings.push('Cooking time is missing or 0.');
  }

  if (!recipe.imageUrl) {
    warnings.push('No cover image URL provided.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Exports recipe array into CSV string.
 */
export function exportRecipesToCSV(recipes: any[]): string {
  const headers = [
    'recipe_name',
    'category',
    'cooking_time',
    'difficulty_level',
    'servings',
    'calories',
    'protein',
    'carbs',
    'fat',
    'fiber',
    'instructions',
    'ingredients',
    'image_url',
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = recipes.map((r) => {
    const ingStr = Array.isArray(r.ingredients)
      ? r.ingredients
          .map((i: any) => {
            const iName = typeof i === 'string' ? i : i.name;
            const iQty = typeof i === 'object' && i.quantity ? `: ${i.quantity}` : '';
            return `${iName}${iQty}`;
          })
          .join(', ')
      : String(r.ingredients || '');

    const instStr = Array.isArray(r.instructions)
      ? r.instructions.join('\n')
      : String(r.instructions || '');

    return [
      escapeCSV(r.recipe_name || r.name),
      escapeCSV(r.category || 'General'),
      escapeCSV(r.cooking_time || r.cookTimeMinutes || 20),
      escapeCSV(r.difficulty_level || r.difficulty || 'Easy'),
      escapeCSV(r.servings || 4),
      escapeCSV(r.calories || r.nutrition?.caloriesKcal || 0),
      escapeCSV(r.protein || r.nutrition?.proteinG || 0),
      escapeCSV(r.carbs || r.nutrition?.carbohydratesG || 0),
      escapeCSV(r.fat || r.nutrition?.fatG || 0),
      escapeCSV(r.fiber || r.nutrition?.fibreG || 0),
      escapeCSV(instStr),
      escapeCSV(ingStr),
      escapeCSV(r.image_url || r.imageUrl || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

