'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrentUserRole } from '@/hooks/useAdminAuth';
import { AdminSpinner } from '@/components/admin/AdminLoader';
import {
  Users,
  ChefHat,
  Calendar,
  Shield,
  TrendingUp,
  Activity,
  Plus,
  Users2,
  Star,
  Tag
} from 'lucide-react';

interface StatsSummary {
  totalUsers: number;
  totalRecipes: number;
  totalMealPlans: number;
  totalAdmins: number;
  totalReviews?: number;
  weeklyMealPlans?: number;
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

export default function AdminDashboardPage() {
  const { session } = useCurrentUserRole();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.stats) {
          setStats(data.stats);
        }
      })
      .catch((err: unknown) => {
        console.error('Error fetching admin stats:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Banner */}
      <div style={{
        backgroundColor: '#12141f',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: '0 0 0.25rem 0' }}>
            Welcome, {session?.user?.name || 'Admin'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Overview of users, recipes, and meal plans.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link
            href="/admin/recipes"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Plus size={15} />
            <span>Add Recipe</span>
          </Link>

          <Link
            href="/admin/admins"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#1a1d2b',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <Users2 size={15} style={{ color: 'var(--text-secondary)' }} />
            <span>Staff</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}>
        {/* Users */}
        <div style={{
          backgroundColor: '#12141f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 90, 54, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            flexShrink: 0,
          }}>
            <Users size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Users
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.15rem' }}>
              {loading ? <AdminSpinner size={18} color="var(--primary)" /> : (stats?.summary.totalUsers ?? 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Recipes */}
        <div style={{
          backgroundColor: '#12141f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 180, 216, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--secondary)',
            flexShrink: 0,
          }}>
            <ChefHat size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Recipes
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.15rem' }}>
              {loading ? <AdminSpinner size={18} color="var(--secondary)" /> : (stats?.summary.totalRecipes ?? 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Meal Plans */}
        <div style={{
          backgroundColor: '#12141f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: 'rgba(6, 214, 160, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--success)',
            flexShrink: 0,
          }}>
            <Calendar size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Meal Plans
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.15rem' }}>
              {loading ? <AdminSpinner size={18} color="var(--success)" /> : (stats?.summary.totalMealPlans ?? 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Admins */}
        <div style={{
          backgroundColor: '#12141f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 209, 102, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--warning)',
            flexShrink: 0,
          }}>
            <Shield size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Staff
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.15rem' }}>
              {loading ? <AdminSpinner size={18} color="var(--warning)" /> : (stats?.summary.totalAdmins ?? 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div style={{
          backgroundColor: '#12141f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 71, 111, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef476f',
            flexShrink: 0,
          }}>
            <Star size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Reviews
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.15rem' }}>
              {loading ? <AdminSpinner size={18} color="#ef476f" /> : (stats?.summary.totalReviews ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Popular Recipes */}
        <div style={{
          backgroundColor: '#12141f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem',
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} style={{ color: 'var(--secondary)' }} />
            Popular Recipes
          </h2>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
              <AdminSpinner size={18} color="var(--primary)" />
            </div>
          ) : !stats || stats.popularRecipes.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '1rem 0' }}>No recipes scheduled yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stats.popularRecipes.map((r, idx) => (
                <div
                  key={r.recipe_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: '#171a27',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {idx + 1}. {r.recipe_name}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-secondary)',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                    marginLeft: '0.5rem',
                  }}>
                    {r.plan_count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Ingredients */}
        <div style={{
          backgroundColor: '#12141f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem',
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} style={{ color: 'var(--success)' }} />
            Top Ingredients
          </h2>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
              <AdminSpinner size={18} color="var(--success)" />
            </div>
          ) : !stats || stats.popularIngredients.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '1rem 0' }}>No ingredient data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stats.popularIngredients.map((ing, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: '#171a27',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ fontWeight: 500, color: '#fff' }}>
                    {ing.ingredient_name}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-secondary)',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                    marginLeft: '0.5rem',
                  }}>
                    {ing.recipe_count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div style={{
          backgroundColor: '#12141f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem',
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} style={{ color: 'var(--warning)' }} />
            Recent Users
          </h2>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
              <AdminSpinner size={18} color="var(--warning)" />
            </div>
          ) : !stats || stats.recentUsers.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '1rem 0' }}>No users yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stats.recentUsers.map((u) => (
                <div
                  key={u.user_id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: '#171a27',
                    gap: '0.15rem',
                  }}
                >
                  <span style={{ fontWeight: 500, color: '#fff', fontSize: '0.82rem' }}>
                    {u.full_name || 'User'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {u.email}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
