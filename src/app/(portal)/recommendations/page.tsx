'use client';

import React, { useState } from 'react';
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
  BookOpen
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
  const [selectedRecipe, setSelectedRecipe] = useState<RecommendedRecipe | null>(null);
  const [plannerDate, setPlannerDate] = useState('');
  const [plannerType, setPlannerType] = useState('Lunch');
  const [plannerSuccess, setPlannerSuccess] = useState(false);

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

  const handleAddToPlanner = async (recipeId: number) => {
    if (!user || !plannerDate) return;
    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          recipe_id: recipeId,
          meal_type: plannerType,
          meal_date: plannerDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlannerSuccess(true);
        setTimeout(() => {
          setPlannerSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Error adding to planner:', err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>What to Cook?</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Enter the ingredients available at home, and see recipe matches sorted by similarity.
        </p>
      </div>

      {/* Ingredient Inputs Card */}
      <div className="card card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} style={{ color: 'var(--primary)' }} />
          Select Your Ingredients
        </h3>

        {/* Custom Input */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Type an ingredient (e.g. Potato, Tofu)..."
            value={customIngredient}
            onChange={(e) => setCustomIngredient(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient(customIngredient)}
            style={{ flex: 1 }}
          />
          <button 
            className="btn btn-primary"
            onClick={() => handleAddIngredient(customIngredient)}
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
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>
              Ingredients In Your Pantry ({selectedIngredients.length}):
            </span>
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

        {/* Action Button */}
        <button
          className="btn btn-primary"
          style={{ alignSelf: 'start', padding: '0.9rem 2rem' }}
          disabled={selectedIngredients.length === 0 || loading}
          onClick={handleGetRecommendations}
        >
          <ChefHat size={18} />
          {loading ? 'Analyzing recipes...' : 'Find Matches!'}
        </button>
      </div>

      {/* Recommendations Output Grid */}
      {recommendations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ListChecks size={20} style={{ color: 'var(--success)' }} />
            Suggested Recipes ({recommendations.length})
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {recommendations.map(recipe => (
              <div 
                key={recipe.recipe_id} 
                className="card card-primary-indicator" 
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}
              >
                {/* Match Percentage Ring */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="badge badge-secondary" style={{ alignSelf: 'start', marginBottom: '0.4rem', fontSize: '0.65rem' }}>
                      {recipe.category}
                    </span>
                    <h3 style={{ fontSize: '1.2rem' }}>{recipe.recipe_name}</h3>
                  </div>
                  <div style={{ 
                    backgroundColor: recipe.match_percentage === 100 ? 'rgba(6, 214, 160, 0.15)' : 'rgba(0, 180, 216, 0.12)',
                    color: recipe.match_percentage === 100 ? 'var(--success)' : 'var(--secondary)',
                    borderRadius: '8px',
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    {recipe.match_percentage}% Match
                  </div>
                </div>

                {/* Substats */}
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} />
                    <span>{recipe.cooking_time} mins</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Flame size={14} />
                    <span>{recipe.calories} kcal</span>
                  </div>
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                    {recipe.difficulty_level}
                  </span>
                </div>

                {/* Ingredients summary */}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                  <strong>Ingredients matched:</strong> {recipe.matched_ingredients_count} of {recipe.total_ingredients_needed}
                </div>

                {/* Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginTop: 'auto' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    <BookOpen size={16} />
                    <span>View Recipe</span>
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <Bookmark size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal details */}
      {selectedRecipe && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card card-glass animate-fade-in" style={{
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                  {selectedRecipe.category}
                </span>
                <h2 style={{ fontSize: '1.6rem' }}>{selectedRecipe.recipe_name}</h2>
              </div>
              <button 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                onClick={() => setSelectedRecipe(null)}
              >
                <X size={24} />
              </button>
            </div>

            {/* Substats */}
            <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <div>Cooking Time: <strong>{selectedRecipe.cooking_time} mins</strong></div>
              <div>Difficulty: <strong>{selectedRecipe.difficulty_level}</strong></div>
              <div>Calories: <strong>{selectedRecipe.calories} kcal</strong></div>
            </div>

            {/* Ingredients Check */}
            <div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Ingredients Status:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
                {selectedRecipe.ingredients_details.map((ing, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.8rem',
                      backgroundColor: ing.matched ? 'rgba(6, 214, 160, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${ing.matched ? 'rgba(6, 214, 160, 0.2)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span style={{ fontWeight: ing.matched ? 600 : 400, color: ing.matched ? 'var(--success)' : 'var(--text-secondary)' }}>
                      {ing.name}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {ing.quantity} ({ing.matched ? 'In Pantry' : 'To Buy'})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Instructions:</h4>
              <div style={{ 
                backgroundColor: 'var(--bg-surface-elevated)', 
                border: '1px solid var(--border-color)', 
                padding: '1.25rem', 
                borderRadius: 'var(--border-radius-md)',
                fontSize: '0.925rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-line'
              }}>
                {selectedRecipe.instructions}
              </div>
            </div>

            {/* Schedule Section */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CalendarPlus size={16} style={{ color: 'var(--secondary)' }} />
                Add to Weekly Planner
              </h4>

              {plannerSuccess && (
                <div style={{
                  backgroundColor: 'rgba(6, 214, 160, 0.1)',
                  border: '1px solid var(--success)',
                  color: 'var(--success)',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Added to Meal Planner successfully!
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0, flex: '2 1 180px' }}>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={plannerDate}
                    onChange={(e) => setPlannerDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: '1 1 120px' }}>
                  <select 
                    className="form-control"
                    value={plannerType}
                    onChange={(e) => setPlannerType(e.target.value)}
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>
                <button 
                  className="btn btn-success"
                  onClick={() => handleAddToPlanner(selectedRecipe.recipe_id)}
                  disabled={!plannerDate}
                  style={{ flex: '1 0 auto' }}
                >
                  Confirm Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
