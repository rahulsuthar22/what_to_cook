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
} from 'lucide-react';

interface IngredientItem {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  recipeCount: number;
  allergenCount: number;
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'newest' | 'oldest'>('name');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Add form
  const [addName, setAddName] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState<IngredientItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

        const res = await fetch(`/api/admin/ingredients?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          setIngredients(data.ingredients || []);
          setTotal(data.total || 0);
        } else {
          showToast(data.error || 'Failed to load ingredients', 'error');
        }
      } catch {
        showToast('Network error', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, sortBy, rowsPerPage, currentPage]
  );

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/admin/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`"${data.ingredient.name}" added`);
        setAddName('');
        fetchIngredients(true);
      } else {
        showToast(data.error || 'Failed to add ingredient', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editName.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/ingredients?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Updated');
        setEditingId(null);
        setEditName('');
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

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      const res = await fetch(`/api/admin/ingredients?id=${confirmDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`"${confirmDelete.name}" deleted`);
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

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const startRow = total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, total);

  const inputStyle: React.CSSProperties = {
    padding: '0.45rem 0.75rem',
    borderRadius: '6px',
    backgroundColor: '#0a0b12',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Ingredients
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Global ingredient library — used across all recipes
          </div>
        </div>

        <button
          onClick={() => fetchIngredients(true)}
          disabled={refreshing || loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 0.85rem',
            borderRadius: '6px',
            backgroundColor: '#161924',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            cursor: refreshing ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={14} style={{ transition: 'transform 0.3s' }} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          backgroundColor: '#12141c',
          padding: '0.85rem 1rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="Ingredient name, e.g. Saffron"
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          style={{ ...inputStyle, flex: '1', minWidth: '220px' }}
        />
        <button
          type="submit"
          disabled={adding || !addName.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 1rem',
            borderRadius: '6px',
            backgroundColor: 'var(--primary)',
            border: 'none',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: adding || !addName.trim() ? 'not-allowed' : 'pointer',
            opacity: adding || !addName.trim() ? 0.65 : 1,
          }}
        >
          {adding ? <AdminSpinner size={14} color="#fff" /> : <Plus size={14} />}
          Add Ingredient
        </button>
      </form>

      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              ...inputStyle,
              width: '100%',
              paddingLeft: '2.2rem',
            }}
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as any);
            setCurrentPage(1);
          }}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="name">A → Z</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#12141c',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#0f111a' }}>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Slug</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recipes</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Allergens</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Added</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center' }}>
                    <AdminSpinner size={24} />
                    <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Loading ingredients...
                    </div>
                  </td>
                </tr>
              ) : ingredients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Package size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                    <div>{searchQuery ? 'No ingredients match your search' : 'No ingredients yet'}</div>
                  </td>
                </tr>
              ) : (
                ingredients.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
                  >
                    <td style={{ padding: '0.65rem 1rem', color: '#fff', fontWeight: 600 }}>
                      {editingId === item.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave(item.id);
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setEditName('');
                            }
                          }}
                          style={{
                            ...inputStyle,
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            width: '180px',
                          }}
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <code
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          backgroundColor: '#0a0b12',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                        }}
                      >
                        {item.slug}
                      </code>
                    </td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: item.recipeCount > 0 ? 'var(--secondary)' : 'var(--text-muted)',
                          backgroundColor:
                            item.recipeCount > 0 ? 'rgba(0, 180, 216, 0.1)' : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        {item.recipeCount}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {item.allergenCount > 0 ? (
                        <span style={{ color: '#ffd166' }}>{item.allergenCount}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        {editingId === item.id ? (
                          <>
                            <button
                              onClick={() => handleEditSave(item.id)}
                              disabled={savingEdit}
                              title="Save"
                              style={{
                                padding: '0.3rem 0.5rem',
                                borderRadius: '5px',
                                backgroundColor: 'rgba(6, 214, 160, 0.1)',
                                border: '1px solid rgba(6, 214, 160, 0.3)',
                                color: 'var(--success)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                            >
                              {savingEdit ? <AdminSpinner size={12} color="var(--success)" /> : <Check size={13} />}
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditName(''); }}
                              title="Cancel"
                              style={{
                                padding: '0.3rem 0.5rem',
                                borderRadius: '5px',
                                backgroundColor: '#161924',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                              }}
                            >
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingId(item.id); setEditName(item.name); }}
                              title="Edit"
                              style={{
                                padding: '0.3rem 0.5rem',
                                borderRadius: '5px',
                                backgroundColor: '#161924',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                              }}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(item)}
                              title="Delete"
                              style={{
                                padding: '0.3rem 0.5rem',
                                borderRadius: '5px',
                                backgroundColor: '#161924',
                                border: '1px solid rgba(239, 71, 111, 0.2)',
                                color: '#ef476f',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#0f111a',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            Showing {startRow}–{endRow} of {total}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Rows:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setCurrentPage(1); }}
                style={{
                  backgroundColor: '#161924',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.75rem',
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <button
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => p - 1)}
                style={{
                  padding: '0.25rem 0.4rem',
                  borderRadius: '4px',
                  backgroundColor: '#161924',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: currentPage <= 1 ? 'var(--text-muted)' : '#fff',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{
                  padding: '0.25rem 0.4rem',
                  borderRadius: '4px',
                  backgroundColor: '#161924',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: currentPage >= totalPages ? 'var(--text-muted)' : '#fff',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#12141c',
              border: '1px solid rgba(239, 71, 111, 0.3)',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '420px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 71, 111, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef476f',
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                Delete Ingredient
              </h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Delete <strong style={{ color: '#fff' }}>{confirmDelete.name}</strong>?
              {confirmDelete.recipeCount > 0 ? (
                <span style={{ color: '#ffd166', display: 'block', marginTop: '0.4rem' }}>
                  ⚠ Used in {confirmDelete.recipeCount} recipe{confirmDelete.recipeCount === 1 ? '' : 's'} — deletion will be blocked.
                </span>
              ) : (
                ' This action cannot be undone.'
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                disabled={Boolean(deletingId)}
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  backgroundColor: '#161924',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                disabled={Boolean(deletingId)}
                onClick={handleDelete}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  backgroundColor: '#ef476f',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: deletingId ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {deletingId ? <AdminSpinner size={14} color="#fff" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '6px',
            backgroundColor: toast.type === 'error' ? '#ef476f' : 'var(--success)',
            color: '#fff',
            fontWeight: 500,
            fontSize: '0.85rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 100,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
