'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  ChefHat, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Activity,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

interface StatsSummary {
  totalUsers: number;
  totalRecipes: number;
  totalMealPlans: number;
  totalAdmins: number;
}

interface PopularRecipe {
  recipe_id: number;
  recipe_name: string;
  category: string;
  plan_count: string;
}

interface PopularIngredient {
  ingredient_name: string;
  category: string;
  recipe_count: string;
}

interface RecentUser {
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface AdminStats {
  summary: StatsSummary;
  popularRecipes: PopularRecipe[];
  popularIngredients: PopularIngredient[];
  recentUsers: RecentUser[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Recipe Creation Form State
  const [recipeName, setRecipeName] = useState('');
  const [category, setCategory] = useState('Indian');
  const [cookingTime, setCookingTime] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [calories, setCalories] = useState('');
  const [instructions, setInstructions] = useState('');
  const [ingredientsRaw, setIngredientsRaw] = useState(''); // E.g., Paneer:200g, Butter:1 tbsp
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(false);
    setSubmitError('');

    if (!recipeName || !instructions) {
      setSubmitError('Recipe Name and Instructions are required.');
      return;
    }

    // Parse raw ingredients field into array
    // E.g., "Paneer:200g, Tomato:3 medium" -> [{ name: 'Paneer', quantity: '200g' }]
    const ingredientsParsed = ingredientsRaw
      .split(',')
      .map(part => {
        const index = part.indexOf(':');
        if (index === -1) {
          const name = part.trim();
          return name ? { name, quantity: 'as needed' } : null;
        }
        const name = part.substring(0, index).trim();
        const quantity = part.substring(index + 1).trim();
        return name ? { name, quantity } : null;
      })
      .filter((item): item is { name: string; quantity: string } => item !== null);

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_name: recipeName,
          category,
          cooking_time: cookingTime,
          difficulty_level: difficulty,
          calories,
          instructions,
          ingredients: ingredientsParsed,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(true);
        // Reset form
        setRecipeName('');
        setCookingTime('');
        setCalories('');
        setInstructions('');
        setIngredientsRaw('');
        // Sync stats
        fetchStats();
      } else {
        setSubmitError(data.error || 'Failed to submit recipe.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldAlert size={28} style={{ color: 'var(--primary)' }} />
          Admin Control Center
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Monitor system metrics, review reports, and manage recipes.
        </p>
      </div>

      {/* Stats Summary Row */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
          Loading stats summary...
        </div>
      ) : stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255, 90, 54, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Users size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Users</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.summary.totalUsers}</h2>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(0, 180, 216, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
              <ChefHat size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Recipes DB</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.summary.totalRecipes}</h2>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(6, 214, 160, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <Calendar size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Planned Meals</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.summary.totalMealPlans}</h2>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255, 209, 102, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Staff Admins</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.summary.totalAdmins}</h2>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Grid split */}
      <div className="admin-main-grid" style={{ alignItems: 'start' }}>
        
        {/* Form: Add New Recipe */}
        <div className="card">
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} style={{ color: 'var(--primary)' }} />
            Add New Recipe
          </h2>

          {submitSuccess && (
            <div style={{
              backgroundColor: 'rgba(6, 214, 160, 0.1)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              padding: '0.8rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              Recipe uploaded and integrated into recommendation engine successfully!
            </div>
          )}

          {submitError && (
            <div style={{
              backgroundColor: 'rgba(239, 71, 111, 0.1)',
              border: '1px solid var(--error)',
              color: 'var(--error)',
              padding: '0.8rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {submitError}
            </div>
          )}

          <form onSubmit={handleAddRecipe} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div className="admin-recipe-name-grid">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Recipe Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="E.g., Chicken Tikka Masala"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Indian">Indian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Italian">Italian</option>
                  <option value="Soup">Soup</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Dessert">Dessert</option>
                </select>
              </div>
            </div>

            <div className="admin-recipe-specs-grid">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cooking Time (mins)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="30"
                  value={cookingTime}
                  onChange={(e) => setCookingTime(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Difficulty</label>
                <select
                  className="form-control"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Calories (kcal)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="250"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Ingredients & Quantities (Format: Name:Qty, Name:Qty...)</label>
              <textarea
                className="form-control"
                placeholder="E.g., Chicken:300g, Butter:2 tbsp, Tomato:3 medium, Chili Powder:1 tsp"
                value={ingredientsRaw}
                onChange={(e) => setIngredientsRaw(e.target.value)}
                style={{ height: '70px', resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cooking Instructions *</label>
              <textarea
                className="form-control"
                placeholder="1. Sauté onions...\n2. Add spices...\n3. Simmer..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                style={{ height: '120px', resize: 'vertical' }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem' }}
              disabled={isSubmitting}
            >
              <Sparkles size={16} />
              {isSubmitting ? 'Uploading recipe...' : 'Add Recipe to System'}
            </button>
          </form>
        </div>

        {/* Analytics Lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Popular Recipes */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={18} style={{ color: 'var(--secondary)' }} />
              Most Scheduled Recipes
            </h3>
            {loading ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading lists...</div>
            ) : stats?.popularRecipes.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No data yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {stats?.popularRecipes.map((r, i) => (
                  <div key={r.recipe_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{i + 1}. {r.recipe_name}</span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>{r.plan_count} schedules</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popular Ingredients */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={18} style={{ color: 'var(--success)' }} />
              Top Used Ingredients
            </h3>
            {loading ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading lists...</div>
            ) : stats?.popularIngredients.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No data yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {stats?.popularIngredients.map((ing, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{ing.ingredient_name}</span>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{ing.recipe_count} recipes</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Users */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={18} style={{ color: 'var(--warning)' }} />
              Recent Signups
            </h3>
            {loading ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading lists...</div>
            ) : stats?.recentUsers.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No users registered</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {stats?.recentUsers.map(u => (
                  <div key={u.user_id} style={{ display: 'flex', flexDirection: 'column', padding: '0.6rem 0.8rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', fontSize: '0.8rem', gap: '0.15rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{u.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
