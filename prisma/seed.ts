import 'dotenv/config';
import { prisma } from '../src/config/db';
import { RecipeDifficulty, RecipeStatus } from '../src/generated/prisma/enums';

// Helper to convert names into URL-friendly slugs
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// 1. UNITS OF MEASUREMENT
// ---------------------------------------------------------------------------
const UNITS = [
  { name: 'Gram', symbol: 'g' },
  { name: 'Kilogram', symbol: 'kg' },
  { name: 'Milliliter', symbol: 'ml' },
  { name: 'Liter', symbol: 'l' },
  { name: 'Tablespoon', symbol: 'tbsp' },
  { name: 'Teaspoon', symbol: 'tsp' },
  { name: 'Cup', symbol: 'cup' },
  { name: 'Piece', symbol: 'pc' },
  { name: 'Bunch', symbol: 'bunch' },
  { name: 'Unit', symbol: 'unit' },
  { name: 'Pinch', symbol: 'pinch' },
];

// ---------------------------------------------------------------------------
// 2. CATEGORIES
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { name: 'Breakfast', description: 'Morning meals to jumpstart your day', sortOrder: 1 },
  { name: 'Lunch', description: 'Midday meals, light to hearty', sortOrder: 2 },
  { name: 'Dinner', description: 'Nourishing evening dinners', sortOrder: 3 },
  { name: 'Snacks', description: 'Quick bites and evening snacks', sortOrder: 4 },
  { name: 'Soup', description: 'Warm and comforting soups', sortOrder: 5 },
  { name: 'Healthy', description: 'Nutrient-rich, wholesome recipes', sortOrder: 6 },
  { name: 'Dessert', description: 'Sweet treats and desserts', sortOrder: 7 },
];

// ---------------------------------------------------------------------------
// 3. CUISINES
// ---------------------------------------------------------------------------
const CUISINES = [
  { name: 'Indian', description: 'Aromatic, spice-infused regional dishes from India' },
  { name: 'Chinese', description: 'Stir-fries, rice, noodles, and dim sum' },
  { name: 'Italian', description: 'Pastas, pizzas, and Mediterranean classics' },
  { name: 'Continental', description: 'European and Continental style recipes' },
  { name: 'Mexican', description: 'Tacos, burritos, salsas, and vibrant spices' },
  { name: 'Global', description: 'Universal and fusion culinary creations' },
];

// ---------------------------------------------------------------------------
// 4. DIETS
// ---------------------------------------------------------------------------
const DIETS = [
  { name: 'Vegetarian', description: 'No meat or seafood' },
  { name: 'Vegan', description: 'Plant-based, 100% dairy and meat free' },
  { name: 'Non-Vegetarian', description: 'Includes poultry, meat, or seafood' },
  { name: 'Gluten Free', description: 'Free of gluten proteins from wheat and barley' },
  { name: 'Keto', description: 'Low carbohydrate, high healthy fat meals' },
  { name: 'High Protein', description: 'Focus on muscle building and recovery' },
];

// ---------------------------------------------------------------------------
// 5. ALLERGENS
// ---------------------------------------------------------------------------
const ALLERGENS = [
  { name: 'Dairy', description: 'Cow or goat milk and derived dairy products' },
  { name: 'Gluten', description: 'Wheat, rye, and barley derived proteins' },
  { name: 'Egg', description: 'Poultry egg proteins' },
  { name: 'Peanut', description: 'Peanuts and peanut derivatives' },
  { name: 'Soy', description: 'Soybeans and soy-based ingredients' },
  { name: 'Tree Nut', description: 'Almonds, cashews, walnuts, pistachios' },
];

// ---------------------------------------------------------------------------
// 6. TAGS
// ---------------------------------------------------------------------------
const TAGS = [
  { name: 'Quick & Easy', description: 'Can be cooked under 20 minutes' },
  { name: 'Comfort Food', description: 'Hearty, soul-soothing dishes' },
  { name: 'Spicy', description: 'Zesty, spicy, and bold flavours' },
  { name: 'Budget Friendly', description: 'Everyday affordable pantry staples' },
  { name: 'Party Special', description: 'Crowd-pleasers for celebrations' },
  { name: 'Healthy', description: 'Low calorie, nutrient-dense nutrition' },
];

// ---------------------------------------------------------------------------
// 7. INGREDIENTS WITH ALLERGEN MAPPINGS
// ---------------------------------------------------------------------------
interface IngredientSeed {
  name: string;
  allergens?: string[];
}

const INGREDIENTS: IngredientSeed[] = [
  // Dairy
  { name: 'Paneer', allergens: ['Dairy'] },
  { name: 'Butter', allergens: ['Dairy'] },
  { name: 'Milk', allergens: ['Dairy'] },
  { name: 'Cream', allergens: ['Dairy'] },
  { name: 'Cheese', allergens: ['Dairy'] },

  // Vegetables
  { name: 'Tomato' },
  { name: 'Onion' },
  { name: 'Potato' },
  { name: 'Garlic' },
  { name: 'Ginger' },
  { name: 'Carrot' },
  { name: 'Peas' },
  { name: 'Capsicum' },
  { name: 'Green Chili' },
  { name: 'Spinach' },
  { name: 'Cucumber' },
  { name: 'Lemon' },

  // Grains & Pantry
  { name: 'Rice' },
  { name: 'Wheat Flour', allergens: ['Gluten'] },
  { name: 'Cooking Oil' },
  { name: 'Salt' },
  { name: 'Cumin Seeds' },
  { name: 'Turmeric Powder' },
  { name: 'Chili Powder' },
  { name: 'Garam Masala' },

  // Proteins
  { name: 'Chicken' },
  { name: 'Egg', allergens: ['Egg'] },
  { name: 'Tofu', allergens: ['Soy'] },
];

// ---------------------------------------------------------------------------
// 8. RECIPES SEED DATA
// ---------------------------------------------------------------------------
interface RecipeSeedIngredient {
  name: string;
  quantity: number;
  unitSymbol: string;
  preparationNote?: string;
}

interface RecipeSeedData {
  name: string;
  description: string;
  difficulty: RecipeDifficulty;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  imageUrl: string;
  categories: string[];
  cuisines: string[];
  diets: string[];
  tags: string[];
  nutrition: {
    caloriesKcal: number;
    proteinG: number;
    carbohydratesG: number;
    fatG: number;
    fibreG: number;
  };
  metadata: Record<string, any>;
  steps: { stepNumber: number; instruction: string; durationMinutes?: number }[];
  ingredients: RecipeSeedIngredient[];
}

const RECIPES: RecipeSeedData[] = [
  {
    name: 'Paneer Butter Masala',
    description: 'A rich, creamy, and mildly sweet Indian gravy made with fresh paneer cubes, tomatoes, and authentic spices.',
    difficulty: RecipeDifficulty.MEDIUM,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    servings: 4,
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
    categories: ['Lunch', 'Dinner'],
    cuisines: ['Indian'],
    diets: ['Vegetarian', 'Gluten Free'],
    tags: ['Comfort Food', 'Party Special'],
    nutrition: {
      caloriesKcal: 320,
      proteinG: 12.5,
      carbohydratesG: 8.0,
      fatG: 26.0,
      fibreG: 2.1,
    },
    metadata: {
      vitamins: 'Vitamin A, Calcium, Vitamin D',
    },
    steps: [
      { stepNumber: 1, instruction: 'Heat butter in a large pan on medium heat.', durationMinutes: 2 },
      { stepNumber: 2, instruction: 'Add finely chopped ginger, minced garlic, and onions; sauté until golden brown.', durationMinutes: 5 },
      { stepNumber: 3, instruction: 'Add smooth tomato puree and cook until butter starts separating from the edges.', durationMinutes: 8 },
      { stepNumber: 4, instruction: 'Mix in salt, turmeric powder, Kashmiri red chili powder, and fragrant garam masala.', durationMinutes: 3 },
      { stepNumber: 5, instruction: 'Pour in fresh cooking cream and stir well to create a velvety sauce.', durationMinutes: 3 },
      { stepNumber: 6, instruction: 'Add fresh soft paneer cubes, cover with lid, and simmer gently on low heat.', durationMinutes: 5 },
      { stepNumber: 7, instruction: 'Garnish with a swirl of fresh cream and chopped cilantro. Serve hot with naan or rice.', durationMinutes: 4 },
    ],
    ingredients: [
      { name: 'Paneer', quantity: 200, unitSymbol: 'g', preparationNote: 'cubed' },
      { name: 'Butter', quantity: 2, unitSymbol: 'tbsp' },
      { name: 'Tomato', quantity: 3, unitSymbol: 'unit', preparationNote: 'pureed' },
      { name: 'Onion', quantity: 1, unitSymbol: 'unit', preparationNote: 'finely chopped' },
      { name: 'Cream', quantity: 2, unitSymbol: 'tbsp' },
      { name: 'Ginger', quantity: 1, unitSymbol: 'tsp', preparationNote: 'grated' },
      { name: 'Garlic', quantity: 1, unitSymbol: 'tsp', preparationNote: 'minced' },
      { name: 'Salt', quantity: 1, unitSymbol: 'tsp' },
      { name: 'Turmeric Powder', quantity: 0.5, unitSymbol: 'tsp' },
      { name: 'Chili Powder', quantity: 1, unitSymbol: 'tsp' },
      { name: 'Garam Masala', quantity: 0.5, unitSymbol: 'tsp' },
    ],
  },
  {
    name: 'Veg Fried Rice',
    description: 'Classic Indo-Chinese style wok-tossed fried rice loaded with crispy diced vegetables.',
    difficulty: RecipeDifficulty.EASY,
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 2,
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
    categories: ['Lunch', 'Dinner'],
    cuisines: ['Chinese'],
    diets: ['Vegetarian', 'Vegan'],
    tags: ['Quick & Easy'],
    nutrition: {
      caloriesKcal: 250,
      proteinG: 5.5,
      carbohydratesG: 48.0,
      fatG: 4.5,
      fibreG: 3.2,
    },
    metadata: {
      vitamins: 'Vitamin C, Vitamin B6, Iron',
    },
    steps: [
      { stepNumber: 1, instruction: 'Boil rice beforehand and let it cool completely so grains remain separate.', durationMinutes: 10 },
      { stepNumber: 2, instruction: 'Heat cooking oil in a large wok over high flame.', durationMinutes: 2 },
      { stepNumber: 3, instruction: 'Add minced garlic and onions; toss quickly until aromatic.', durationMinutes: 2 },
      { stepNumber: 4, instruction: 'Add finely diced carrots and green peas; stir-fry rapidly on high flame to maintain crunch.', durationMinutes: 3 },
      { stepNumber: 5, instruction: 'Toss in cold cooked rice and spread gently.', durationMinutes: 2 },
      { stepNumber: 6, instruction: 'Season with salt and freshly cracked black pepper.', durationMinutes: 1 },
      { stepNumber: 7, instruction: 'Stir-fry briskly for 3 minutes until steaming hot and serve immediately.', durationMinutes: 3 },
    ],
    ingredients: [
      { name: 'Rice', quantity: 1, unitSymbol: 'cup', preparationNote: 'cooked and cooled' },
      { name: 'Carrot', quantity: 0.5, unitSymbol: 'cup', preparationNote: 'finely diced' },
      { name: 'Peas', quantity: 0.25, unitSymbol: 'cup' },
      { name: 'Onion', quantity: 1, unitSymbol: 'unit', preparationNote: 'small, finely chopped' },
      { name: 'Garlic', quantity: 1, unitSymbol: 'tsp', preparationNote: 'minced' },
      { name: 'Cooking Oil', quantity: 2, unitSymbol: 'tbsp' },
      { name: 'Salt', quantity: 1, unitSymbol: 'tsp' },
    ],
  },
  {
    name: 'Tomato Soup',
    description: 'Silky, soothing roasted tomato soup simmered with garlic, butter, and fragrant herbs.',
    difficulty: RecipeDifficulty.EASY,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 2,
    imageUrl: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&auto=format&fit=crop&q=80',
    categories: ['Soup', 'Dinner'],
    cuisines: ['Continental'],
    diets: ['Vegetarian', 'Gluten Free'],
    tags: ['Comfort Food', 'Quick & Easy'],
    nutrition: {
      caloriesKcal: 120,
      proteinG: 2.5,
      carbohydratesG: 14.0,
      fatG: 6.0,
      fibreG: 1.8,
    },
    metadata: {
      vitamins: 'Vitamin C, Vitamin A, Potassium',
    },
    steps: [
      { stepNumber: 1, instruction: 'Melt butter in a soup pot over medium heat.', durationMinutes: 2 },
      { stepNumber: 2, instruction: 'Add crushed garlic cloves and chopped onions; sauté until translucent.', durationMinutes: 3 },
      { stepNumber: 3, instruction: 'Add chopped ripe tomatoes and cook until thoroughly softened.', durationMinutes: 6 },
      { stepNumber: 4, instruction: 'Blend the cooked mixture with an immersion blender until smooth.', durationMinutes: 2 },
      { stepNumber: 5, instruction: 'Strain back into the pot and stir in milk or warm water to achieve desired consistency.', durationMinutes: 2 },
      { stepNumber: 6, instruction: 'Season with salt and black pepper; simmer gently for 5 minutes.', durationMinutes: 5 },
      { stepNumber: 7, instruction: 'Serve piping hot with crunchy croutons or toasted bread.', durationMinutes: 1 },
    ],
    ingredients: [
      { name: 'Tomato', quantity: 4, unitSymbol: 'unit', preparationNote: 'ripe and chopped' },
      { name: 'Butter', quantity: 1, unitSymbol: 'tbsp' },
      { name: 'Garlic', quantity: 1, unitSymbol: 'tsp', preparationNote: 'crushed' },
      { name: 'Onion', quantity: 0.5, unitSymbol: 'unit', preparationNote: 'chopped' },
      { name: 'Milk', quantity: 0.25, unitSymbol: 'cup' },
      { name: 'Salt', quantity: 0.5, unitSymbol: 'tsp' },
    ],
  },
  {
    name: 'Aloo Jeera',
    description: 'Crispy cumin-tempered spiced potatoes cooked with green chilies, ginger, and turmeric.',
    difficulty: RecipeDifficulty.EASY,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 3,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=80',
    categories: ['Lunch', 'Dinner', 'Snacks'],
    cuisines: ['Indian'],
    diets: ['Vegetarian', 'Vegan', 'Gluten Free'],
    tags: ['Quick & Easy', 'Budget Friendly'],
    nutrition: {
      caloriesKcal: 180,
      proteinG: 3.0,
      carbohydratesG: 32.0,
      fatG: 6.5,
      fibreG: 4.2,
    },
    metadata: {
      vitamins: 'Vitamin C, Potassium, Vitamin B6',
    },
    steps: [
      { stepNumber: 1, instruction: 'Boil potatoes until tender, peel and cut into bite-sized cubes.', durationMinutes: 10 },
      { stepNumber: 2, instruction: 'Heat cooking oil in a pan over medium flame.', durationMinutes: 2 },
      { stepNumber: 3, instruction: 'Add cumin seeds (jeera) and let them crackle and release nutty aroma.', durationMinutes: 1 },
      { stepNumber: 4, instruction: 'Add finely chopped ginger and slit green chilies.', durationMinutes: 1 },
      { stepNumber: 5, instruction: 'Toss in diced potatoes, turmeric powder, red chili powder, and salt.', durationMinutes: 2 },
      { stepNumber: 6, instruction: 'Sauté on medium-high heat for 6-8 minutes until edges turn golden and crisp.', durationMinutes: 7 },
      { stepNumber: 7, instruction: 'Sprinkle fresh coriander leaves and serve hot with poori or paratha.', durationMinutes: 1 },
    ],
    ingredients: [
      { name: 'Potato', quantity: 3, unitSymbol: 'unit', preparationNote: 'boiled and diced' },
      { name: 'Cumin Seeds', quantity: 1.5, unitSymbol: 'tsp' },
      { name: 'Cooking Oil', quantity: 1.5, unitSymbol: 'tbsp' },
      { name: 'Ginger', quantity: 1, unitSymbol: 'tsp', preparationNote: 'julienned' },
      { name: 'Green Chili', quantity: 1, unitSymbol: 'unit', preparationNote: 'slit' },
      { name: 'Salt', quantity: 1, unitSymbol: 'tsp' },
      { name: 'Turmeric Powder', quantity: 0.5, unitSymbol: 'tsp' },
    ],
  },
  {
    name: 'Garlic Spinach',
    description: 'Fresh tender spinach sautéed with golden garlic, butter, sea salt, and a splash of lemon.',
    difficulty: RecipeDifficulty.EASY,
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    servings: 2,
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
    categories: ['Healthy', 'Dinner'],
    cuisines: ['Continental'],
    diets: ['Vegetarian', 'Keto', 'Gluten Free'],
    tags: ['Quick & Easy', 'Healthy'],
    nutrition: {
      caloriesKcal: 90,
      proteinG: 3.5,
      carbohydratesG: 4.0,
      fatG: 7.0,
      fibreG: 2.8,
    },
    metadata: {
      vitamins: 'Vitamin A, Vitamin K, Vitamin C, Iron, Calcium',
    },
    steps: [
      { stepNumber: 1, instruction: 'Thoroughly wash spinach leaves and drain excess water.', durationMinutes: 3 },
      { stepNumber: 2, instruction: 'Melt butter in a wide skillet over medium heat.', durationMinutes: 1 },
      { stepNumber: 3, instruction: 'Add sliced or minced garlic and sauté until fragrant and lightly golden.', durationMinutes: 2 },
      { stepNumber: 4, instruction: 'Add the spinach leaves and toss quickly on high heat for 3-4 minutes until wilted.', durationMinutes: 4 },
      { stepNumber: 5, instruction: 'Season with salt and a squeeze of fresh lemon juice.', durationMinutes: 1 },
      { stepNumber: 6, instruction: 'Transfer to a serving plate and enjoy warm.', durationMinutes: 1 },
    ],
    ingredients: [
      { name: 'Spinach', quantity: 1, unitSymbol: 'bunch', preparationNote: 'washed and trimmed' },
      { name: 'Garlic', quantity: 2, unitSymbol: 'tbsp', preparationNote: 'sliced' },
      { name: 'Butter', quantity: 1, unitSymbol: 'tbsp' },
      { name: 'Lemon', quantity: 0.5, unitSymbol: 'unit', preparationNote: 'juiced' },
      { name: 'Salt', quantity: 0.5, unitSymbol: 'tsp' },
    ],
  },
  {
    name: 'Paneer Bhurji',
    description: 'Scrambled cottage cheese tossed with spiced onions, juicy tomatoes, and vibrant herbs.',
    difficulty: RecipeDifficulty.EASY,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 2,
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
    categories: ['Breakfast', 'Lunch', 'Dinner'],
    cuisines: ['Indian'],
    diets: ['Vegetarian', 'Gluten Free', 'High Protein'],
    tags: ['Quick & Easy', 'High Protein'],
    nutrition: {
      caloriesKcal: 260,
      proteinG: 14.0,
      carbohydratesG: 5.0,
      fatG: 20.0,
      fibreG: 1.5,
    },
    metadata: {
      vitamins: 'Calcium, Vitamin D, Vitamin A',
    },
    steps: [
      { stepNumber: 1, instruction: 'Crumble fresh paneer by hand and set aside.', durationMinutes: 3 },
      { stepNumber: 2, instruction: 'Heat butter in a skillet; sauté chopped onions, ginger, and green chilies.', durationMinutes: 4 },
      { stepNumber: 3, instruction: 'Add chopped tomatoes and cook until soft and pulpy.', durationMinutes: 3 },
      { stepNumber: 4, instruction: 'Add turmeric, chili powder, garam masala, and salt.', durationMinutes: 1 },
      { stepNumber: 5, instruction: 'Toss in crumbled paneer and gently fold together.', durationMinutes: 2 },
      { stepNumber: 6, instruction: 'Cook on low heat for 3 minutes without overcooking to keep paneer moist. Serve hot.', durationMinutes: 3 },
    ],
    ingredients: [
      { name: 'Paneer', quantity: 150, unitSymbol: 'g', preparationNote: 'crumbled' },
      { name: 'Butter', quantity: 1.5, unitSymbol: 'tbsp' },
      { name: 'Onion', quantity: 1, unitSymbol: 'unit', preparationNote: 'finely chopped' },
      { name: 'Tomato', quantity: 1, unitSymbol: 'unit', preparationNote: 'chopped' },
      { name: 'Ginger', quantity: 0.5, unitSymbol: 'tsp', preparationNote: 'grated' },
      { name: 'Green Chili', quantity: 1, unitSymbol: 'unit', preparationNote: 'chopped' },
      { name: 'Salt', quantity: 0.5, unitSymbol: 'tsp' },
      { name: 'Turmeric Powder', quantity: 0.25, unitSymbol: 'tsp' },
    ],
  },
  {
    name: 'Egg Bhurji',
    description: 'Mumbai-style spicy scrambled eggs cooked with sautéed onions, tomatoes, and ground spices.',
    difficulty: RecipeDifficulty.EASY,
    prepTimeMinutes: 5,
    cookTimeMinutes: 12,
    servings: 2,
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
    categories: ['Breakfast', 'Dinner'],
    cuisines: ['Indian'],
    diets: ['Non-Vegetarian', 'Keto', 'Gluten Free'],
    tags: ['Quick & Easy', 'High Protein'],
    nutrition: {
      caloriesKcal: 210,
      proteinG: 13.0,
      carbohydratesG: 3.5,
      fatG: 16.0,
      fibreG: 0.8,
    },
    metadata: {
      vitamins: 'Vitamin D, Vitamin B12, Riboflavin, Choline',
    },
    steps: [
      { stepNumber: 1, instruction: 'Crack eggs into a bowl, add a pinch of salt, and whisk lightly.', durationMinutes: 2 },
      { stepNumber: 2, instruction: 'Heat butter in a pan; sauté chopped onions and green chilies until soft.', durationMinutes: 3 },
      { stepNumber: 3, instruction: 'Add diced tomatoes and cook until juicy.', durationMinutes: 2 },
      { stepNumber: 4, instruction: 'Pour in whisked eggs and gently stir continuously on medium-low heat.', durationMinutes: 3 },
      { stepNumber: 5, instruction: 'Sprinkle salt, turmeric, and chili powder into the soft curd.', durationMinutes: 1 },
      { stepNumber: 6, instruction: 'Cook until eggs are softly scrambled and set. Serve immediately with warm toast.', durationMinutes: 2 },
    ],
    ingredients: [
      { name: 'Egg', quantity: 3, unitSymbol: 'unit', preparationNote: 'whisked' },
      { name: 'Butter', quantity: 1, unitSymbol: 'tbsp' },
      { name: 'Onion', quantity: 1, unitSymbol: 'unit', preparationNote: 'finely chopped' },
      { name: 'Tomato', quantity: 1, unitSymbol: 'unit', preparationNote: 'chopped' },
      { name: 'Green Chili', quantity: 1, unitSymbol: 'unit', preparationNote: 'chopped' },
      { name: 'Salt', quantity: 0.5, unitSymbol: 'tsp' },
      { name: 'Chili Powder', quantity: 0.5, unitSymbol: 'tsp' },
    ],
  },
  {
    name: 'Butter Chicken',
    description: 'Iconic North Indian chicken curry marinated in spices and cooked in a silky, creamy tomato makhani gravy.',
    difficulty: RecipeDifficulty.HARD,
    prepTimeMinutes: 20,
    cookTimeMinutes: 40,
    servings: 4,
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
    categories: ['Lunch', 'Dinner'],
    cuisines: ['Indian'],
    diets: ['Non-Vegetarian', 'Gluten Free'],
    tags: ['Party Special', 'Comfort Food'],
    nutrition: {
      caloriesKcal: 450,
      proteinG: 28.0,
      carbohydratesG: 10.0,
      fatG: 33.0,
      fibreG: 1.5,
    },
    metadata: {
      vitamins: 'Vitamin A, Calcium, Niacin, Vitamin B6',
    },
    steps: [
      { stepNumber: 1, instruction: 'Marinate chicken pieces with ginger-garlic paste, yogurt, and spices for 20 minutes.', durationMinutes: 20 },
      { stepNumber: 2, instruction: 'Pan-fry or sear the chicken in a hot pan until charred and mostly cooked through.', durationMinutes: 10 },
      { stepNumber: 3, instruction: 'In a separate saucepot, melt butter and simmer onions, garlic, and fresh tomatoes.', durationMinutes: 10 },
      { stepNumber: 4, instruction: 'Blend the tomato-onion base into a silky-smooth gravy and pass through a sieve.', durationMinutes: 5 },
      { stepNumber: 5, instruction: 'Simmer the velvety gravy, add heavy cream, butter, and cooked chicken pieces.', durationMinutes: 10 },
      { stepNumber: 6, instruction: 'Finish with dried fenugreek leaves (kasoori methi) and serve hot.', durationMinutes: 5 },
    ],
    ingredients: [
      { name: 'Chicken', quantity: 300, unitSymbol: 'g', preparationNote: 'boneless pieces' },
      { name: 'Butter', quantity: 3, unitSymbol: 'tbsp' },
      { name: 'Tomato', quantity: 3, unitSymbol: 'unit', preparationNote: 'ripe, pureed' },
      { name: 'Onion', quantity: 1, unitSymbol: 'unit', preparationNote: 'chopped' },
      { name: 'Cream', quantity: 3, unitSymbol: 'tbsp' },
      { name: 'Ginger', quantity: 1.5, unitSymbol: 'tsp', preparationNote: 'paste' },
      { name: 'Garlic', quantity: 1.5, unitSymbol: 'tsp', preparationNote: 'paste' },
      { name: 'Salt', quantity: 1, unitSymbol: 'tsp' },
      { name: 'Chili Powder', quantity: 1.5, unitSymbol: 'tsp' },
    ],
  },
  {
    name: 'Vegetable Salad',
    description: 'Crisp garden vegetable salad featuring crunchy cucumbers, carrots, and sweet tomatoes with a citrus vinaigrette.',
    difficulty: RecipeDifficulty.EASY,
    prepTimeMinutes: 8,
    cookTimeMinutes: 8,
    servings: 2,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    categories: ['Healthy', 'Snacks'],
    cuisines: ['Global'],
    diets: ['Vegetarian', 'Vegan', 'Gluten Free', 'Keto'],
    tags: ['Quick & Easy', 'Healthy'],
    nutrition: {
      caloriesKcal: 60,
      proteinG: 1.5,
      carbohydratesG: 12.0,
      fatG: 0.5,
      fibreG: 3.5,
    },
    metadata: {
      vitamins: 'Vitamin C, Vitamin A, Vitamin K, Potassium',
    },
    steps: [
      { stepNumber: 1, instruction: 'Wash all vegetables thoroughly in clean cold water.', durationMinutes: 2 },
      { stepNumber: 2, instruction: 'Dice cucumbers, carrots, and tomatoes into bite-sized uniform pieces.', durationMinutes: 4 },
      { stepNumber: 3, instruction: 'Toss vegetables together in a salad mixing bowl.', durationMinutes: 1 },
      { stepNumber: 4, instruction: 'Drizzle freshly squeezed lemon juice over the top.', durationMinutes: 1 },
      { stepNumber: 5, instruction: 'Season with sea salt and cracked black pepper; mix gently and serve fresh.', durationMinutes: 1 },
    ],
    ingredients: [
      { name: 'Cucumber', quantity: 1, unitSymbol: 'unit', preparationNote: 'diced' },
      { name: 'Tomato', quantity: 1, unitSymbol: 'unit', preparationNote: 'diced' },
      { name: 'Carrot', quantity: 1, unitSymbol: 'unit', preparationNote: 'sliced' },
      { name: 'Lemon', quantity: 0.5, unitSymbol: 'unit', preparationNote: 'juiced' },
      { name: 'Salt', quantity: 0.5, unitSymbol: 'tsp' },
    ],
  },
];

// ---------------------------------------------------------------------------
// MAIN SEEDING RUNNER
// ---------------------------------------------------------------------------
async function main() {
  console.log('====================================================');
  console.log('🌱 WhatToCook Database Seeding Initialized');
  console.log('====================================================');

  // 1. Seed Units
  console.log('\n[1/7] Seeding Measurement Units...');
  const unitMap = new Map<string, string>();
  for (const unit of UNITS) {
    const record = await prisma.unit.upsert({
      where: { name: unit.name },
      update: { symbol: unit.symbol },
      create: { name: unit.name, symbol: unit.symbol },
    });
    unitMap.set(unit.name, record.id);
    if (unit.symbol) {
      unitMap.set(unit.symbol, record.id);
    }
  }
  console.log(`  ✓ Seeded ${UNITS.length} units of measurement.`);

  // 2. Seed Categories
  console.log('\n[2/7] Seeding Categories...');
  const categoryMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const slug = slugify(cat.name);
    const record = await prisma.category.upsert({
      where: { name: cat.name },
      update: {
        slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
      },
      create: {
        name: cat.name,
        slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
    categoryMap.set(cat.name, record.id);
  }
  console.log(`  ✓ Seeded ${CATEGORIES.length} categories.`);

  // 3. Seed Cuisines
  console.log('\n[3/7] Seeding Cuisines...');
  const cuisineMap = new Map<string, string>();
  for (const cuisine of CUISINES) {
    const slug = slugify(cuisine.name);
    const record = await prisma.cuisine.upsert({
      where: { name: cuisine.name },
      update: {
        slug,
        description: cuisine.description,
      },
      create: {
        name: cuisine.name,
        slug,
        description: cuisine.description,
        isActive: true,
      },
    });
    cuisineMap.set(cuisine.name, record.id);
  }
  console.log(`  ✓ Seeded ${CUISINES.length} cuisines.`);

  // 4. Seed Diets & Allergens
  console.log('\n[4/7] Seeding Diets & Allergens...');
  const dietMap = new Map<string, string>();
  for (const diet of DIETS) {
    const slug = slugify(diet.name);
    const record = await prisma.diet.upsert({
      where: { name: diet.name },
      update: {
        slug,
        description: diet.description,
      },
      create: {
        name: diet.name,
        slug,
        description: diet.description,
        isActive: true,
      },
    });
    dietMap.set(diet.name, record.id);
  }

  const allergenMap = new Map<string, string>();
  for (const allergen of ALLERGENS) {
    const slug = slugify(allergen.name);
    const record = await prisma.allergen.upsert({
      where: { name: allergen.name },
      update: {
        slug,
        description: allergen.description,
      },
      create: {
        name: allergen.name,
        slug,
        description: allergen.description,
      },
    });
    allergenMap.set(allergen.name, record.id);
  }
  console.log(`  ✓ Seeded ${DIETS.length} diets and ${ALLERGENS.length} allergens.`);

  // 5. Seed Tags
  console.log('\n[5/7] Seeding Tags...');
  const tagMap = new Map<string, string>();
  for (const tag of TAGS) {
    const slug = slugify(tag.name);
    const record = await prisma.tag.upsert({
      where: { name: tag.name },
      update: {
        slug,
        description: tag.description,
      },
      create: {
        name: tag.name,
        slug,
        description: tag.description,
        isActive: true,
      },
    });
    tagMap.set(tag.name, record.id);
  }
  console.log(`  ✓ Seeded ${TAGS.length} tags.`);

  // 6. Seed Ingredients and link allergens
  console.log('\n[6/7] Seeding Ingredients & Allergen Relations...');
  const ingredientMap = new Map<string, string>();
  for (const ing of INGREDIENTS) {
    const slug = slugify(ing.name);
    const record = await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: { slug },
      create: { name: ing.name, slug },
    });
    ingredientMap.set(ing.name, record.id);

    // Link allergens if specified
    if (ing.allergens && ing.allergens.length > 0) {
      for (const allergenName of ing.allergens) {
        const allergenId = allergenMap.get(allergenName);
        if (allergenId) {
          await prisma.ingredientAllergen.upsert({
            where: {
              ingredientId_allergenId: {
                ingredientId: record.id,
                allergenId,
              },
            },
            update: {},
            create: {
              ingredientId: record.id,
              allergenId,
            },
          });
        }
      }
    }
  }
  console.log(`  ✓ Seeded ${INGREDIENTS.length} master ingredients with allergen mappings.`);

  // 7. Seed Recipes, Steps, Nutrition, Ingredients & Taxonomy Mappings
  console.log('\n[7/7] Seeding Recipes, Steps, Nutrition, and Mappings...');
  for (const r of RECIPES) {
    const recipeSlug = slugify(r.name);

    // Upsert base recipe
    const dbRecipe = await prisma.recipe.upsert({
      where: { slug: recipeSlug },
      update: {
        name: r.name,
        description: r.description,
        imageUrl: r.imageUrl,
        difficulty: r.difficulty,
        prepTimeMinutes: r.prepTimeMinutes,
        cookTimeMinutes: r.cookTimeMinutes,
        servings: r.servings,
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        metadata: r.metadata,
      },
      create: {
        name: r.name,
        slug: recipeSlug,
        description: r.description,
        imageUrl: r.imageUrl,
        difficulty: r.difficulty,
        prepTimeMinutes: r.prepTimeMinutes,
        cookTimeMinutes: r.cookTimeMinutes,
        servings: r.servings,
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        metadata: r.metadata,
      },
    });

    // Seed Nutrition (1-to-1)
    await prisma.recipeNutrition.upsert({
      where: { recipeId: dbRecipe.id },
      update: {
        caloriesKcal: r.nutrition.caloriesKcal,
        proteinG: r.nutrition.proteinG,
        carbohydratesG: r.nutrition.carbohydratesG,
        fatG: r.nutrition.fatG,
        fibreG: r.nutrition.fibreG,
      },
      create: {
        recipeId: dbRecipe.id,
        caloriesKcal: r.nutrition.caloriesKcal,
        proteinG: r.nutrition.proteinG,
        carbohydratesG: r.nutrition.carbohydratesG,
        fatG: r.nutrition.fatG,
        fibreG: r.nutrition.fibreG,
      },
    });

    // Re-seed Steps cleanly
    await prisma.recipeStep.deleteMany({
      where: { recipeId: dbRecipe.id },
    });
    for (const step of r.steps) {
      await prisma.recipeStep.create({
        data: {
          recipeId: dbRecipe.id,
          stepNumber: step.stepNumber,
          instruction: step.instruction,
          durationMinutes: step.durationMinutes,
        },
      });
    }

    // Re-seed Ingredients cleanly
    await prisma.recipeIngredient.deleteMany({
      where: { recipeId: dbRecipe.id },
    });
    let sortOrder = 1;
    for (const ing of r.ingredients) {
      const ingredientId = ingredientMap.get(ing.name);
      const unitId = unitMap.get(ing.unitSymbol) || null;

      if (ingredientId) {
        await prisma.recipeIngredient.create({
          data: {
            recipeId: dbRecipe.id,
            ingredientId,
            unitId,
            quantity: ing.quantity,
            preparationNote: ing.preparationNote,
            sortOrder: sortOrder++,
          },
        });
      }
    }

    // Seed Recipe Categories
    for (const catName of r.categories) {
      const categoryId = categoryMap.get(catName);
      if (categoryId) {
        await prisma.recipeCategory.upsert({
          where: {
            recipeId_categoryId: {
              recipeId: dbRecipe.id,
              categoryId,
            },
          },
          update: {},
          create: {
            recipeId: dbRecipe.id,
            categoryId,
          },
        });
      }
    }

    // Seed Recipe Cuisines
    for (const cuisineName of r.cuisines) {
      const cuisineId = cuisineMap.get(cuisineName);
      if (cuisineId) {
        await prisma.recipeCuisine.upsert({
          where: {
            recipeId_cuisineId: {
              recipeId: dbRecipe.id,
              cuisineId,
            },
          },
          update: {},
          create: {
            recipeId: dbRecipe.id,
            cuisineId,
          },
        });
      }
    }

    // Seed Recipe Diets
    for (const dietName of r.diets) {
      const dietId = dietMap.get(dietName);
      if (dietId) {
        await prisma.recipeDiet.upsert({
          where: {
            recipeId_dietId: {
              recipeId: dbRecipe.id,
              dietId,
            },
          },
          update: {},
          create: {
            recipeId: dbRecipe.id,
            dietId,
          },
        });
      }
    }

    // Seed Recipe Tags
    for (const tagName of r.tags) {
      const tagId = tagMap.get(tagName);
      if (tagId) {
        await prisma.recipeTag.upsert({
          where: {
            recipeId_tagId: {
              recipeId: dbRecipe.id,
              tagId,
            },
          },
          update: {},
          create: {
            recipeId: dbRecipe.id,
            tagId,
          },
        });
      }
    }
  }
  console.log(`  ✓ Seeded ${RECIPES.length} complete recipes with steps, nutrition, ingredients & taxonomy.`);

  console.log('\n====================================================');
  console.log('✨ All Database Seeding Completed Successfully!');
  console.log('====================================================\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
