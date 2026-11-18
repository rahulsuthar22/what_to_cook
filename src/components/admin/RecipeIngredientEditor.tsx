'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  Package,
} from 'lucide-react';

export interface EditableRecipeIngredient {
  id?: string;
  ingredientId?: string;
  name: string;
  quantity?: number | string | null;
  unitId?: string | null;
  unitSymbol?: string | null;
  preparationNote?: string | null;
  isOptional?: boolean;
  role?: 'MAIN' | 'SECONDARY' | 'FLAVORING' | 'GARNISH' | 'PANTRY_STAPLE' | 'OPTIONAL' | string;
}

interface UnitOption {
  id: string;
  name: string;
  symbol: string | null;
}

interface IngredientOption {
  id: string;
  name: string;
  slug: string;
  categoryName?: string;
  matchedAlias?: string;
}

interface Props {
  ingredients: EditableRecipeIngredient[];
  onChange: (updated: EditableRecipeIngredient[]) => void;
}

const ROLES = [
  { value: 'MAIN', label: 'Main Ingredient' },
  { value: 'SECONDARY', label: 'Secondary' },
  { value: 'FLAVORING', label: 'Flavoring / Spice' },
  { value: 'GARNISH', label: 'Garnish' },
  { value: 'PANTRY_STAPLE', label: 'Pantry Staple' },
  { value: 'OPTIONAL', label: 'Optional' },
];

export default function RecipeIngredientEditor({ ingredients, onChange }: Props) {
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IngredientOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch measurement units
  useEffect(() => {
    let mounted = true;
    fetch('/api/units')
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data.success && Array.isArray(data.units)) {
          setUnits(data.units);
        }
      })
      .catch((err) => console.error('Failed to fetch units:', err));
    return () => {
      mounted = false;
    };
  }, []);

  // Debounced search for master ingredients
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      const resetTimer = setTimeout(() => {
        setSearchResults([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/ingredients?search=${encodeURIComponent(trimmed)}&limit=10`);
        const data = await res.json();
        if (data.success && Array.isArray(data.ingredients)) {
          setSearchResults(
            data.ingredients.map((ing: { id: string; name: string; slug: string; category?: { name?: string }; matchedAlias?: string }) => ({
              id: ing.id,
              name: ing.name,
              slug: ing.slug,
              categoryName: ing.category?.name || 'Pantry',
              matchedAlias: ing.matchedAlias,
            }))
          );
        }
      } catch (err) {
        console.error('Ingredient search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add existing ingredient from search
  const handleSelectIngredient = (ing: IngredientOption) => {
    // Prevent duplicate in same recipe
    if (ingredients.some((item) => item.ingredientId === ing.id || item.name.toLowerCase() === ing.name.toLowerCase())) {
      setSearchQuery('');
      setShowDropdown(false);
      return;
    }

    const newItem: EditableRecipeIngredient = {
      ingredientId: ing.id,
      name: ing.name,
      quantity: '',
      unitId: '',
      unitSymbol: '',
      preparationNote: '',
      isOptional: false,
      role: 'MAIN',
    };

    onChange([...ingredients, newItem]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Add custom ingredient if not found
  const handleAddCustom = () => {
    const clean = searchQuery.trim();
    if (!clean) return;

    if (ingredients.some((item) => item.name.toLowerCase() === clean.toLowerCase())) {
      setSearchQuery('');
      setShowDropdown(false);
      return;
    }

    const newItem: EditableRecipeIngredient = {
      name: clean,
      quantity: '',
      unitId: '',
      unitSymbol: '',
      preparationNote: '',
      isOptional: false,
      role: 'MAIN',
    };

    onChange([...ingredients, newItem]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Row update handlers
  const updateRow = (index: number, patch: Partial<EditableRecipeIngredient>) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };

  const removeRow = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= ingredients.length) return;
    const updated = [...ingredients];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    onChange(updated);
  };

  const inputStyle: React.CSSProperties = {
    padding: '0.45rem 0.65rem',
    borderRadius: '6px',
    backgroundColor: '#0a0b12',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#fff',
    fontSize: '0.82rem',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Search & Add bar */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={14}
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
              placeholder="Search ingredient to add (e.g. Potato, Aloo, Paneer, Garam Masala)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              style={{ ...inputStyle, width: '100%', paddingLeft: '2rem' }}
            />
          </div>

          <button
            type="button"
            onClick={handleAddCustom}
            disabled={!searchQuery.trim()}
            style={{
              ...inputStyle,
              backgroundColor: '#1b1d2a',
              fontWeight: 600,
              cursor: searchQuery.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={14} />
            <span>Add Custom</span>
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && searchQuery.trim().length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: '#161924',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              zIndex: 100,
              maxHeight: '240px',
              overflowY: 'auto',
            }}
          >
            {isSearching ? (
              <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Searching ingredients...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((ing) => (
                <div
                  key={ing.id}
                  onClick={() => handleSelectIngredient(ing)}
                  style={{
                    padding: '0.55rem 0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    fontSize: '0.82rem',
                    color: '#fff',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 90, 54, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={14} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 600 }}>{ing.name}</span>
                    {ing.matchedAlias && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        (matched alias: {ing.matchedAlias})
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#00b4d8' }}>{ing.categoryName}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>No exact master ingredient match.</span>
                <button
                  type="button"
                  onClick={handleAddCustom}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Add as &quot;{searchQuery.trim()}&quot;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ingredient Rows Table */}
      {ingredients.length === 0 ? (
        <div
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            backgroundColor: '#0a0b12',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
          }}
        >
          No ingredients added yet. Use the search bar above to select or type ingredients.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.2fr 40px 70px',
              gap: '0.4rem',
              padding: '0.35rem 0.5rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            <span>Ingredient</span>
            <span>Quantity</span>
            <span>Unit</span>
            <span>Prep Note</span>
            <span>Role</span>
            <span style={{ textAlign: 'center' }}>Opt</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {ingredients.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.2fr 40px 70px',
                gap: '0.4rem',
                alignItems: 'center',
                padding: '0.35rem 0.5rem',
                backgroundColor: '#12141f',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* Ingredient Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                <span
                  title={item.name}
                  style={{
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    color: '#fff',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.name}
                </span>
                {item.ingredientId && (
                  <span
                    title="Linked to Canonical Catalog"
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#06d6a0',
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>

              {/* Quantity */}
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Qty"
                value={item.quantity !== null && item.quantity !== undefined ? item.quantity : ''}
                onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                style={{ ...inputStyle, width: '100%', padding: '0.35rem 0.5rem' }}
              />

              {/* Unit dropdown */}
              <select
                value={item.unitId || ''}
                onChange={(e) => {
                  const uid = e.target.value;
                  const foundUnit = units.find((u) => u.id === uid);
                  updateRow(idx, {
                    unitId: uid || null,
                    unitSymbol: foundUnit?.symbol || null,
                  });
                }}
                style={{ ...inputStyle, width: '100%', padding: '0.35rem 0.4rem', cursor: 'pointer' }}
              >
                <option value="">(None)</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.symbol ? `${u.name} (${u.symbol})` : u.name}
                  </option>
                ))}
              </select>

              {/* Preparation note */}
              <input
                type="text"
                placeholder="e.g. chopped, ground"
                value={item.preparationNote || ''}
                onChange={(e) => updateRow(idx, { preparationNote: e.target.value })}
                style={{ ...inputStyle, width: '100%', padding: '0.35rem 0.5rem' }}
              />

              {/* Ingredient Role */}
              <select
                value={item.role || 'MAIN'}
                onChange={(e) => updateRow(idx, { role: e.target.value })}
                style={{ ...inputStyle, width: '100%', padding: '0.35rem 0.4rem', cursor: 'pointer' }}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>

              {/* Optional toggle */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  title="Mark ingredient as optional"
                  checked={Boolean(item.isOptional)}
                  onChange={(e) => updateRow(idx, { isOptional: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              {/* Actions (Move & Delete) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.15rem' }}>
                <button
                  type="button"
                  title="Move up"
                  disabled={idx === 0}
                  onClick={() => moveRow(idx, 'up')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    padding: '2px',
                  }}
                >
                  <ChevronUp size={14} />
                </button>

                <button
                  type="button"
                  title="Move down"
                  disabled={idx === ingredients.length - 1}
                  onClick={() => moveRow(idx, 'down')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: idx === ingredients.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)',
                    cursor: idx === ingredients.length - 1 ? 'not-allowed' : 'pointer',
                    padding: '2px',
                  }}
                >
                  <ChevronDown size={14} />
                </button>

                <button
                  type="button"
                  title="Remove ingredient"
                  onClick={() => removeRow(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef476f',
                    cursor: 'pointer',
                    padding: '2px',
                    marginLeft: '2px',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
