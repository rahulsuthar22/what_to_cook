'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  ChefHat, 
  Plus, 
  X, 
  Clock, 
  Flame, 
  ListChecks, 
  Sparkles,
  Bookmark,
  CalendarPlus,
  BookOpen,
  Search
} from 'lucide-react';

interface IngredientDetail {
  name: string;
  quantity: string;
  matched: boolean;
}

interface RecommendedRecipe {
  recipe_id: number;
  recipe_name: string;
  category: string;
  cooking_time: number;
  difficulty_level: string;
  image_url?: string;
  calories: number;
  instructions: string;
  total_ingredients_needed: number;
  matched_ingredients_count: number;
  match_percentage: number;
  ingredients_details: IngredientDetail[];
}

const COMMON_INGREDIENTS = [
  'Paneer', 'Tomato', 'Butter', 'Onion', 'Garlic', 
  'Ginger', 'Potato', 'Rice', 'Spinach', 'Egg', 
  'Chicken', 'Carrot', 'Peas', 'Cheese', 'Milk'
];

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [recommendations, setRecommendations] = useState<RecommendedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [allRecipes, setAllRecipes] = useState<any[]>([]);
  const [fetchingRecipes, setFetchingRecipes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Smart Context States
  const [timeOfDay, setTimeOfDay] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Late Snack'>('Lunch');
  const [currentMood, setCurrentMood] = useState<'Comfort' | 'Healthy' | 'Lazy' | 'Fancy' | 'Sweet'>('Lazy');
  const [currentWeather, setCurrentWeather] = useState<'Sunny' | 'Rainy' | 'Chilly'>('Sunny');

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 11) {
      setTimeOfDay('Breakfast');
    } else if (hours >= 11 && hours < 16) {
      setTimeOfDay('Lunch');
    } else if (hours >= 16 && hours < 22) {
      setTimeOfDay('Dinner');
    } else {
      setTimeOfDay('Late Snack');
    }

    const month = new Date().getMonth();
    if (month >= 5 && month <= 8) {
      setCurrentWeather('Rainy');
    } else if (month >= 10 || month <= 1) {
      setCurrentWeather('Chilly');
    } else {
      setCurrentWeather('Sunny');
    }
  }, []);

  const searchParams = useSearchParams();

  // Parse pantry query parameters on mount to restore user selections when coming back from detail page
  useEffect(() => {
    const pantryParam = searchParams.get('pantry');
    if (pantryParam) {
      const items = pantryParam.split(',').filter(Boolean);
      setSelectedIngredients(items);
      
      if (items.length > 0) {
        const triggerRecs = async () => {
          setLoading(true);
          try {
            const res = await fetch('/api/recipes/recommend', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ingredients: items }),
            });
            const data = await res.json();
            if (data.success) {
              setRecommendations(data.recommendations);
            }
          } catch (err) {
            console.error('Error fetching recommendations from query param:', err);
          } finally {
            setLoading(false);
          }
        };
        triggerRecs();
      }
    }
  }, [searchParams]);

  // Fetch all recipes on mount
  useEffect(() => {
    const fetchAllRecipes = async () => {
      setFetchingRecipes(true);
      try {
        const res = await fetch('/api/recipes');
        const data = await res.json();
        if (data.success) {
          setAllRecipes(data.recipes);
        }
      } catch (err) {
        console.error('Error fetching all recipes:', err);
      } finally {
        setFetchingRecipes(false);
      }
    };
    fetchAllRecipes();
  }, []);

  const handleAddIngredient = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    if (!selectedIngredients.map(i => i.toLowerCase()).includes(cleanName.toLowerCase())) {
      setSelectedIngredients([...selectedIngredients, cleanName]);
    }
    setCustomIngredient('');
  };

  const handleRemoveIngredient = (name: string) => {
    setSelectedIngredients(selectedIngredients.filter(i => i !== name));
  };

  const handleClearFilters = () => {
    setSelectedIngredients([]);
    setRecommendations([]);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('pantry');
      window.history.replaceState(null, '', url.pathname);
    }
  };

  const handleGetRecommendations = async () => {
    if (selectedIngredients.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/recipes/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: selectedIngredients }),
      });
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };



  // Convert standard recipe format to RecommendedRecipe structure on-the-fly
  const getRecommendedFormat = (recipe: any): RecommendedRecipe => {
    const ingredients_details = recipe.ingredients.map((ing: any) => {
      const matched = selectedIngredients.map(i => i.toLowerCase()).includes(ing.name.toLowerCase());
      return {
        name: ing.name,
        quantity: ing.quantity,
        matched,
      };
    });

    const total_ingredients_needed = ingredients_details.length;
    const matched_ingredients_count = ingredients_details.filter((i: any) => i.matched).length;
    const match_percentage = total_ingredients_needed > 0 
      ? Math.round((matched_ingredients_count / total_ingredients_needed) * 100)
      : 0;

    return {
      recipe_id: recipe.recipe_id,
      recipe_name: recipe.recipe_name,
      category: recipe.category,
      cooking_time: recipe.cooking_time,
      difficulty_level: recipe.difficulty_level,
      image_url: recipe.image_url,
      calories: recipe.calories,
      instructions: recipe.instructions,
      total_ingredients_needed,
      matched_ingredients_count,
      match_percentage,
      ingredients_details,
    };
  };

  // Filter explore recipes
  const categories = ['All', ...Array.from(new Set(allRecipes.map(r => r.category)))];

  const getSmartPicks = () => {
    if (allRecipes.length === 0) return [];
    
    return allRecipes
      .map(recipe => {
        let score = 0;
        
        // Time of Day match
        const cat = recipe.category.toLowerCase();
        if (timeOfDay === 'Breakfast' && cat === 'breakfast') score += 3;
        if (timeOfDay === 'Lunch' && (cat === 'lunch' || cat === 'main course' || cat === 'curry' || cat === 'rice' || cat === 'salad')) score += 3;
        if (timeOfDay === 'Dinner' && (cat === 'dinner' || cat === 'main course' || cat === 'curry' || cat === 'pasta')) score += 3;
        if (timeOfDay === 'Late Snack' && (cat === 'snack' || cat === 'dessert')) score += 3;

        // Weather match
        if (currentWeather === 'Chilly') {
          if (cat === 'soup' || cat === 'curry' || recipe.cooking_time > 25) score += 2;
        } else if (currentWeather === 'Rainy') {
          if (cat === 'snack' || recipe.recipe_name.toLowerCase().includes('tea') || recipe.recipe_name.toLowerCase().includes('fry') || recipe.recipe_name.toLowerCase().includes('pakoda') || recipe.recipe_name.toLowerCase().includes('samosa')) score += 2;
        } else if (currentWeather === 'Sunny') {
          if (cat === 'salad' || cat === 'dessert' || recipe.calories < 450) score += 2;
        }

        // Mood match
        if (currentMood === 'Lazy') {
          if (recipe.cooking_time <= 20) score += 3;
          if (recipe.difficulty_level.toLowerCase() === 'easy') score += 1;
        } else if (currentMood === 'Healthy') {
          if (recipe.calories < 400 || cat === 'salad') score += 3;
        } else if (currentMood === 'Comfort') {
          if (cat === 'curry' || cat === 'pasta' || recipe.calories > 500) score += 3;
        } else if (currentMood === 'Fancy') {
          if (recipe.difficulty_level.toLowerCase() === 'hard' || recipe.difficulty_level.toLowerCase() === 'medium') score += 2;
          if (recipe.cooking_time > 30) score += 1;
        } else if (currentMood === 'Sweet') {
          if (cat === 'dessert' || recipe.recipe_name.toLowerCase().includes('sweet') || recipe.recipe_name.toLowerCase().includes('cake') || recipe.recipe_name.toLowerCase().includes('pudding') || recipe.recipe_name.toLowerCase().includes('halwa')) score += 4;
        }

        return { ...recipe, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };
  const filteredRecipes = allRecipes.filter(r => {
    const matchesSearch = r.recipe_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.ingredients.some((ing: any) => ing.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>What to Cook?</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Enter the ingredients available at home, and see recipe matches sorted by similarity.
        </p>
      </div>

      {/* Smart Suggestions Card */}
      <div className="card card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem', background: 'linear-gradient(135deg, rgba(255, 90, 54, 0.05) 0%, rgba(7, 8, 16, 0.2) 100%)', border: '1px solid rgba(255, 90, 54, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Sparkles size={20} style={{ color: 'var(--primary)' }} />
              Today's Smart Picks
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              We've tailored these suggestions for a {new Date().toLocaleDateString('en-US', { weekday: 'long' })} {timeOfDay.toLowerCase()} and {currentWeather.toLowerCase()} weather.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '15px', padding: '0.25rem 0.6rem', color: 'var(--text-muted)' }}>
              ⏰ {timeOfDay}
            </span>
          </div>
        </div>

        {/* Dynamic Filters panel */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
          {/* Mood Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>What is your current mood?</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {[
                { id: 'Lazy', label: 'Fast & Lazy ⚡' },
                { id: 'Healthy', label: 'Healthy & Fit 🥗' },
                { id: 'Comfort', label: 'Comfort Food 🍔' },
                { id: 'Fancy', label: 'Gourmet Feast 🍳' },
                { id: 'Sweet', label: 'Sweet Craving 🍰' }
              ].map(mood => (
                <button
                  key={mood.id}
                  onClick={() => setCurrentMood(mood.id as any)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    border: '1px solid',
                    borderColor: currentMood === mood.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: currentMood === mood.id ? 'rgba(255, 90, 54, 0.12)' : 'transparent',
                    color: currentMood === mood.id ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    fontWeight: currentMood === mood.id ? 700 : 400
                  }}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weather Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>How is the weather?</span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[
                { id: 'Sunny', label: 'Sunny ☀️' },
                { id: 'Rainy', label: 'Rainy 🌧️' },
                { id: 'Chilly', label: 'Chilly ❄️' }
              ].map(weather => (
                <button
                  key={weather.id}
                  onClick={() => setCurrentWeather(weather.id as any)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    border: '1px solid',
                    borderColor: currentWeather === weather.id ? 'var(--secondary)' : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: currentWeather === weather.id ? 'rgba(255, 90, 54, 0.08)' : 'transparent',
                    color: currentWeather === weather.id ? 'var(--secondary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    fontWeight: currentWeather === weather.id ? 700 : 400
                  }}
                >
                  {weather.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Suggestion list */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '0.25rem' }}>
          {getSmartPicks().map(recipe => (
            <div 
              key={recipe.recipe_id}
              className="card"
              style={{
                padding: '1rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                transition: 'var(--transition-fast)'
              }}
            >
              {recipe.image_url ? (
                <img 
                  src={recipe.image_url} 
                  alt={recipe.recipe_name} 
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div style={{ width: '80px', height: '80px', background: 'var(--bg-surface-elevated)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                  <ChefHat size={24} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {recipe.category}
                </span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                  {recipe.recipe_name}
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>⏱️ {recipe.cooking_time}m</span>
                  <span>•</span>
                  <span>🔥 {recipe.calories} kcal</span>
                </div>
                
                <Link 
                  href={`/recipes/${recipe.recipe_id}?pantry=${encodeURIComponent(selectedIngredients.join(','))}`}
                  style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--secondary)', 
                    textDecoration: 'none', 
                    fontWeight: 700, 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.2rem', 
                    marginTop: '0.4rem' 
                  }}
                >
                  <BookOpen size={12} />
                  <span>View Details</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ingredient Inputs Card */}
      <div className="card card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} style={{ color: 'var(--primary)' }} />
          Select Your Ingredients
        </h3>

        {/* Custom Input */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Type an ingredient (e.g. Potato, Tofu)..."
            value={customIngredient}
            onChange={(e) => setCustomIngredient(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient(customIngredient)}
            style={{ flex: '1 1 200px', minWidth: '0' }}
          />
          <button 
            className="btn btn-primary"
            onClick={() => handleAddIngredient(customIngredient)}
            style={{ flex: '1 0 auto' }}
          >
            <Plus size={18} />
            <span>Add</span>
          </button>
        </div>

        {/* Common Quick Pills */}
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>
            Common Ingredients (Click to add):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {COMMON_INGREDIENTS.map(ing => {
              const isSelected = selectedIngredients.map(i => i.toLowerCase()).includes(ing.toLowerCase());
              return (
                <button
                  key={ing}
                  onClick={() => isSelected ? handleRemoveIngredient(ing) : handleAddIngredient(ing)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {ing}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Pills */}
        {selectedIngredients.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Ingredients In Your Pantry ({selectedIngredients.length}):
              </span>
              <button
                onClick={handleClearFilters}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--error)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: 0
                }}
              >
                <X size={14} />
                <span>Clear All</span>
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selectedIngredients.map(ing => (
                <span
                  key={ing}
                  className="badge badge-primary"
                  style={{ 
                    fontSize: '0.85rem', 
                    padding: '0.4rem 0.8rem', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.4rem',
                    background: 'rgba(255, 90, 54, 0.15)',
                    border: '1px solid rgba(255, 90, 54, 0.3)'
                  }}
                >
                  {ing}
                  <X 
                    size={14} 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => handleRemoveIngredient(ing)} 
                  />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '0.9rem 2rem' }}
            disabled={selectedIngredients.length === 0 || loading}
            onClick={handleGetRecommendations}
          >
            <ChefHat size={18} />
            {loading ? 'Analyzing recipes...' : 'Find Matches!'}
          </button>
          
          {selectedIngredients.length > 0 && (
            <button
              className="btn btn-secondary"
              style={{ padding: '0.9rem 1.5rem', borderColor: 'rgba(239, 71, 111, 0.4)', color: 'var(--error)' }}
              onClick={handleClearFilters}
            >
              <X size={16} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Recommendations Output Grid */}
      {recommendations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ListChecks size={20} style={{ color: 'var(--success)' }} />
            Suggested Recipes ({recommendations.length})
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {recommendations.map(recipe => (
              <div 
                key={recipe.recipe_id} 
                className="card card-primary-indicator" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.85rem', 
                  padding: '1rem',
                  width: '100%',
                  borderRadius: 'var(--border-radius-md)'
                }}
              >
                {/* Image Container with Badges */}
                <div style={{ position: 'relative', width: '100%', height: '170px', borderRadius: '10px', overflow: 'hidden' }}>
                  {recipe.image_url ? (
                    <img 
                      src={recipe.image_url} 
                      alt={recipe.recipe_name} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover'
                      }} 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      background: 'linear-gradient(135deg, var(--bg-surface-elevated) 0%, var(--bg-base) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)'
                    }}>
                      <ChefHat size={32} />
                    </div>
                  )}

                  {/* Category Pill */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    <span className="badge badge-secondary" style={{ fontSize: '0.65rem', background: 'rgba(23, 25, 35, 0.85)', backdropFilter: 'blur(4px)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', textTransform: 'capitalize' }}>
                      {recipe.category}
                    </span>
                  </div>

                  {/* Match Percentage Pill */}
                  <div style={{ 
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: recipe.match_percentage === 100 ? 'var(--success)' : 'var(--primary)',
                    color: '#fff',
                    borderRadius: '20px',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                  }}>
                    {recipe.match_percentage}% Match
                  </div>
                </div>

                {/* Details Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3, color: 'var(--text-primary)' }}>
                    {recipe.recipe_name}
                  </h3>

                  {/* Substats */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={13} style={{ color: 'var(--primary)' }} />
                      <span>{recipe.cooking_time}m</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Flame size={13} style={{ color: 'var(--secondary)' }} />
                      <span>{recipe.calories} kcal</span>
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', textTransform: 'capitalize' }}>
                      {recipe.difficulty_level}
                    </span>
                  </div>

                  {/* Ingredients summary */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Matched: <strong style={{ color: 'var(--success)' }}>{recipe.matched_ingredients_count}</strong> of {recipe.total_ingredients_needed}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <Link 
                    href={`/recipes/${recipe.recipe_id}?pantry=${encodeURIComponent(selectedIngredients.join(','))}`}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem', height: '36px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <BookOpen size={14} />
                    <span>View Recipe</span>
                  </Link>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bookmark size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explore All Recipes Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} style={{ color: 'var(--primary)' }} />
            Explore All Recipes ({filteredRecipes.length})
          </h2>
          
          {/* Search bar */}
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search recipes or ingredients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.8rem', paddingRight: '1rem', width: '100%', paddingTop: '0.65rem', paddingBottom: '0.65rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: selectedCategory === cat ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                  color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {fetchingRecipes ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Loading recipes...
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {filteredRecipes.map(recipe => {
              const formattedRecipe = getRecommendedFormat(recipe);
              return (
                <div 
                  key={formattedRecipe.recipe_id} 
                  className="card card-primary-indicator" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.85rem', 
                    padding: '1rem',
                    width: '100%',
                    borderRadius: 'var(--border-radius-md)'
                  }}
                >
                  {/* Image Container with Badges */}
                  <div style={{ position: 'relative', width: '100%', height: '170px', borderRadius: '10px', overflow: 'hidden' }}>
                    {formattedRecipe.image_url ? (
                      <img 
                        src={formattedRecipe.image_url} 
                        alt={formattedRecipe.recipe_name} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover'
                        }} 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        background: 'linear-gradient(135deg, var(--bg-surface-elevated) 0%, var(--bg-base) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)'
                      }}>
                        <ChefHat size={32} />
                      </div>
                    )}

                    {/* Category Pill */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                      <span className="badge badge-secondary" style={{ fontSize: '0.65rem', background: 'rgba(23, 25, 35, 0.85)', backdropFilter: 'blur(4px)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', textTransform: 'capitalize' }}>
                        {formattedRecipe.category}
                      </span>
                    </div>

                    {/* Match Percentage Pill */}
                    {formattedRecipe.match_percentage > 0 && (
                      <div style={{ 
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: formattedRecipe.match_percentage === 100 ? 'var(--success)' : 'var(--primary)',
                        color: '#fff',
                        borderRadius: '20px',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                      }}>
                        {formattedRecipe.match_percentage}% Match
                      </div>
                    )}
                  </div>

                  {/* Details Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flexGrow: 1 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3, color: 'var(--text-primary)' }}>
                      {formattedRecipe.recipe_name}
                    </h3>

                    {/* Substats */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2' }}>
                        <Clock size={13} style={{ color: 'var(--primary)' }} />
                        <span>{formattedRecipe.cooking_time}m</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2m' }}>
                        <Flame size={13} style={{ color: 'var(--secondary)' }} />
                        <span>{formattedRecipe.calories} kcal</span>
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', textTransform: 'capitalize' }}>
                        {formattedRecipe.difficulty_level}
                      </span>
                    </div>

                    {/* Ingredients summary */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Ingredients: <strong style={{ color: 'var(--text-primary)' }}>{formattedRecipe.total_ingredients_needed}</strong> total
                      {formattedRecipe.matched_ingredients_count > 0 && (
                        <> (<strong style={{ color: 'var(--success)' }}>{formattedRecipe.matched_ingredients_count} matched</strong>)</>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <Link 
                      href={`/recipes/${formattedRecipe.recipe_id}?pantry=${encodeURIComponent(selectedIngredients.join(','))}`}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem', height: '36px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      <BookOpen size={14} />
                      <span>View Recipe</span>
                    </Link>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bookmark size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius-lg)' }}>
            No recipes match your search filters.
          </div>
        )}
      </div>

    </div>
  );
}
