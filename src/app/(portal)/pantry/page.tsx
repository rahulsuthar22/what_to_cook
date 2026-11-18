'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Package,
  Plus,
  Trash2,
  Search,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  CookingPot,
  ArrowRight,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

interface PantryItem {
  id: string;
  ingredientId: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  category: string;
  aliases: string[];
  quantity?: number | null;
  formattedQuantity: string;
  unitId?: string | null;
  unitSymbol?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface SearchCandidate {
  id: string;
  name: string;
  slug: string;
  categoryName?: string;
  matchedAlias?: string;
}

const COMMON_PANTRY_STAPLES = [
  'Salt',
  'Cooking Oil',
  'Onion',
  'Tomato',
  'Potato',
  'Garlic',
  'Ginger',
  'Turmeric Powder',
  'Cumin Seeds',
  'Garam Masala',
  'Rice',
  'Wheat Flour',
  'Butter',
  'Milk',
  'Paneer',
];

export default function PantryPage() {
  const { user } = useAuth();
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Add state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPantry = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/me/pantry');
      const data = await res.json();
      if (data.success && Array.isArray(data.pantry)) {
        setPantryItems(data.pantry);
      } else if (data.error) {
        showToast(data.error, 'error');
      }
    } catch {
      showToast('Network error while loading pantry', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPantry();
  }, [fetchPantry]);

  // Debounced search against master catalog
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/ingredients?search=${encodeURIComponent(searchQuery.trim())}&limit=8`);
        const data = await res.json();
        if (data.success && Array.isArray(data.ingredients)) {
          setSearchResults(
            data.ingredients.map((ing: any) => ({
              id: ing.id,
              name: ing.name,
              slug: ing.slug,
              categoryName: ing.category?.name || 'Pantry',
              matchedAlias: ing.matchedAlias,
            }))
          );
        }
      } catch (err) {
        console.error('Pantry search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add Item
  const handleAddItem = async (candidate: { id?: string; name: string }) => {
    setAddingId(candidate.id || candidate.name);
    try {
      const res = await fetch('/api/me/pantry/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId: candidate.id,
          name: candidate.name,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Added "${candidate.name}" to your pantry`);
        setSearchQuery('');
        setShowDropdown(false);
        fetchPantry(true);
      } else {
        showToast(data.error || 'Failed to add item', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setAddingId(null);
    }
  };

  // Remove Item
  const handleRemoveItem = async (itemId: string, itemName: string) => {
    try {
      const res = await fetch(`/api/me/pantry/items/${itemId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Removed "${itemName}"`);
        setPantryItems((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        showToast(data.error || 'Failed to remove item', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Clear Pantry
  const handleClearPantry = async () => {
    if (!confirm('Are you sure you want to clear your entire pantry?')) return;

    try {
      const res = await fetch('/api/me/pantry', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Pantry cleared');
        setPantryItems([]);
      } else {
        showToast(data.error || 'Failed to clear pantry', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const categories = Array.from(new Set(pantryItems.map((i) => i.category))).filter(Boolean);
  const filteredItems =
    selectedCategory === 'ALL'
      ? pantryItems
      : pantryItems.filter((i) => i.category === selectedCategory);

  const pantryIngredientNames = pantryItems.map((i) => i.name.toLowerCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#06d6a0' : '#ef476f',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(255, 90, 54, 0.12) 0%, rgba(0, 180, 216, 0.08) 100%)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid rgba(255, 90, 54, 0.2)',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <Package size={26} style={{ color: 'var(--primary)' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              My Personal Pantry
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0, maxWidth: '600px' }}>
            Keep track of ingredients available in your kitchen. We'll automatically match recipes you can cook right now with zero food waste.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {pantryItems.length > 0 && (
            <Link
              href={`/recommendations?pantry=${encodeURIComponent(pantryItems.map((i) => i.name).join(','))}`}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.35rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              <CookingPot size={18} />
              <span>Find Recipes I Can Cook ({pantryItems.length})</span>
              <ArrowRight size={16} />
            </Link>
          )}

          <button
            onClick={() => fetchPantry(true)}
            disabled={refreshing}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1rem' }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Quick Search & Add Bar */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search ingredient to add (e.g. Potato, Aloo, Paneer, Garam Masala, Eggs)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem 0.85rem 2.75rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface)',
              border: '1.5px solid var(--border-color)',
              color: '#fff',
              fontSize: '0.95rem',
              outline: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          />
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchQuery.trim().length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '6px',
              backgroundColor: '#161924',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              zIndex: 200,
              maxHeight: '280px',
              overflowY: 'auto',
            }}
          >
            {isSearching ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Searching pantry catalog...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((cand) => {
                const alreadyInPantry = pantryIngredientNames.includes(cand.name.toLowerCase());
                return (
                  <div
                    key={cand.id}
                    onClick={() => !alreadyInPantry && handleAddItem(cand)}
                    style={{
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: alreadyInPantry ? 'default' : 'pointer',
                      opacity: alreadyInPantry ? 0.6 : 1,
                      backgroundColor: 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!alreadyInPantry) e.currentTarget.style.backgroundColor = 'rgba(255, 90, 54, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      if (!alreadyInPantry) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Package size={16} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{cand.name}</span>
                      {cand.matchedAlias && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          (alias: {cand.matchedAlias})
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#00b4d8' }}>{cand.categoryName}</span>
                      {alreadyInPantry ? (
                        <span style={{ fontSize: '0.75rem', color: '#06d6a0', fontWeight: 600 }}>In Pantry</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>+ Add</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>No exact master ingredient found for "{searchQuery.trim()}".</span>
                <button
                  type="button"
                  onClick={() => handleAddItem({ name: searchQuery.trim() })}
                  className="btn btn-primary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Add Custom Item
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Add Common Staples Chips */}
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Sparkles size={15} style={{ color: '#ffd166' }} />
          <span>Quick Add Common Staples:</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
          {COMMON_PANTRY_STAPLES.map((staple) => {
            const hasIt = pantryIngredientNames.includes(staple.toLowerCase());
            return (
              <button
                key={staple}
                onClick={() => !hasIt && handleAddItem({ name: staple })}
                disabled={hasIt}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  backgroundColor: hasIt ? 'rgba(6, 214, 160, 0.15)' : 'var(--bg-surface)',
                  color: hasIt ? '#06d6a0' : 'var(--text-primary)',
                  border: hasIt ? '1px solid rgba(6, 214, 160, 0.4)' : '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: hasIt ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {hasIt ? <Check size={12} /> : <Plus size={12} />}
                <span>{staple}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pantry Items Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Available Items ({filteredItems.length})
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Categories ({pantryItems.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {pantryItems.length > 0 && (
              <button
                onClick={handleClearPantry}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef476f',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.4rem',
                }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading your pantry...
          </div>
        ) : filteredItems.length === 0 ? (
          <div
            style={{
              padding: '3.5rem 2rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--border-radius-lg)',
              border: '1px dashed var(--border-color)',
              color: 'var(--text-muted)',
            }}
          >
            <Package size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 0.4rem 0' }}>Your pantry is empty</h3>
            <p style={{ fontSize: '0.85rem', margin: '0 auto 1.25rem', maxWidth: '420px' }}>
              Add ingredients you already have at home using the search bar or quick-picks above.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {filteredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  position: 'relative',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 90, 54, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)',
                        }}
                      >
                        <Package size={18} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{item.name}</div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id, item.name)}
                    title="Remove from pantry"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef476f')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingTop: '0.5rem',
                    marginTop: 'auto',
                  }}
                >
                  <span style={{ color: '#06d6a0', fontWeight: 600 }}>Available</span>
                  {item.quantity && (
                    <span style={{ color: '#fff', fontWeight: 600 }}>{item.formattedQuantity}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
