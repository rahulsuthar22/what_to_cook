'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  ChefHat, 
  Clock, 
  Flame, 
  CalendarPlus, 
  ArrowLeft,
  BookOpen,
  Sparkles,
  Award,
  Bookmark,
  Calendar,
  Heart,
  Check,
  AlertCircle,
  Leaf,
  Info
} from 'lucide-react';

interface IngredientDetail {
  name: string;
  quantity: string;
  matched: boolean;
}

interface RecipeDetail {
  recipe_id: number;
  recipe_name: string;
  category: string;
  cooking_time: number;
  difficulty_level: string;
  image_url?: string;
  video_url?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  vitamins?: string;
  instructions: string;
  ingredients: { name: string; quantity: string }[];
}

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const recipeIdStr = resolvedParams.id;
  const recipeId = parseInt(recipeIdStr, 10);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const pantryParam = searchParams.get('pantry') || '';
  const pantryIngredients = pantryParam ? pantryParam.split(',').map(i => i.trim().toLowerCase()) : [];

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [allRecipes, setAllRecipes] = useState<RecipeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [plannerDate, setPlannerDate] = useState('');
  const [plannerType, setPlannerType] = useState('Lunch');
  const [plannerSuccess, setPlannerSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'nutrition' | 'ingredients' | 'instructions' | 'schedule'>('nutrition');
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [addingGrocery, setAddingGrocery] = useState(false);
  const [grocerySuccess, setGrocerySuccess] = useState(false);

  // Fetch recipe details and all recipes for side recommendations
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // Fetch current recipe
        const resDetail = await fetch(`/api/recipes/${recipeId}`);
        const dataDetail = await resDetail.json();
        if (dataDetail.success) {
          setRecipe(dataDetail.recipe);
        }

        // Fetch all recipes for similarity recommendation
        const resAll = await fetch('/api/recipes');
        const dataAll = await resAll.json();
        if (dataAll.success) {
          setAllRecipes(dataAll.recipes.map((r: any) => ({
            recipe_id: r.recipe_id,
            recipe_name: r.recipe_name,
            category: r.category,
            cooking_time: r.cooking_time,
            difficulty_level: r.difficulty_level,
            image_url: r.image_url,
            video_url: r.video_url,
            calories: r.calories,
            protein: r.protein,
            carbs: r.carbs,
            fat: r.fat,
            fiber: r.fiber,
            vitamins: r.vitamins,
            instructions: r.instructions,
            ingredients: r.ingredients
          })));
        }
      } catch (err) {
        console.error('Error fetching recipe page details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      fetchDetails();
    }
  }, [recipeId]);

  const handleAddToPlanner = async () => {
    if (!user || !plannerDate || !recipe) return;
    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          recipe_id: recipe.recipe_id,
          meal_type: plannerType,
          meal_date: plannerDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlannerSuccess(true);
        setTimeout(() => setPlannerSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error adding to planner:', err);
    }
  };

  const handleAddMissingToGrocery = async (missingIngredients: { name: string; quantity: string }[]) => {
    if (!user || missingIngredients.length === 0) return;
    setAddingGrocery(true);
    setGrocerySuccess(false);
    try {
      await Promise.all(
        missingIngredients.map(ing => 
          fetch('/api/grocery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.uid,
              ingredient_name: ing.name,
              quantity: ing.quantity || 'as needed'
            })
          })
        )
      );
      setGrocerySuccess(true);
      setTimeout(() => setGrocerySuccess(false), 4000);
    } catch (err) {
      console.error('Error adding missing ingredients to grocery list:', err);
    } finally {
      setAddingGrocery(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--text-secondary)' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span>Fetching recipe detail page...</span>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        <ChefHat size={48} style={{ color: 'var(--error)', marginBottom: '1rem' }} />
        <h2>Recipe not found</h2>
        <Link href="/recommendations" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Recommendations
        </Link>
      </div>
    );
  }

  // Derive matching ingredients
  const ingredientsDetails: IngredientDetail[] = recipe.ingredients.map(ing => {
    const matched = pantryIngredients.includes(ing.name.toLowerCase());
    return {
      name: ing.name,
      quantity: ing.quantity,
      matched
    };
  });

  const totalIngredients = ingredientsDetails.length;
  const matchedIngredients = ingredientsDetails.filter(i => i.matched).length;
  const matchPercentage = totalIngredients > 0 ? Math.round((matchedIngredients / totalIngredients) * 100) : 0;

  const getDietLabels = (recipeDetail: RecipeDetail) => {
    const labels: { id: string; label: string; compatible: boolean; reason: string }[] = [];
    const ingNames = recipeDetail.ingredients.map(i => i.name.toLowerCase());

    const hasMeat = ingNames.some(i => i.includes('chicken') || i.includes('meat') || i.includes('fish') || i.includes('pork') || i.includes('beef') || i.includes('egg') || recipeDetail.recipe_name.toLowerCase().includes('chicken'));
    const hasEgg = ingNames.some(i => i.includes('egg')) || recipeDetail.recipe_name.toLowerCase().includes('egg');
    const hasDairy = ingNames.some(i => i.includes('milk') || i.includes('cream') || i.includes('cheese') || i.includes('paneer') || i.includes('butter') || i.includes('yogurt') || recipeDetail.recipe_name.toLowerCase().includes('paneer') || recipeDetail.recipe_name.toLowerCase().includes('butter'));
    const hasGluten = ingNames.some(i => i.includes('wheat') || i.includes('flour') || i.includes('bread') || i.includes('roti') || i.includes('naan') || i.includes('pasta'));

    // Vegetarian
    const isVeg = !hasMeat;
    labels.push({
      id: 'Vegetarian',
      label: 'Vegetarian 🥦',
      compatible: isVeg,
      reason: isVeg ? 'Contains no meat, poultry, or seafood.' : 'Contains meat, poultry, or seafood products.'
    });

    // Vegan
    const isVegan = !hasMeat && !hasEgg && !hasDairy;
    labels.push({
      id: 'Vegan',
      label: 'Vegan 🌱',
      compatible: isVegan,
      reason: isVegan ? '100% plant-based. No dairy, egg, or animal fats.' : 'Contains dairy, eggs, or meat products.'
    });

    // Gluten-Free
    const isGlutenFree = !hasGluten;
    labels.push({
      id: 'Gluten-Free',
      label: 'Gluten-Free 🌾',
      compatible: isGlutenFree,
      reason: isGlutenFree ? 'Free from wheat-derived gluten proteins.' : 'Contains wheat flour or grain ingredients.'
    });

    // Low Carb
    const isLowCarb = recipeDetail.carbs < 15;
    labels.push({
      id: 'Low-Carb',
      label: 'Low Carb (Keto) 🥑',
      compatible: isLowCarb,
      reason: isLowCarb ? `Keto friendly with only ${recipeDetail.carbs}g of carbs.` : `Contains ${recipeDetail.carbs}g carbohydrates.`
    });

    // High Protein
    const isHighProtein = recipeDetail.protein >= 12;
    labels.push({
      id: 'Healthy',
      label: 'High Protein 💪',
      compatible: isHighProtein,
      reason: isHighProtein ? `Excellent source of protein (${recipeDetail.protein}g) for muscle synthesis.` : `Provides ${recipeDetail.protein}g of protein.`
    });

    return labels;
  };

  const calculateHealthScore = (recipeDetail: RecipeDetail) => {
    let score = 70;
    if (recipeDetail.protein > 15) score += 12;
    else if (recipeDetail.protein > 8) score += 6;

    if (recipeDetail.fiber > 3) score += 12;
    else if (recipeDetail.fiber > 1.5) score += 6;

    if (recipeDetail.calories > 500) score -= 15;
    if (recipeDetail.calories < 200 && recipeDetail.calories > 50) score += 8;

    if (recipeDetail.fat > 22) score -= 10;
    return Math.min(100, Math.max(25, score));
  };

  const healthScore = calculateHealthScore(recipe);
  const dietLabels = getDietLabels(recipe);
  
  // User's current preference compatibility status
  const userPref = user?.dietary_preference || 'None';
  
  // Check if recipe is compatible with user preference
  let isCompatible = true;
  let compReason = '';
  
  if (userPref !== 'None') {
    if (userPref === 'Vegetarian') {
      const match = dietLabels.find(l => l.id === 'Vegetarian');
      isCompatible = match ? match.compatible : true;
      compReason = match ? match.reason : '';
    } else if (userPref === 'Vegan') {
      const match = dietLabels.find(l => l.id === 'Vegan');
      isCompatible = match ? match.compatible : true;
      compReason = match ? match.reason : '';
    } else if (userPref === 'Gluten-Free') {
      const match = dietLabels.find(l => l.id === 'Gluten-Free');
      isCompatible = match ? match.compatible : true;
      compReason = match ? match.reason : '';
    } else if (userPref === 'Healthy') {
      isCompatible = healthScore >= 75;
      compReason = isCompatible 
        ? `This recipe has an outstanding health score of ${healthScore}/100.` 
        : `This recipe has a moderate health score of ${healthScore}/100 due to nutritional composition.`;
    }
  }

  // Filter recommendations: other recipes from the same category or matching pantry ingredients, up to 4 items
  const sidebarRecommendations = allRecipes
    .filter(r => r.recipe_id !== recipe.recipe_id)
    .map(r => {
      // Calculate match percentage for this sidebar recipe
      const matches = r.ingredients.filter(ing => pantryIngredients.includes(ing.name.toLowerCase())).length;
      const pct = r.ingredients.length > 0 ? Math.round((matches / r.ingredients.length) * 100) : 0;
      return { ...r, match_percentage: pct };
    })
    .sort((a, b) => {
      // Prioritize same category, then higher match percentage
      const catA = a.category === recipe.category ? 1 : 0;
      const catB = b.category === recipe.category ? 1 : 0;
      if (catA !== catB) return catB - catA;
      return b.match_percentage - a.match_percentage;
    })
    .slice(0, 4);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto', padding: '1rem 0' }}>
      
      {/* Header Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Link 
          href={`/recommendations?pantry=${encodeURIComponent(pantryParam)}`}
          className="btn btn-secondary" 
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '30px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Recommendations</span>
        </Link>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {matchPercentage > 0 && (
            <div style={{ 
              backgroundColor: matchPercentage === 100 ? 'rgba(6, 214, 160, 0.12)' : 'rgba(255, 90, 54, 0.12)',
              color: matchPercentage === 100 ? 'var(--success)' : 'var(--primary)',
              border: `1px solid ${matchPercentage === 100 ? 'rgba(6, 214, 160, 0.3)' : 'rgba(255, 90, 54, 0.3)'}`,
              borderRadius: '20px',
              padding: '0.4rem 0.9rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <Check size={14} />
              {matchPercentage}% Pantry Match
            </div>
          )}
          <span className="badge badge-primary" style={{ fontSize: '0.75rem', textTransform: 'capitalize', padding: '0.4rem 0.9rem', borderRadius: '20px' }}>
            {recipe.category}
          </span>
        </div>
      </div>

      {/* Hero Split Section (Image & Media Frame) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Left Hero Column: Recipe Poster */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', minHeight: '380px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {recipe.image_url ? (
            <img 
              src={recipe.image_url} 
              alt={recipe.recipe_name} 
              style={{ width: '100%', height: '100%', minHeight: '380px', objectFit: 'cover', flex: 1 }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', minHeight: '380px', background: 'linear-gradient(135deg, var(--bg-surface-elevated) 0%, var(--bg-base) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flex: 1 }}>
              <ChefHat size={80} />
            </div>
          )}
          {/* Glassmorphic title container overlaid at the bottom */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(11, 12, 16, 0.95) 0%, rgba(11, 12, 16, 0.4) 70%, transparent 100%)',
            padding: '2.5rem 2rem 1.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              {recipe.recipe_name}
            </h1>
            
            {/* Quick Specs */}
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>
                <Clock size={16} style={{ color: 'var(--primary)' }} />
                <span>{recipe.cooking_time} mins</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>
                <Award size={16} style={{ color: 'var(--warning)' }} />
                <span style={{ textTransform: 'capitalize' }}>{recipe.difficulty_level}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>
                <Flame size={16} style={{ color: 'var(--secondary)' }} />
                <span>{recipe.calories} kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hero Column: Media Playback or Fast Scheduler */}
        {recipe.video_url ? (
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <span role="img" aria-label="video">🎬</span>
              Video Tutorial Player
            </h3>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--box-shadow-lg)' }}>
              <iframe
                src={recipe.video_url}
                title={`${recipe.recipe_name} Video Tutorial`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <CalendarPlus size={20} style={{ color: 'var(--secondary)' }} />
                Instant Meal Scheduler
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Quickly add this dish to your weekly dashboard planner
              </p>
            </div>

            {plannerSuccess && (
              <div style={{ backgroundColor: 'rgba(6, 214, 160, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
                ✓ Scheduled successfully in your dashboard!
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={plannerDate}
                  onChange={(e) => setPlannerDate(e.target.value)}
                  style={{ background: 'var(--bg-base)' }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Meal Slots</label>
                <select 
                  className="form-control"
                  value={plannerType}
                  onChange={(e) => setPlannerType(e.target.value)}
                  style={{ background: 'var(--bg-base)' }}
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>
              <button 
                className="btn btn-success"
                onClick={handleAddToPlanner}
                disabled={!plannerDate}
                style={{ height: '46px', width: '100%', marginTop: '0.5rem', fontWeight: 700 }}
              >
                Schedule Meal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Split Section: Content & Sidebar Suggestions */}
      <div className="recipe-details-grid" style={{ alignItems: 'start' }}>
        
        {/* Left Column: Interactive Tabs Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Dashboard Tabs Bar */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid var(--border-color)', 
            paddingBottom: '0', 
            overflowX: 'auto', 
            gap: '0.5rem',
            scrollbarWidth: 'none'
          }}>
            <button 
              onClick={() => setActiveTab('nutrition')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'nutrition' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'nutrition' ? '3px solid var(--primary)' : '3px solid transparent',
                padding: '0.85rem 1.25rem',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Heart size={16} /> Overview & Dietetics
            </button>
            <button 
              onClick={() => setActiveTab('ingredients')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'ingredients' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'ingredients' ? '3px solid var(--primary)' : '3px solid transparent',
                padding: '0.85rem 1.25rem',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all var(--transition-fast)'
              }}
            >
              <ChefHat size={16} /> Ingredients Checklist ({ingredientsDetails.length})
            </button>
            <button 
              onClick={() => setActiveTab('instructions')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'instructions' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'instructions' ? '3px solid var(--primary)' : '3px solid transparent',
                padding: '0.85rem 1.25rem',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all var(--transition-fast)'
              }}
            >
              <BookOpen size={16} /> Cooking Mode
            </button>
            {recipe.video_url && (
              <button 
                onClick={() => setActiveTab('schedule')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'schedule' ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'schedule' ? '3px solid var(--primary)' : '3px solid transparent',
                  padding: '0.85rem 1.25rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <CalendarPlus size={16} /> Meal Scheduler
              </button>
            )}
          </div>

          {/* Active Tab Panel Rendering */}
          <div className="card" style={{ padding: '2rem', minHeight: '300px' }}>
            
            {/* TAB 1: OVERVIEW & DIETETICS */}
            {activeTab === 'nutrition' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                
                {/* Header Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Nutritional Analysis
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                      💡 Values shown are <strong>per serving</strong> (approx. 250g - 300g portion). Complete recipe makes <strong>2-3 servings</strong>.
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Health Score:</span>
                    <div style={{
                      background: healthScore >= 80 ? 'rgba(6, 214, 160, 0.12)' : healthScore >= 60 ? 'rgba(255, 179, 0, 0.12)' : 'rgba(255, 90, 54, 0.12)',
                      color: healthScore >= 80 ? 'var(--success)' : healthScore >= 60 ? 'var(--warning)' : 'var(--primary)',
                      border: `1px solid ${healthScore >= 80 ? 'rgba(6, 214, 160, 0.3)' : healthScore >= 60 ? 'rgba(255, 179, 0, 0.3)' : 'rgba(255, 90, 54, 0.3)'}`,
                      borderRadius: '30px',
                      padding: '0.35rem 0.85rem',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Sparkles size={14} />
                      {healthScore}/100
                    </div>
                  </div>
                </div>

                {/* Active Diet Compatibility Alert */}
                {userPref !== 'None' && (
                  <div style={{
                    background: isCompatible ? 'rgba(6, 214, 160, 0.08)' : 'rgba(255, 90, 54, 0.08)',
                    border: `1px solid ${isCompatible ? 'rgba(6, 214, 160, 0.2)' : 'rgba(255, 90, 54, 0.2)'}`,
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '0.75rem',
                  }}>
                    {isCompatible ? (
                      <Check size={20} style={{ color: 'var(--success)', marginTop: '0.1rem', flexShrink: 0 }} />
                    ) : (
                      <AlertCircle size={20} style={{ color: 'var(--primary)', marginTop: '0.1rem', flexShrink: 0 }} />
                    )}
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: 700, color: isCompatible ? 'var(--success)' : 'var(--primary)' }}>
                        {isCompatible ? 'Preferred Choice for You' : 'Dietary Preference Conflict'}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        Your diet profile is set to <strong>{userPref}</strong>. {compReason || (isCompatible ? `This recipe fully matches your dietary goals.` : `This recipe may not be suitable for your preference.`)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Macros Grid */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Macronutrient Breakdown
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
                    {/* Protein */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Protein</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--success)' }}>{recipe.protein}g</strong>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--success)', width: `${Math.min(100, (recipe.protein / 50) * 100)}%` }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {Math.round((recipe.protein / 50) * 100)}% of Daily Value (50g)
                      </span>
                    </div>

                    {/* Carbs */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Carbohydrates</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--secondary)' }}>{recipe.carbs}g</strong>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--secondary)', width: `${Math.min(100, (recipe.carbs / 275) * 100)}%` }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {Math.round((recipe.carbs / 275) * 100)}% of Daily Value (275g)
                      </span>
                    </div>

                    {/* Fat */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Fat</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>{recipe.fat}g</strong>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--primary)', width: `${Math.min(100, (recipe.fat / 78) * 100)}%` }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {Math.round((recipe.fat / 78) * 100)}% of Daily Value (78g)
                      </span>
                    </div>

                    {/* Fiber */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Dietary Fiber</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--warning)' }}>{recipe.fiber}g</strong>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--warning)', width: `${Math.min(100, (recipe.fiber / 28) * 100)}%` }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {Math.round((recipe.fiber / 28) * 100)}% of Daily Value (28g)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dietary Certifications */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Dietary Compatibility
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {dietLabels.map(label => (
                      <div
                        key={label.label}
                        title={label.reason}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '20px',
                          cursor: 'help',
                          border: '1px solid var(--border-color)',
                          background: label.compatible ? 'rgba(6, 214, 160, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                          color: label.compatible ? 'var(--success)' : 'var(--text-muted)',
                          textDecoration: label.compatible ? 'none' : 'line-through'
                        }}
                      >
                        {label.compatible ? <Check size={12} style={{ color: 'var(--success)' }} /> : <span>✕</span>}
                        <span>{label.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Micronutrients / Vitamins details */}
                {recipe.vitamins && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Info size={14} style={{ color: 'var(--secondary)' }} />
                      Vitamins & Minerals
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      This meal is rich in: <strong style={{ color: 'var(--text-primary)' }}>{recipe.vitamins}</strong>. These support cell regeneration and optimize immune response.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: INGREDIENTS CHECKLIST */}
            {activeTab === 'ingredients' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Ingredients Checklist
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                    Checklist generated against items available in your pantry. Items highlighted in green are fully matched.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                  {ingredientsDetails.map((ing, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1.1rem',
                        backgroundColor: ing.matched ? 'rgba(6, 214, 160, 0.05)' : 'rgba(255, 90, 54, 0.02)',
                        border: `1px solid ${ing.matched ? 'rgba(6, 214, 160, 0.2)' : 'rgba(255, 90, 54, 0.15)'}`,
                        borderRadius: '10px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <span style={{ fontWeight: ing.matched ? 600 : 500, color: ing.matched ? 'var(--success)' : 'var(--text-primary)' }}>
                        {ing.name}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: ing.matched ? 'var(--success)' : 'var(--primary)' }}>
                        {ing.quantity} ({ing.matched ? '✓ Got It' : '⚠ Missing'})
                      </span>
                    </div>
                  ))}
                </div>

                {/* Sync Missing Ingredients to Grocery List */}
                {ingredientsDetails.some(i => !i.matched) && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className={`btn ${grocerySuccess ? 'btn-success' : 'btn-primary'}`}
                      disabled={addingGrocery || grocerySuccess}
                      onClick={() => handleAddMissingToGrocery(ingredientsDetails.filter(i => !i.matched))}
                      style={{
                        padding: '0.7rem 1.5rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        borderRadius: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      {addingGrocery ? (
                        <span>Adding to Grocery List...</span>
                      ) : grocerySuccess ? (
                        <>
                          <Check size={16} />
                          <span>Added to Grocery List!</span>
                        </>
                      ) : (
                        <>
                          <CalendarPlus size={16} />
                          <span>Add Missing Ingredients to Grocery List</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: STEP-BY-STEP COOKING MODE */}
            {activeTab === 'instructions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Interactive Cooking Steps
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                      Mark off steps as you complete them to track your progress.
                    </p>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setCompletedSteps({})} 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '20px' }}
                  >
                    Reset Progress
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {recipe.instructions.split(/\r?\n/).map(s => s.trim()).filter(s => s !== '').map((step, idx) => {
                    const isCompleted = completedSteps[idx] || false;
                    const isCurrent = idx === 0 || completedSteps[idx - 1];
                    return (
                      <div 
                        key={idx}
                        onClick={() => setCompletedSteps(prev => ({ ...prev, [idx]: !isCompleted }))}
                        style={{
                          display: 'flex',
                          alignItems: 'start',
                          gap: '1rem',
                          padding: '1.25rem',
                          background: isCompleted ? 'rgba(255, 255, 255, 0.01)' : isCurrent ? 'rgba(255, 90, 54, 0.03)' : 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${isCompleted ? 'var(--border-color)' : isCurrent ? 'rgba(255, 90, 54, 0.25)' : 'var(--border-color)'}`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          opacity: isCompleted ? 0.6 : 1,
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: isCompleted ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: '0.95rem',
                          lineHeight: 1.6,
                          color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: isCompleted ? 'line-through' : 'none'
                        }}>
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: PLANNER SCHEDULER (Only displayed if hero didn't embed it) */}
            {activeTab === 'schedule' && recipe.video_url && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Meal Planner Scheduler
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                    Schedule this dish to structure your weekly dietary schedule.
                  </p>
                </div>

                {plannerSuccess && (
                  <div style={{ backgroundColor: 'rgba(6, 214, 160, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
                    ✓ Scheduled successfully in your dashboard!
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0, flex: '2 1 200px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={plannerDate}
                      onChange={(e) => setPlannerDate(e.target.value)}
                      style={{ background: 'var(--bg-base)' }}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, flex: '1 1 140px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Meal Slots</label>
                    <select 
                      className="form-control"
                      value={plannerType}
                      onChange={(e) => setPlannerType(e.target.value)}
                      style={{ background: 'var(--bg-base)' }}
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack">Snack</option>
                    </select>
                  </div>
                  <button 
                    className="btn btn-success"
                    onClick={handleAddToPlanner}
                    disabled={!plannerDate}
                    style={{ flex: '1 0 auto', alignSelf: 'flex-end', height: '46px', fontWeight: 700 }}
                  >
                    Schedule Meal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recommendations Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', margin: 0 }}>
              <Sparkles size={16} style={{ color: 'var(--primary)' }} />
              Other Recommendations
            </h3>
            
            {sidebarRecommendations.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                No other matching recipes available.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sidebarRecommendations.map((sideRecipe, idx) => {
                  const isLast = idx === sidebarRecommendations.length - 1;
                  return (
                    <div 
                      key={sideRecipe.recipe_id}
                      style={{ 
                        display: 'flex', 
                        gap: '0.75rem', 
                        paddingBottom: isLast ? '0' : '1rem', 
                        borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      {sideRecipe.image_url ? (
                        <img 
                          src={sideRecipe.image_url} 
                          alt={sideRecipe.recipe_name} 
                          style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div style={{ width: '70px', height: '70px', background: 'var(--bg-surface-elevated)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                          <ChefHat size={20} />
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                          {sideRecipe.category}
                        </span>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                          {sideRecipe.recipe_name}
                        </h4>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>{sideRecipe.cooking_time}m</span>
                          <span>•</span>
                          <span>{sideRecipe.match_percentage}% Match</span>
                        </div>
                        
                        <Link 
                          href={`/recipes/${sideRecipe.recipe_id}?pantry=${encodeURIComponent(pantryParam)}`}
                          style={{ fontSize: '0.8rem', color: 'var(--secondary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}
                        >
                          <BookOpen size={12} />
                          <span>View Detail</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
