import { prisma } from '../src/config/db';

const INGREDIENTS = [
  // Dairy
  { name: 'Paneer', category: 'Dairy' },
  { name: 'Butter', category: 'Dairy' },
  { name: 'Milk', category: 'Dairy' },
  { name: 'Cream', category: 'Dairy' },
  { name: 'Cheese', category: 'Dairy' },
  // Vegetables
  { name: 'Tomato', category: 'Vegetables' },
  { name: 'Onion', category: 'Vegetables' },
  { name: 'Potato', category: 'Vegetables' },
  { name: 'Garlic', category: 'Vegetables' },
  { name: 'Ginger', category: 'Vegetables' },
  { name: 'Carrot', category: 'Vegetables' },
  { name: 'Peas', category: 'Vegetables' },
  { name: 'Capsicum', category: 'Vegetables' },
  { name: 'Green Chili', category: 'Vegetables' },
  { name: 'Spinach', category: 'Vegetables' },
  { name: 'Cucumber', category: 'Vegetables' },
  { name: 'Lemon', category: 'Vegetables' },
  // Grains & Pantry
  { name: 'Rice', category: 'Grains' },
  { name: 'Wheat Flour', category: 'Grains' },
  { name: 'Cooking Oil', category: 'Pantry' },
  { name: 'Salt', category: 'Pantry' },
  { name: 'Cumin Seeds', category: 'Pantry' },
  { name: 'Turmeric Powder', category: 'Pantry' },
  { name: 'Chili Powder', category: 'Pantry' },
  { name: 'Garam Masala', category: 'Pantry' },
  // Proteins
  { name: 'Chicken', category: 'Proteins' },
  { name: 'Egg', category: 'Proteins' },
  { name: 'Tofu', category: 'Proteins' }
];

const RECIPES = [
  {
    name: 'Paneer Butter Masala',
    category: 'Indian',
    cookingTime: 30,
    difficulty: 'Medium',
    instructions: '1. Heat butter in a pan.\n2. Add chopped ginger, garlic, and onions; sauté until golden brown.\n3. Add pureed tomatoes and cook until oil separates.\n4. Mix in salt, turmeric, chili powder, and garam masala.\n5. Pour in cream and stir well.\n6. Add paneer cubes, cover and simmer for 5 minutes.\n7. Serve hot garnished with fresh cream.',
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
    calories: 320,
    protein: 12.5,
    carbs: 8.0,
    fat: 26.0,
    fiber: 2.1,
    vitamins: 'Vitamin A, Calcium, Vitamin D',
    ingredients: [
      { name: 'Paneer', quantity: '200g' },
      { name: 'Butter', quantity: '2 tbsp' },
      { name: 'Tomato', quantity: '3 medium' },
      { name: 'Onion', quantity: '1 medium' },
      { name: 'Cream', quantity: '2 tbsp' },
      { name: 'Ginger', quantity: '1 tsp' },
      { name: 'Garlic', quantity: '1 tsp' },
      { name: 'Salt', quantity: '1 tsp' },
      { name: 'Turmeric Powder', quantity: '1/2 tsp' },
      { name: 'Chili Powder', quantity: '1 tsp' },
      { name: 'Garam Masala', quantity: '1/2 tsp' }
    ]
  },
  {
    name: 'Veg Fried Rice',
    category: 'Chinese',
    cookingTime: 20,
    difficulty: 'Easy',
    instructions: '1. Boil rice and let it cool completely.\n2. Heat oil in a large wok.\n3. Add finely chopped garlic, onions, carrots, and peas; stir-fry on high heat.\n4. Toss in the cold cooked rice.\n5. Season with salt and black pepper.\n6. Mix well and stir-fry for 3-5 minutes.\n7. Serve hot.',
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
    calories: 250,
    protein: 5.5,
    carbs: 48.0,
    fat: 4.5,
    fiber: 3.2,
    vitamins: 'Vitamin C, Vitamin B6, Iron',
    ingredients: [
      { name: 'Rice', quantity: '1 cup' },
      { name: 'Carrot', quantity: '1/2 cup' },
      { name: 'Peas', quantity: '1/4 cup' },
      { name: 'Onion', quantity: '1 small' },
      { name: 'Garlic', quantity: '1 tsp' },
      { name: 'Cooking Oil', quantity: '2 tbsp' },
      { name: 'Salt', quantity: '1 tsp' }
    ]
  },
  {
    name: 'Tomato Soup',
    category: 'Soup',
    cookingTime: 15,
    difficulty: 'Easy',
    instructions: '1. Heat butter in a pan.\n2. Add crushed garlic and onions; sauté.\n3. Add chopped tomatoes and cook until soft.\n4. Puree the cooked mixture until smooth.\n5. Strain back into the pot, add milk/water to adjust consistency.\n6. Season with salt and simmer for 5 minutes.\n7. Serve hot with croutons.',
    imageUrl: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&auto=format&fit=crop&q=80',
    calories: 120,
    protein: 2.5,
    carbs: 14.0,
    fat: 6.0,
    fiber: 1.8,
    vitamins: 'Vitamin C, Vitamin A, Potassium',
    ingredients: [
      { name: 'Tomato', quantity: '4 large' },
      { name: 'Butter', quantity: '1 tbsp' },
      { name: 'Garlic', quantity: '1 tsp' },
      { name: 'Onion', quantity: '1/2 small' },
      { name: 'Milk', quantity: '1/4 cup' },
      { name: 'Salt', quantity: '1/2 tsp' }
    ]
  },
  {
    name: 'Aloo Jeera',
    category: 'Indian',
    cookingTime: 15,
    difficulty: 'Easy',
    instructions: '1. Boil potatoes, peel and dice them.\n2. Heat cooking oil in a pan.\n3. Add cumin seeds (jeera) and let them splutter.\n4. Add ginger and green chilies.\n5. Toss in the diced potatoes, turmeric, chili powder, and salt.\n6. Sauté on medium heat for 5-7 minutes until potatoes turn crisp.\n7. Serve hot.',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=80',
    calories: 180,
    protein: 3.0,
    carbs: 32.0,
    fat: 6.5,
    fiber: 4.2,
    vitamins: 'Vitamin C, Potassium, Vitamin B6',
    ingredients: [
      { name: 'Potato', quantity: '3 medium' },
      { name: 'Cumin Seeds', quantity: '1.5 tsp' },
      { name: 'Cooking Oil', quantity: '1.5 tbsp' },
      { name: 'Ginger', quantity: '1 tsp' },
      { name: 'Green Chili', quantity: '1 unit' },
      { name: 'Salt', quantity: '1 tsp' },
      { name: 'Turmeric Powder', quantity: '1/2 tsp' }
    ]
  },
  {
    name: 'Garlic Spinach',
    category: 'Healthy',
    cookingTime: 10,
    difficulty: 'Easy',
    instructions: '1. Wash spinach leaves thoroughly.\n2. Heat butter in a pan.\n3. Add plenty of minced garlic and sauté until fragrant.\n4. Toss in spinach leaves and sauté on high heat for 3-4 minutes until wilted.\n5. Season with salt and lemon juice.\n6. Serve hot.',
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
    calories: 90,
    protein: 3.5,
    carbs: 4.0,
    fat: 7.0,
    fiber: 2.8,
    vitamins: 'Vitamin A, Vitamin K, Vitamin C, Iron, Calcium',
    ingredients: [
      { name: 'Spinach', quantity: '1 bunch' },
      { name: 'Garlic', quantity: '2 tbsp' },
      { name: 'Butter', quantity: '1 tbsp' },
      { name: 'Lemon', quantity: '1/2 unit' },
      { name: 'Salt', quantity: '1/2 tsp' }
    ]
  },
  {
    name: 'Paneer Bhurji',
    category: 'Indian',
    cookingTime: 15,
    difficulty: 'Easy',
    instructions: '1. Crumble the paneer.\n2. Heat butter in a pan and sauté chopped onions, ginger, and green chilies.\n3. Add tomatoes and cook until soft.\n4. Add turmeric, chili powder, garam masala, and salt.\n5. Toss in crumbled paneer and mix well.\n6. Cook for 3-4 minutes on low heat. Serve hot.',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
    calories: 260,
    protein: 14.0,
    carbs: 5.0,
    fat: 20.0,
    fiber: 1.5,
    vitamins: 'Calcium, Vitamin D, Vitamin A',
    ingredients: [
      { name: 'Paneer', quantity: '150g' },
      { name: 'Butter', quantity: '1.5 tbsp' },
      { name: 'Onion', quantity: '1 medium' },
      { name: 'Tomato', quantity: '1 medium' },
      { name: 'Ginger', quantity: '1/2 tsp' },
      { name: 'Green Chili', quantity: '1 unit' },
      { name: 'Salt', quantity: '1/2 tsp' },
      { name: 'Turmeric Powder', quantity: '1/4 tsp' }
    ]
  },
  {
    name: 'Egg Bhurji',
    category: 'Indian',
    cookingTime: 12,
    difficulty: 'Easy',
    instructions: '1. Whisk eggs in a bowl with a pinch of salt.\n2. Heat butter in a pan; add chopped onions and green chilies, and sauté.\n3. Add tomatoes and cook until soft.\n4. Pour in the whisked eggs and stir continuously on low heat to scramble them.\n5. Add salt, turmeric, and chili powder.\n6. Cook until eggs are set and serve hot.',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
    calories: 210,
    protein: 13.0,
    carbs: 3.5,
    fat: 16.0,
    fiber: 0.8,
    vitamins: 'Vitamin D, Vitamin B12, Riboflavin, Choline',
    ingredients: [
      { name: 'Egg', quantity: '3 units' },
      { name: 'Butter', quantity: '1 tbsp' },
      { name: 'Onion', quantity: '1 medium' },
      { name: 'Tomato', quantity: '1 medium' },
      { name: 'Green Chili', quantity: '1 unit' },
      { name: 'Salt', quantity: '1/2 tsp' },
      { name: 'Chili Powder', quantity: '1/2 tsp' }
    ]
  },
  {
    name: 'Butter Chicken',
    category: 'Indian',
    cookingTime: 40,
    difficulty: 'Hard',
    instructions: '1. Marinate chicken with ginger-garlic paste, salt, yogurt, and spices.\n2. Grill or pan-fry chicken until cooked.\n3. In a separate pan, melt butter and sauté onions and tomatoes.\n4. Blend the onion-tomato mixture to make a smooth gravy.\n5. Heat gravy, add cream, spices, and chicken.\n6. Simmer for 10 minutes. Serve hot.',
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
    calories: 450,
    protein: 28.0,
    carbs: 10.0,
    fat: 33.0,
    fiber: 1.5,
    vitamins: 'Vitamin A, Calcium, Niacin, Vitamin B6',
    ingredients: [
      { name: 'Chicken', quantity: '300g' },
      { name: 'Butter', quantity: '3 tbsp' },
      { name: 'Tomato', quantity: '3 medium' },
      { name: 'Onion', quantity: '1 medium' },
      { name: 'Cream', quantity: '3 tbsp' },
      { name: 'Ginger', quantity: '1.5 tsp' },
      { name: 'Garlic', quantity: '1.5 tsp' },
      { name: 'Salt', quantity: '1 tsp' },
      { name: 'Chili Powder', quantity: '1.5 tsp' }
    ]
  },
  {
    name: 'Vegetable Salad',
    category: 'Healthy',
    cookingTime: 8,
    difficulty: 'Easy',
    instructions: '1. Wash and chop cucumber, tomatoes, and carrots into bite-sized pieces.\n2. Toss them in a mixing bowl.\n3. Add freshly squeezed lemon juice.\n4. Season with salt and pepper.\n5. Mix well and serve immediately.',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    calories: 60,
    protein: 1.5,
    carbs: 12.0,
    fat: 0.5,
    fiber: 3.5,
    vitamins: 'Vitamin C, Vitamin A, Vitamin K, Potassium',
    ingredients: [
      { name: 'Cucumber', quantity: '1 unit' },
      { name: 'Tomato', quantity: '1 medium' },
      { name: 'Carrot', quantity: '1 medium' },
      { name: 'Lemon', quantity: '1/2 unit' },
      { name: 'Salt', quantity: '1/2 tsp' }
    ]
  }
];

async function main() {
  console.log('Start seeding...');

  // 1. Seed Ingredients
  const ingredientMap: Record<string, number> = {};
  for (const ing of INGREDIENTS) {
    const dbIng = await prisma.ingredient.upsert({
      where: { ingredientName: ing.name },
      update: { category: ing.category },
      create: { ingredientName: ing.name, category: ing.category }
    });
    ingredientMap[ing.name] = dbIng.id;
  }
  console.log(`Seeded ${INGREDIENTS.length} ingredients.`);

  // 2. Seed Recipes & recipe-ingredient mappings
  for (const r of RECIPES) {
    const dbRecipe = await prisma.recipe.upsert({
      where: { recipeName: r.name },
      update: {
        category: r.category,
        cookingTime: r.cookingTime,
        difficultyLevel: r.difficulty,
        instructions: r.instructions,
        imageUrl: r.imageUrl,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        fiber: r.fiber,
        vitamins: r.vitamins
      },
      create: {
        recipeName: r.name,
        category: r.category,
        cookingTime: r.cookingTime,
        difficultyLevel: r.difficulty,
        instructions: r.instructions,
        imageUrl: r.imageUrl,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        fiber: r.fiber,
        vitamins: r.vitamins
      }
    });

    // Create recipe-ingredient relations
    for (const ri of r.ingredients) {
      const ingredientId = ingredientMap[ri.name];
      if (ingredientId) {
        await prisma.recipeIngredient.upsert({
          where: {
            recipeId_ingredientId: {
              recipeId: dbRecipe.id,
              ingredientId: ingredientId
            }
          },
          update: { quantity: ri.quantity },
          create: {
            recipeId: dbRecipe.id,
            ingredientId: ingredientId,
            quantity: ri.quantity
          }
        });
      }
    }
  }
  console.log(`Seeded ${RECIPES.length} recipes and mappings.`);


  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
