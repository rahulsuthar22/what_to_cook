'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminSpinner } from '@/components/admin/AdminLoader';
import {
  Search,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Package,
  Check,
  Tag,
  Eye,
  SlidersHorizontal,
  FolderPlus,
  Layers,
} from 'lucide-react';

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface AliasItem {
  id: string;
  alias: string;
  aliasNormalized: string;
}

interface IngredientItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  categoryId?: string | null;
  categoryName: string;
  aliases: string[];
  aliasesList: AliasItem[];
  recipeCount: number;
  allergenCount: number;
  pantryCount: number;
  groceryCount: number;
  createdAt: string;
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'newest' | 'oldest'>('name');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addCategoryId, setAddCategoryId] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addImageUrl, setAddImageUrl] = useState('');
  const [addAliasesInput, setAddAliasesInput] = useState('');
  const [addIsActive, setAddIsActive] = useState(true);
  const [adding, setAdding] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<IngredientItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [newAliasText, setNewAliasText] = useState('');
  const [addingAlias, setAddingAlias] = useState(false);

  // Category Manager Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // Delete State
  const [confirmDelete, setConfirmDelete] = useState<IngredientItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  };

  const fetchIngredients = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          search: searchQuery,
          sort: sortBy,
          limit: rowsPerPage.toString(),
          offset: ((currentPage - 1) * rowsPerPage).toString(),
        });

        if (selectedCategory && selectedCategory !== 'ALL') {
          params.set('categoryId', selectedCategory);
        }
        if (selectedStatus && selectedStatus !== 'ALL') {
          params.set('status', selectedStatus);
        }

        const res = await fetch(`/api/admin/ingredients?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          setIngredients(data.ingredients || []);
          setTotal(data.total || 0);
          if (data.categories) {
            setCategories(data.categories);
          }
        } else {
          showToast(data.error || 'Failed to load ingredients', 'error');
        }
      } catch {
        showToast('Network error while loading ingredients', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, selectedCategory, selectedStatus, sortBy, rowsPerPage, currentPage]
  );

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  // Handle Add Ingredient
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;
    setAdding(true);

    const aliases = addAliasesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/admin/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName.trim(),
          categoryId: addCategoryId || null,
          description: addDescription.trim() || null,
          imageUrl: addImageUrl.trim() || null,
          isActive: addIsActive,
          aliases,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Ingredient "${data.ingredient.name}" created successfully`);
        setAddName('');
        setAddCategoryId('');
        setAddDescription('');
        setAddImageUrl('');
        setAddAliasesInput('');
        setAddIsActive(true);
        setShowAddModal(false);
        fetchIngredients(true);
      } else {
        showToast(data.error || 'Failed to create ingredient', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setAdding(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (item: IngredientItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategoryId(item.categoryId || '');
    setEditDescription(item.description || '');
    setEditImageUrl(item.imageUrl || '');
    setEditIsActive(item.isActive);
    setNewAliasText('');
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editName.trim()) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/ingredients?id=${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          categoryId: editCategoryId || null,
          description: editDescription.trim() || null,
          imageUrl: editImageUrl.trim() || null,
          isActive: editIsActive,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast('Ingredient updated successfully');
        setEditingItem(null);
        fetchIngredients(true);
      } else {
        showToast(data.error || 'Update failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Add Alias to current editing item
  const handleAddAlias = async () => {
    if (!editingItem || !newAliasText.trim()) return;
    setAddingAlias(true);

    try {
      const res = await fetch(`/api/admin/ingredients?id=${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addAlias: newAliasText.trim() }),
      });
      const data = await res.json();

      if (data.success && data.alias) {
        showToast(`Alias "${data.alias.alias}" added`);
        setNewAliasText('');
        // Update local editing item aliases
        setEditingItem((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            aliases: [...prev.aliases, data.alias.alias],
            aliasesList: [...prev.aliasesList, data.alias],
          };
        });
        fetchIngredients(true);
      } else {
        showToast(data.error || 'Failed to add alias', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setAddingAlias(false);
    }
  };

  // Remove Alias
  const handleRemoveAlias = async (aliasId: string, aliasName: string) => {
    if (!editingItem) return;

    try {
      const res = await fetch(`/api/admin/ingredients?id=${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeAliasId: aliasId }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Alias "${aliasName}" removed`);
        setEditingItem((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            aliases: prev.aliases.filter((a) => a !== aliasName),
            aliasesList: prev.aliasesList.filter((a) => a.id !== aliasId),
          };
        });
        fetchIngredients(true);
      } else {
        showToast(data.error || 'Failed to remove alias', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);

    try {
      const res = await fetch(`/api/admin/ingredients?id=${confirmDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast(`"${confirmDelete.name}" deleted successfully`);
        setConfirmDelete(null);
        fetchIngredients(true);
      } else {
        showToast(data.error || 'Delete failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);

    try {
      const res = await fetch('/api/admin/ingredients/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Category "${data.category.name}" created`);
        setNewCategoryName('');
        setNewCategoryDesc('');
        setShowCategoryModal(false);
        fetchIngredients(true);
      } else {
        showToast(data.error || 'Failed to create category', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const startRow = total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, total);

  const inputStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    backgroundColor: '#0a0b12',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Alert */}
      {toast.show && (
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

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={24} style={{ color: 'var(--primary)' }} />
            Master Ingredient Catalog
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Manage canonical ingredients, regional aliases (e.g. Aloo, Pyaz), classifications, and usage analytics.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setShowCategoryModal(true)}
            style={{
              ...inputStyle,
              backgroundColor: '#161924',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
            }}
          >
            <FolderPlus size={15} style={{ color: '#00b4d8' }} />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={() => fetchIngredients(true)}
            disabled={refreshing}
            style={{
              ...inputStyle,
              backgroundColor: '#161924',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 90, 54, 0.3)',
            }}
          >
            <Plus size={16} />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'center',
          backgroundColor: '#12141f',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by canonical name or alias (e.g. Aloo, Paneer)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{ ...inputStyle, width: '100%', paddingLeft: '2rem' }}
          />
        </div>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setCurrentPage(1);
          }}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="name">Name (A-Z)</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Main Table */}
      <div
        style={{
          backgroundColor: '#12141f',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '3.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <AdminSpinner size={28} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading ingredient catalog...</span>
          </div>
        ) : ingredients.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>No ingredients found</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Try adjusting your search query or category filters.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#0d0e17', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Ingredient</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Aliases / Regional Names</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'center' }}>Usage</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Name & Image */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              backgroundColor: '#1b1d2a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <Package size={16} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{item.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/{item.slug}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          backgroundColor: 'rgba(0, 180, 216, 0.12)',
                          color: '#00b4d8',
                          fontWeight: 500,
                        }}
                      >
                        {item.categoryName}
                      </span>
                    </td>

                    {/* Aliases */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {item.aliases.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {item.aliases.slice(0, 4).map((alias, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {alias}
                            </span>
                          ))}
                          {item.aliases.length > 4 && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              +{item.aliases.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No aliases</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: item.isActive ? 'rgba(6, 214, 160, 0.12)' : 'rgba(239, 71, 111, 0.12)',
                          color: item.isActive ? '#06d6a0' : '#ef476f',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.isActive ? '#06d6a0' : '#ef476f' }} />
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Usage */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', fontSize: '0.78rem' }}>
                        <span title="Recipes using this ingredient" style={{ color: item.recipeCount > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                          <strong>{item.recipeCount}</strong> recipes
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                        <span title="Users with this in their pantry" style={{ color: item.pantryCount > 0 ? '#ffd166' : 'var(--text-muted)' }}>
                          <strong>{item.pantryCount}</strong> pantries
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit ingredient & manage aliases"
                          style={{
                            padding: '0.35rem 0.55rem',
                            borderRadius: '5px',
                            backgroundColor: '#1b1d2a',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          onClick={() => setConfirmDelete(item)}
                          title="Delete ingredient"
                          style={{
                            padding: '0.35rem 0.55rem',
                            borderRadius: '5px',
                            backgroundColor: '#1b1d2a',
                            border: '1px solid rgba(239, 71, 111, 0.2)',
                            color: '#ef476f',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.85rem 1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: '#0d0e17',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            Showing {startRow} to {endRow} of {total} ingredients
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{
                ...inputStyle,
                padding: '0.35rem 0.6rem',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={14} />
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              style={{
                ...inputStyle,
                padding: '0.35rem 0.6rem',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.4 : 1,
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#12141f',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '540px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Add New Master Ingredient
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Canonical Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Potato, Paneer, Basmati Rice"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Category
                </label>
                <select
                  value={addCategoryId}
                  onChange={(e) => setAddCategoryId(e.target.value)}
                  style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Aliases / Regional Names (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aloo, Alu, Batata"
                  value={addAliasesInput}
                  onChange={(e) => setAddAliasesInput(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Users searching for these terms will automatically find this canonical ingredient.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={addImageUrl}
                  onChange={(e) => setAddImageUrl(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short culinary description or notes..."
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="addIsActive"
                  checked={addIsActive}
                  onChange={(e) => setAddIsActive(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="addIsActive" style={{ fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
                  Active (visible in public search and recipe editor)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ ...inputStyle, backgroundColor: '#1b1d2a', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: adding ? 'not-allowed' : 'pointer',
                  }}
                >
                  {adding ? <AdminSpinner size={16} /> : 'Create Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit & Manage Aliases Modal */}
      {editingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#12141f',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '580px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Edit Ingredient: {editingItem.name}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ID: {editingItem.id}
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Core details form */}
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Canonical Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Category
                </label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="editIsActive" style={{ fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
                  Active (Customer-facing catalog visibility)
                </label>
              </div>

              {/* Aliases Manager Section */}
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Tag size={15} style={{ color: 'var(--primary)' }} />
                  <span>Regional Aliases & Synonyms</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', minHeight: '32px' }}>
                  {editingItem.aliasesList.length > 0 ? (
                    editingItem.aliasesList.map((a) => (
                      <span
                        key={a.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '16px',
                          backgroundColor: 'rgba(255, 90, 54, 0.12)',
                          color: '#fff',
                          border: '1px solid rgba(255, 90, 54, 0.3)',
                          fontSize: '0.8rem',
                        }}
                      >
                        {a.alias}
                        <button
                          type="button"
                          onClick={() => handleRemoveAlias(a.id, a.alias)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef476f',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                          }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      No aliases registered yet. Add synonyms or Hindi/regional names below.
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input
                    type="text"
                    placeholder="New alias (e.g. Aloo, Pyaz)..."
                    value={newAliasText}
                    onChange={(e) => setNewAliasText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAlias();
                      }
                    }}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddAlias}
                    disabled={addingAlias || !newAliasText.trim()}
                    style={{
                      ...inputStyle,
                      backgroundColor: '#1b1d2a',
                      cursor: addingAlias || !newAliasText.trim() ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {addingAlias ? <AdminSpinner size={14} /> : 'Add Alias'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{ ...inputStyle, backgroundColor: '#1b1d2a', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: savingEdit ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingEdit ? <AdminSpinner size={16} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#12141f',
              border: '1px solid rgba(239, 71, 111, 0.3)',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef476f' }}>
              <AlertCircle size={24} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Delete Ingredient</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{confirmDelete.name}</strong>?
              {confirmDelete.recipeCount > 0 && (
                <span style={{ display: 'block', marginTop: '0.5rem', color: '#ef476f' }}>
                  ⚠️ This ingredient is currently used in {confirmDelete.recipeCount} recipe(s). The system will reject deletion while it remains referenced.
                </span>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                style={{ ...inputStyle, backgroundColor: '#1b1d2a', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={Boolean(deletingId)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '6px',
                  backgroundColor: '#ef476f',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: deletingId ? 'not-allowed' : 'pointer',
                }}
              >
                {deletingId ? <AdminSpinner size={16} /> : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#12141f',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '520px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderPlus size={18} style={{ color: '#00b4d8' }} />
                Add Ingredient Category
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vegetables, Dairy, Spices, Pulses"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of this ingredient classification..."
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  style={{ ...inputStyle, backgroundColor: '#1b1d2a', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '6px',
                    backgroundColor: '#00b4d8',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: savingCategory ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingCategory ? <AdminSpinner size={16} /> : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
