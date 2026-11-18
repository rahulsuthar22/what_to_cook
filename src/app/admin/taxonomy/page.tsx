'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import { AdminSpinner } from '@/components/admin/AdminLoader';

interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  recipeCount: number;
}

type TabType = 'categories' | 'cuisines' | 'tags' | 'diets';

const TAB_LABELS: Record<TabType, string> = {
  categories: 'Categories',
  cuisines: 'Cuisines',
  tags: 'Tags',
  diets: 'Diets',
};

export default function TaxonomyPage() {
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/taxonomy?type=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items ?? []);
      } else {
        showToast(data.error || 'Failed to fetch items', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchItems();
    setNewName('');
    setNewDescription('');
  }, [fetchItems]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddingItem(true);
    try {
      const res = await fetch('/api/admin/taxonomy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, name: newName.trim(), description: newDescription.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewName('');
        setNewDescription('');
        showToast('Added successfully', 'success');
        fetchItems();
      } else {
        showToast(data.error || 'Failed to add', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setAddingItem(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      const res = await fetch(`/api/admin/taxonomy?type=${activeTab}&id=${confirmDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Deleted', 'success');
        fetchItems();
      } else {
        showToast(data.error || 'Failed to delete', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleToggleActive = async (item: TaxonomyItem) => {
    try {
      const res = await fetch(`/api/admin/taxonomy?type=${activeTab}&id=${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        fetchItems();
      } else {
        showToast(data.error || 'Failed to update', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const singularLabel = (tab: TabType) => TAB_LABELS[tab].slice(0, -1);

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100vh', background: '#0f111a' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>Taxonomy</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage recipe classification
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              background: activeTab === tab ? 'var(--primary)' : '#12141c',
              color: activeTab === tab ? '#fff' : 'var(--text-muted)',
              outline: activeTab === tab ? 'none' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Add Form Card */}
      <div
        style={{
          background: '#12141c',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '1rem',
        }}
      >
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder={`${singularLabel(activeTab)} name`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            style={{
              flex: '1 1 180px',
              padding: '0.55rem 0.9rem',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#0a0b12',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            style={{
              flex: '2 1 240px',
              padding: '0.55rem 0.9rem',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#0a0b12',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={addingItem || !newName.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.2rem',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: addingItem || !newName.trim() ? 'not-allowed' : 'pointer',
              opacity: addingItem || !newName.trim() ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {addingItem ? (
              <AdminSpinner size={16} />
            ) : (
              <Plus size={16} />
            )}
            Add {singularLabel(activeTab)}
          </button>
        </form>
      </div>

      {/* Items List Card */}
      <div
        style={{
          background: '#12141c',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
            <AdminSpinner size={36} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            No {activeTab} found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Name', 'Slug', 'Recipes', 'Status', 'Added', 'Actions'].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    {/* Name */}
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#fff' }}>
                      {item.name}
                    </td>
                    {/* Slug */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {item.slug}
                      </span>
                    </td>
                    {/* Recipe Count */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          background: 'rgba(0,180,216,0.12)',
                          color: 'var(--secondary)',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}
                      >
                        {item.recipeCount}
                      </span>
                    </td>
                    {/* Status */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '999px',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          background: item.isActive ? 'rgba(6,214,160,0.12)' : 'rgba(255,255,255,0.07)',
                          color: item.isActive ? '#06d6a0' : 'var(--text-muted)',
                        }}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Added Date */}
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Toggle Active */}
                        <button
                          onClick={() => handleToggleActive(item)}
                          title={item.isActive ? 'Deactivate' : 'Activate'}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '5px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'transparent',
                            color: item.isActive ? '#06d6a0' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            transition: 'all 0.15s',
                          }}
                        >
                          {item.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          {item.isActive ? 'Active' : 'Inactive'}
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setConfirmDelete({ id: item.id, name: item.name })}
                          disabled={deletingId === item.id}
                          title="Delete"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.35rem',
                            borderRadius: '5px',
                            border: '1px solid rgba(239,71,111,0.25)',
                            background: 'rgba(239,71,111,0.08)',
                            color: '#ef476f',
                            cursor: deletingId === item.id ? 'not-allowed' : 'pointer',
                            opacity: deletingId === item.id ? 0.5 : 1,
                            transition: 'all 0.15s',
                          }}
                        >
                          {deletingId === item.id ? <AdminSpinner size={14} /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{
              background: '#12141c',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '420px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.75rem', color: '#fff', fontSize: '1.1rem' }}>Confirm Delete</h3>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Delete <strong style={{ color: '#fff' }}>{confirmDelete.name}</strong>? This may affect recipes using
              this {singularLabel(activeTab).toLowerCase()}.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: '0.55rem 1.2rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deletingId}
                style={{
                  padding: '0.55rem 1.2rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#ef476f',
                  color: '#fff',
                  cursor: deletingId ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  opacity: deletingId ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {deletingId ? <AdminSpinner size={14} /> : <Trash2 size={14} />}
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
            zIndex: 2000,
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            background: toast.type === 'success' ? '#06d6a0' : '#ef476f',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
