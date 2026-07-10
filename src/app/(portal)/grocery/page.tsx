'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface GroceryItem {
  grocery_id: number;
  ingredient_name: string;
  quantity: string;
  status: string; // 'Pending' or 'Completed'
}

export default function GroceryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom item form
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGroceryList();
    }
  }, [user]);

  const fetchGroceryList = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/grocery?user_id=${user.uid}`);
      const data = await res.json();
      if (data.success && data.groceryList) {
        setItems(data.groceryList);
      }
    } catch (err) {
      console.error('Error fetching grocery list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !itemName || !itemQty) return;
    
    setIsAdding(true);
    try {
      const res = await fetch('/api/grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          ingredient_name: itemName,
          quantity: itemQty
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems([data.item, ...items]);
        setItemName('');
        setItemQty('');
      }
    } catch (err) {
      console.error('Error adding grocery item:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStatus = async (item: GroceryItem) => {
    const newStatus = item.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      // Optimistic UI update
      setItems(items.map(i => i.grocery_id === item.grocery_id ? { ...i, status: newStatus } : i));
      
      const res = await fetch('/api/grocery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grocery_id: item.grocery_id,
          status: newStatus
        })
      });
      const data = await res.json();
      if (!data.success) {
        // Rollback on failure
        fetchGroceryList();
      }
    } catch (err) {
      console.error('Error toggling grocery status:', err);
      fetchGroceryList();
    }
  };

  const handleDeleteItem = async (groceryId: number) => {
    try {
      setItems(items.filter(i => i.grocery_id !== groceryId));
      
      await fetch(`/api/grocery?grocery_id=${groceryId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error deleting grocery item:', err);
      fetchGroceryList();
    }
  };

  const handleClearList = async () => {
    if (!user) return;
    const confirmClear = window.confirm('Are you sure you want to clear your entire grocery list?');
    if (!confirmClear) return;
    
    try {
      setItems([]);
      await fetch(`/api/grocery?user_id=${user.uid}&clear=true`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error clearing grocery list:', err);
      fetchGroceryList();
    }
  };

  // Split items into pending and completed for structured display
  const pendingItems = items.filter(i => i.status === 'Pending');
  const completedItems = items.filter(i => i.status === 'Completed');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Shopping Checklist</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage ingredient quantities and check items off during shopping.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button 
            onClick={fetchGroceryList} 
            className="btn btn-secondary"
            style={{ padding: '0.6rem 1rem' }}
          >
            <RefreshCw size={16} />
            <span>Sync</span>
          </button>
          {items.length > 0 && (
            <button 
              onClick={handleClearList} 
              className="btn btn-secondary"
              style={{ padding: '0.6rem 1rem', borderColor: 'rgba(239, 71, 111, 0.4)', color: 'var(--error)' }}
            >
              <Trash2 size={16} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Form + List */}
      <div className="grocery-layout-grid" style={{ alignItems: 'start' }}>
        
        {/* Form: Add Custom Item */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} style={{ color: 'var(--primary)' }} />
            Add Custom Item
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Need something extra that is not in the meal plans? Add it here manually.
          </p>

          <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Ingredient Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="E.g., Olive Oil, Sugar, Milk"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Quantity</label>
              <input
                type="text"
                className="form-control"
                placeholder="E.g., 1 bottle, 500g, 2 liters"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem' }}
              disabled={isAdding || !itemName || !itemQty}
            >
              <Sparkles size={14} />
              {isAdding ? 'Adding...' : 'Add To List'}
            </button>
          </form>
        </div>

        {/* Checklist View */}
        <div className="card" style={{ minHeight: '320px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} style={{ color: 'var(--secondary)' }} />
            Shopping List ({items.length})
          </h2>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading shopping checklist...
            </div>
          ) : items.length === 0 ? (
            <div style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span>Your shopping list is empty.</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Go to the Meal Planner or Recommendations page to schedule meals and generate list items automatically.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Pending Section */}
              {pendingItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pending Items ({pendingItems.length})
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {pendingItems.map(item => (
                      <div key={item.grocery_id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.8rem 1rem',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        transition: 'var(--transition-fast)'
                      }}>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1 }}
                          onClick={() => handleToggleStatus(item)}
                        >
                          <Square size={18} style={{ color: 'var(--text-muted)' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.ingredient_name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.quantity}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteItem(item.grocery_id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Section */}
              {completedItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: pendingItems.length > 0 ? '1px solid var(--border-color)' : 'none', paddingTop: pendingItems.length > 0 ? '1.5rem' : '0' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Completed Items ({completedItems.length})
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {completedItems.map(item => (
                      <div key={item.grocery_id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.8rem 1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        opacity: 0.6
                      }}>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1 }}
                          onClick={() => handleToggleStatus(item)}
                        >
                          <CheckSquare size={18} style={{ color: 'var(--success)' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', textDecoration: 'line-through' }}>
                            <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{item.ingredient_name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.quantity}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteItem(item.grocery_id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
