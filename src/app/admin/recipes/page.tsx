'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AdminSpinner } from '@/components/admin/AdminLoader';
import AdminRecipeSubnav from '@/components/admin/AdminRecipeSubnav';
import {
  ChefHat,
  Search,
  Plus,
  Trash2,
  Eye,
  Pencil,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
} from 'lucide-react';

interface RecipeItem {
  recipe_id: string;
  recipe_name: string;
  category: string;
  cooking_time: number;
  difficulty_level: string;
  instructions: string;
  image_url?: string | null;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  created_at?: string;
  ingredients: Array<{
    name: string;
    category?: string;
    quantity?: string;
  }>;
}

export default function AdminRecipesPage() {
  // View mode: 'catalog' | 'create'
  const [viewMode, setViewMode] = useState<'catalog' | 'create'>('catalog');

  // Catalog State
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal inspection state
  const [inspectingRecipe, setInspectingRecipe] = useState<RecipeItem | null>(null);

  // Edit Modal State
  const [editingRecipe, setEditingRecipe] = useState<RecipeItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('Easy');
  const [editCalories, setEditCalories] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editIngredientsRaw, setEditIngredientsRaw] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete modal state
  const [deletingRecipe, setDeletingRecipe] = useState<RecipeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Create Form State
  const [recipeName, setRecipeName] = useState('');
  const [category, setCategory] = useState('Indian');
  const [cookingTime, setCookingTime] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [calories, setCalories] = useState('');
  const [instructions, setInstructions] = useState('');
  const [ingredientsRaw, setIngredientsRaw] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Recipes
  const fetchRecipes = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
        sort: sortBy,
      });

      if (selectedCategory && selectedCategory !== 'ALL') {
        params.set('category', selectedCategory);
      }
      if (selectedDifficulty && selectedDifficulty !== 'ALL') {
        params.set('difficulty', selectedDifficulty);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await fetch(`/api/recipes?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setRecipes(data.recipes || []);
        setTotalRecipes(typeof data.total === 'number' ? data.total : (data.recipes?.length || 0));
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching admin recipes:', err);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, [currentPage, pageSize, selectedCategory, selectedDifficulty, sortBy, searchQuery]);

  // Initial & Filter Triggered Fetch
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  // Open Edit Modal with Pre-populated data
  const handleOpenEdit = (recipe: RecipeItem) => {
    setEditingRecipe(recipe);
    setEditName(recipe.recipe_name);
    setEditCategory(recipe.category || '');
    setEditTime(recipe.cooking_time ? recipe.cooking_time.toString() : '');
    setEditDifficulty(recipe.difficulty_level || 'Easy');
    setEditCalories(recipe.calories ? recipe.calories.toString() : '');
    setEditInstructions(recipe.instructions || '');

    // Format ingredients into "Name: Quantity, Name: Quantity"
    const ingText = (recipe.ingredients || [])
      .map((i) => (i.quantity ? `${i.name}: ${i.quantity}` : i.name))
      .join(', ');
    setEditIngredientsRaw(ingText);
    setEditError('');

    // If inspection modal was open, close it
    setInspectingRecipe(null);
  };

  // Submit Edit Recipe
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe) return;

    if (!editName.trim() || !editInstructions.trim()) {
      setEditError('Recipe Name and Instructions are required.');
      return;
    }

    const ingredientsParsed = editIngredientsRaw
      .split(',')
      .map((part) => {
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

    setIsSavingEdit(true);
    setEditError('');

    try {
      const res = await fetch(`/api/recipes/${editingRecipe.recipe_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_name: editName.trim(),
          category: editCategory.trim(),
          cooking_time: editTime,
          difficulty_level: editDifficulty,
          calories: editCalories,
          instructions: editInstructions,
          ingredients: ingredientsParsed,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`"${editName}" updated successfully.`, 'success');
        setEditingRecipe(null);
        fetchRecipes();
      } else {
        setEditError(data.error || 'Failed to update recipe.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setEditError(msg || 'An unexpected error occurred while updating.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Action
  const handleDeleteRecipe = async () => {
    if (!deletingRecipe) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${deletingRecipe.recipe_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast(`"${deletingRecipe.recipe_name}" deleted.`, 'success');
        setDeletingRecipe(null);
        fetchRecipes();
      } else {
        showToast(data.error || 'Failed to delete recipe.', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg || 'Error deleting recipe.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Submit Create Recipe
  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(false);
    setSubmitError('');

    if (!recipeName || !instructions) {
      setSubmitError('Recipe Name and Instructions are required.');
      return;
    }

    const ingredientsParsed = ingredientsRaw
      .split(',')
      .map((part) => {
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
        setRecipeName('');
        setCookingTime('');
        setCalories('');
        setInstructions('');
        setIngredientsRaw('');
        fetchRecipes();
      } else {
        setSubmitError(data.error || 'Failed to submit recipe.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(totalRecipes / pageSize));
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalRecipes);

  const getDifficultyColor = (diff?: string) => {
    const d = (diff || '').toLowerCase();
    if (d === 'easy') return { bg: 'rgba(6, 214, 160, 0.12)', text: '#06d6a0' };
    if (d === 'medium') return { bg: 'rgba(255, 209, 102, 0.12)', text: '#ffd166' };
    return { bg: 'rgba(239, 71, 111, 0.12)', text: '#ef476f' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Sub Navigation */}
      <AdminRecipeSubnav />

      {/* Header & Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Recipes
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.15rem 0.55rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
              }}
            >
              {totalRecipes} Total
            </span>
          </div>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              margin: '0.2rem 0 0 0',
            }}
          >
            Manage catalog entries, ingredients, and publishing status.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {viewMode === 'catalog' ? (
            <>
              <button
                onClick={() => fetchRecipes(true)}
                disabled={refreshing || loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '6px',
                  backgroundColor: '#151722',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: refreshing || loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s ease',
                }}
                title="Refresh catalog"
              >
                <RefreshCw
                  size={14}
                  style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
                />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setViewMode('create')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.95rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
              >
                <Plus size={15} />
                <span>Add Recipe</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setViewMode('catalog');
                setSubmitSuccess(false);
                setSubmitError('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '6px',
                backgroundColor: '#151722',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <span>Back to Catalog</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            backgroundColor:
              toast.type === 'success' ? 'rgba(6, 214, 160, 0.1)' : 'rgba(239, 71, 111, 0.1)',
            border:
              toast.type === 'success'
                ? '1px solid rgba(6, 214, 160, 0.3)'
                : '1px solid rgba(239, 71, 111, 0.3)',
            color: toast.type === 'success' ? '#06d6a0' : '#ef476f',
            fontSize: '0.82rem',
          }}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* VIEW MODE 1: CATALOG TABLE */}
      {viewMode === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filter Bar */}
          <div
            style={{
              backgroundColor: '#12141c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            {/* Search Box */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search recipes by name..."
                value={searchQuery}
                onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 2rem 0.5rem 2rem',
                  borderRadius: '6px',
                  backgroundColor: '#0a0b12',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => handleFilterChange(setSearchQuery, '')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                value={selectedCategory}
                onChange={(e) => handleFilterChange(setSelectedCategory, e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: '#0a0b12',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Difficulty Dropdown */}
              <select
                value={selectedDifficulty}
                onChange={(e) => handleFilterChange(setSelectedDifficulty, e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: '#0a0b12',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: '#0a0b12',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="newest">Newest First</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="time_asc">Cook Time (Shortest)</option>
                <option value="time_desc">Cook Time (Longest)</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div
            style={{
              backgroundColor: '#12141c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem 1rem',
                  gap: '0.65rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                }}
              >
                <AdminSpinner size={20} color="var(--primary)" />
                <span>Loading catalog...</span>
              </div>
            ) : recipes.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3.5rem 1.5rem',
                  textAlign: 'center',
                }}
              >
                <UtensilsCrossed size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', opacity: 0.4 }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: '0 0 0.35rem 0' }}>
                  No recipes found
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', maxWidth: '360px' }}>
                  {searchQuery || selectedCategory !== 'ALL' || selectedDifficulty !== 'ALL'
                    ? 'No recipes match your current search or filter criteria.'
                    : 'The recipe catalog is currently empty. Add your first recipe or import a batch dataset.'}
                </p>

                {searchQuery || selectedCategory !== 'ALL' || selectedDifficulty !== 'ALL' ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                      setSelectedDifficulty('ALL');
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Clear Filters
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setViewMode('create')}
                      style={{
                        padding: '0.5rem 0.95rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--primary)',
                        color: '#fff',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Add Recipe
                    </button>
                    <Link
                      href="/admin/recipes/import"
                      style={{
                        padding: '0.5rem 0.95rem',
                        borderRadius: '6px',
                        backgroundColor: '#1b1e2c',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        textDecoration: 'none',
                      }}
                    >
                      Import Recipes
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '0.82rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-muted)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      <th style={{ padding: '0.75rem 1rem' }}>Recipe</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Difficulty</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Ingredients</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Calories</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipes.map((r) => {
                      const diffStyle = getDifficultyColor(r.difficulty_level);

                      return (
                        <tr
                          key={r.recipe_id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'background 0.12s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {/* Recipe Name & Thumbnail */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '6px',
                                  backgroundColor: '#1b1e2c',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {r.image_url ? (
                                  <img
                                    src={r.image_url}
                                    alt={r.recipe_name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <ChefHat size={16} />
                                )}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    color: '#fff',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '240px',
                                  }}
                                  title={r.recipe_name}
                                >
                                  {r.recipe_name}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-muted)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '220px',
                                  }}
                                >
                                  {r.ingredients.map((i) => i.name).slice(0, 3).join(', ')}
                                  {r.ingredients.length > 3 && '...'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 500,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {r.category || 'Uncategorized'}
                            </span>
                          </td>

                          {/* Cook Time */}
                          <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                              <span>{r.cooking_time ? `${r.cooking_time}m` : '—'}</span>
                            </div>
                          </td>

                          {/* Difficulty */}
                          <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                backgroundColor: diffStyle.bg,
                                color: diffStyle.text,
                              }}
                            >
                              {r.difficulty_level || 'Easy'}
                            </span>
                          </td>

                          {/* Ingredients Count */}
                          <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                            {r.ingredients?.length || 0} items
                          </td>

                          {/* Calories */}
                          <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                            {r.calories ? `${r.calories} kcal` : '—'}
                          </td>

                          {/* Actions: View, Edit, Delete */}
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              {/* View Action */}
                              <button
                                onClick={() => setInspectingRecipe(r)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.3rem 0.55rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  transition: 'background 0.15s ease',
                                }}
                                title="View details"
                              >
                                <Eye size={13} />
                                <span>View</span>
                              </button>

                              {/* Edit Action */}
                              <button
                                onClick={() => handleOpenEdit(r)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.3rem 0.55rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(0, 180, 216, 0.08)',
                                  border: '1px solid rgba(0, 180, 216, 0.25)',
                                  color: '#00b4d8',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  transition: 'background 0.15s ease',
                                }}
                                title="Edit recipe"
                              >
                                <Pencil size={13} />
                                <span>Edit</span>
                              </button>

                              {/* Delete Action */}
                              <button
                                onClick={() => setDeletingRecipe(r)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.3rem 0.45rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(239, 71, 111, 0.08)',
                                  border: '1px solid rgba(239, 71, 111, 0.2)',
                                  color: '#ef476f',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                }}
                                title="Delete recipe"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalRecipes > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  backgroundColor: '#0e1017',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <div>
                  Showing <strong style={{ color: '#fff' }}>{startIndex}</strong> to{' '}
                  <strong style={{ color: '#fff' }}>{endIndex}</strong> of{' '}
                  <strong style={{ color: '#fff' }}>{totalRecipes}</strong> recipes
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Page Size Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Rows:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: '#171924',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  {/* Prev / Next Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        backgroundColor: '#171924',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: currentPage <= 1 ? 'var(--text-muted)' : '#fff',
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                      }}
                      title="Previous page"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    <span style={{ fontSize: '0.75rem', padding: '0 0.35rem' }}>
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        backgroundColor: '#171924',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: currentPage >= totalPages ? 'var(--text-muted)' : '#fff',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                      }}
                      title="Next page"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CREATE RECIPE FORM */}
      {viewMode === 'create' && (
        <div
          style={{
            backgroundColor: '#12141f',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '1.5rem',
          }}
        >
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', margin: '0 0 0.25rem 0' }}>
              Add New Recipe
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
              Author and publish a single recipe directly into the catalog.
            </p>
          </div>

          {submitSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(6, 214, 160, 0.1)',
                border: '1px solid rgba(6, 214, 160, 0.3)',
                color: '#06d6a0',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} />
                <span>Recipe published successfully!</span>
              </div>
              <button
                onClick={() => setViewMode('catalog')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '4px',
                  backgroundColor: '#06d6a0',
                  color: '#0b0c10',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                View in Catalog
              </button>
            </div>
          )}

          {submitError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 71, 111, 0.1)',
                border: '1px solid rgba(239, 71, 111, 0.3)',
                color: '#ef476f',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleAddRecipe} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Recipe Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paneer Butter Masala"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    backgroundColor: '#0a0b12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Indian, Italian, Breakfast"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    backgroundColor: '#0a0b12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Cooking Time (minutes)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 30"
                  value={cookingTime}
                  onChange={(e) => setCookingTime(e.target.value)}
                  min={1}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    backgroundColor: '#0a0b12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    backgroundColor: '#0a0b12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 420"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  min={0}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    backgroundColor: '#0a0b12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Ingredients (comma separated: &quot;Name: Quantity&quot;)
              </label>
              <textarea
                placeholder="Paneer: 250g, Tomato: 3 pcs, Butter: 2 tbsp, Garam Masala: 1 tsp"
                value={ingredientsRaw}
                onChange={(e) => setIngredientsRaw(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  backgroundColor: '#0a0b12',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Cooking Instructions *
              </label>
              <textarea
                placeholder="1. Heat butter in a pan and sauté aromatics...&#10;2. Add pureed tomatoes and cook until oil separates...&#10;3. Add cubed paneer and simmer..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                required
                rows={5}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  backgroundColor: '#0a0b12',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.8 : 1,
                }}
              >
                {isSubmitting ? (
                  <>
                    <AdminSpinner size={15} color="#ffffff" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Recipe</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewMode('catalog')}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT RECIPE MODAL */}
      {editingRecipe && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => {
            if (!isSavingEdit) setEditingRecipe(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#12141c',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pencil size={18} style={{ color: 'var(--secondary)' }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                  Edit Recipe
                </h2>
              </div>

              <button
                onClick={() => setEditingRecipe(null)}
                disabled={isSavingEdit}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                  padding: '0.25rem',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 71, 111, 0.1)',
                  border: '1px solid rgba(239, 71, 111, 0.3)',
                  color: '#ef476f',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertCircle size={15} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Recipe Name *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '6px',
                      backgroundColor: '#0a0b12',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '6px',
                      backgroundColor: '#0a0b12',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Cooking Time (mins)
                  </label>
                  <input
                    type="number"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    min={0}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '6px',
                      backgroundColor: '#0a0b12',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Difficulty
                  </label>
                  <select
                    value={editDifficulty}
                    onChange={(e) => setEditDifficulty(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '6px',
                      backgroundColor: '#0a0b12',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={editCalories}
                    onChange={(e) => setEditCalories(e.target.value)}
                    min={0}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '6px',
                      backgroundColor: '#0a0b12',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Ingredients (format: &quot;Name: Quantity, Name: Quantity&quot;)
                </label>
                <textarea
                  value={editIngredientsRaw}
                  onChange={(e) => setEditIngredientsRaw(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '6px',
                    backgroundColor: '#0a0b12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Instructions *
                </label>
                <textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  required
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '6px',
                    backgroundColor: '#0a0b12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingRecipe(null)}
                  disabled={isSavingEdit}
                  style={{
                    padding: '0.55rem 0.95rem',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingEdit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 1.1rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--primary)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                    opacity: isSavingEdit ? 0.8 : 1,
                  }}
                >
                  {isSavingEdit ? (
                    <>
                      <AdminSpinner size={14} color="#ffffff" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL */}
      {inspectingRecipe && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setInspectingRecipe(null)}
        >
          <div
            style={{
              backgroundColor: '#12141c',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '1.5rem',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.85rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {inspectingRecipe.category}
                </span>
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#fff',
                    margin: '0.15rem 0 0 0',
                  }}
                >
                  {inspectingRecipe.recipe_name}
                </h2>
              </div>

              <button
                onClick={() => setInspectingRecipe(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '0.65rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ backgroundColor: '#181b28', padding: '0.6rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                  Cook Time
                </span>
                <strong style={{ fontSize: '0.9rem', color: '#fff' }}>
                  {inspectingRecipe.cooking_time ? `${inspectingRecipe.cooking_time} mins` : '—'}
                </strong>
              </div>

              <div style={{ backgroundColor: '#181b28', padding: '0.6rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                  Difficulty
                </span>
                <strong style={{ fontSize: '0.9rem', color: '#fff' }}>
                  {inspectingRecipe.difficulty_level || 'Easy'}
                </strong>
              </div>

              <div style={{ backgroundColor: '#181b28', padding: '0.6rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                  Calories
                </span>
                <strong style={{ fontSize: '0.9rem', color: '#fff' }}>
                  {inspectingRecipe.calories ? `${inspectingRecipe.calories} kcal` : '—'}
                </strong>
              </div>

              <div style={{ backgroundColor: '#181b28', padding: '0.6rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                  Ingredients
                </span>
                <strong style={{ fontSize: '0.9rem', color: '#fff' }}>
                  {inspectingRecipe.ingredients.length} items
                </strong>
              </div>
            </div>

            {/* Ingredients List */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
                Ingredients
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '0.4rem',
                  maxHeight: '160px',
                  overflowY: 'auto',
                }}
              >
                {inspectingRecipe.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '4px',
                      backgroundColor: '#181b28',
                      fontSize: '0.78rem',
                    }}
                  >
                    <span style={{ color: '#fff', fontWeight: 500 }}>{ing.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      {ing.quantity || 'as needed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
                Instructions
              </h3>
              <div
                style={{
                  backgroundColor: '#181b28',
                  padding: '0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  maxHeight: '220px',
                  overflowY: 'auto',
                }}
              >
                {inspectingRecipe.instructions || 'No instructions provided.'}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => handleOpenEdit(inspectingRecipe)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0, 180, 216, 0.12)',
                  border: '1px solid rgba(0, 180, 216, 0.3)',
                  color: '#00b4d8',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Pencil size={13} />
                <span>Edit Recipe</span>
              </button>

              <button
                onClick={() => setInspectingRecipe(null)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingRecipe && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => {
            if (!isDeleting) setDeletingRecipe(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#12141c',
              border: '1px solid rgba(239, 71, 111, 0.3)',
              borderRadius: '10px',
              maxWidth: '420px',
              width: '100%',
              padding: '1.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 71, 111, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef476f',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={18} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                Delete Recipe
              </h3>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              Are you sure you want to delete <strong style={{ color: '#fff' }}>&quot;{deletingRecipe.recipe_name}&quot;</strong>? This will permanently remove the recipe from all recommendation engines and meal planners.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                onClick={() => setDeletingRecipe(null)}
                disabled={isDeleting}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteRecipe}
                disabled={isDeleting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#ef476f',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                {isDeleting ? (
                  <>
                    <AdminSpinner size={14} color="#ffffff" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
