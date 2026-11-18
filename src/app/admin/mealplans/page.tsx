'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminSpinner } from '@/components/admin/AdminLoader';
import {
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Utensils,
  Clock,
  Sparkles,
} from 'lucide-react';

interface MealPlanItem {
  id: string;
  mealType: string;
  mealDate: string;
  servings?: number | null;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  recipe: {
    id: string;
    name: string;
  };
}

interface SummaryData {
  byMealType: Array<{ mealType: string; count: number }>;
  totalThisWeek: number;
}

export default function MealPlansPage() {
  const [plans, setPlans] = useState<MealPlanItem[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [mealTypeFilter, setMealTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPlans = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        limit: rowsPerPage.toString(),
        offset: ((currentPage - 1) * rowsPerPage).toString(),
        mealType: mealTypeFilter,
        dateFrom,
        dateTo,
      });

      const res = await fetch(`/api/admin/mealplans?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setPlans(data.plans || []);
        setTotal(data.total || 0);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Error fetching meal plans:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rowsPerPage, currentPage, mealTypeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const clearFilters = () => {
    setMealTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const getMealTypeBadge = (type: string) => {
    let color = 'var(--text-secondary)';
    let bg = 'rgba(255, 255, 255, 0.05)';

    switch (type.toUpperCase()) {
      case 'BREAKFAST':
        color = '#ffd166';
        bg = 'rgba(255, 209, 102, 0.12)';
        break;
      case 'LUNCH':
        color = '#06d6a0';
        bg = 'rgba(6, 214, 160, 0.12)';
        break;
      case 'DINNER':
        color = '#00b4d8';
        bg = 'rgba(0, 180, 216, 0.12)';
        break;
      case 'SNACK':
        color = 'var(--primary)';
        bg = 'rgba(255, 90, 54, 0.12)';
        break;
    }

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 700,
          color,
          backgroundColor: bg,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        {type}
      </span>
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const startRow = total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, total);

  // Extract count per meal type
  const getMealTypeCount = (type: string) => {
    return summary?.byMealType.find((b) => b.mealType.toUpperCase() === type.toUpperCase())?.count || 0;
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Meal Plans
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            User meal schedules and planning insights
          </div>
        </div>

        <button
          onClick={() => fetchPlans(true)}
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
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#12141c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Plans</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.35rem' }}>
            {total}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#12141c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>This Week</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--secondary)', marginTop: '0.35rem' }}>
            {summary?.totalThisWeek ?? 0}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#12141c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Breakfast</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffd166', marginTop: '0.35rem' }}>
            {getMealTypeCount('BREAKFAST')}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#12141c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Lunch</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#06d6a0', marginTop: '0.35rem' }}>
            {getMealTypeCount('LUNCH')}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#12141c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Dinner</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#00b4d8', marginTop: '0.35rem' }}>
            {getMealTypeCount('DINNER')}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: '#12141c',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filters:</span>
        </div>

        {/* Meal type selector */}
        <select
          value={mealTypeFilter}
          onChange={(e) => {
            setMealTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '0.45rem 0.75rem',
            borderRadius: '6px',
            backgroundColor: '#0a0b12',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#fff',
            fontSize: '0.82rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">All Meal Types</option>
          <option value="BREAKFAST">Breakfast</option>
          <option value="LUNCH">Lunch</option>
          <option value="DINNER">Dinner</option>
          <option value="SNACK">Snack</option>
        </select>

        {/* Date From */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: '#0a0b12',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#fff',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Date To */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: '#0a0b12',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#fff',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          />
        </div>

        {(mealTypeFilter || dateFrom || dateTo) && (
          <button
            onClick={clearFilters}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: '#161924',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Card */}
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
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>User</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recipe</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Meal Type</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Planned Date</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Servings</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center' }}>
                    <AdminSpinner size={24} />
                    <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading meal plans...</div>
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Calendar size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                    <div>No meal plans found</div>
                  </td>
                </tr>
              ) : (
                plans.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ color: '#fff', fontWeight: 500 }}>{item.user.fullName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.user.email}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#fff' }}>
                      {item.recipe.name}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {getMealTypeBadge(item.mealType)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {new Date(item.mealDate).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {item.servings ? `${item.servings} people` : '—'}
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
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
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
    </div>
  );
}
