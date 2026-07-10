'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSession } from 'next-auth/react';
import { 
  ChefHat, 
  Calendar, 
  ShoppingBag, 
  UtensilsCrossed, 
  TrendingUp, 
  Plus,
  Clock,
  ShieldAlert
} from 'lucide-react';

interface MealPlan {
  meal_plan_id: number;
  meal_type: string;
  meal_date: string;
  recipe_name: string;
  cooking_time: number;
  image_url?: string;
  calories: number;
}

export default function DashboardPage() {
  const { user, updatePreference } = useAuth();
  const { data: session } = useSession();
  const [todayMeals, setTodayMeals] = useState<MealPlan[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [selectedPreference, setSelectedPreference] = useState(user?.dietary_preference || 'None');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const isAdmin = (session?.user as any)?.role === 'Admin' || (session?.user as any)?.role === 'SuperAdmin';
  const roleName = (session?.user as any)?.role || 'User';

  useEffect(() => {
    if (user) {
      setSelectedPreference(user.dietary_preference || 'None');
      fetchTodayMeals();
    }
  }, [user]);

  const fetchTodayMeals = async () => {
    if (!user) return;
    setLoadingMeals(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/planner?user_id=${user.uid}&start_date=${todayStr}&end_date=${todayStr}`);
      const data = await res.json();
      if (data.success && data.mealPlans) {
        setTodayMeals(data.mealPlans);
      }
    } catch (err) {
      console.error('Error fetching today\'s meals:', err);
    } finally {
      setLoadingMeals(false);
    }
  };

  const handlePreferenceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedPreference(value);
    setUpdateSuccess(false);
    const success = await updatePreference(value);
    if (success) {
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    }
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 90, 54, 0.2) 0%, rgba(0, 180, 216, 0.05) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '2.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.05em' }}>
            {todayDateString}
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            Hello, {user?.displayName}!
            {isAdmin && (
              <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                {roleName}
              </span>
            )}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Ready to cook something amazing today? Enter your ingredients or schedule your next meal plan.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isAdmin && (
            <Link href="/admin" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} />
              <span>Admin Portal</span>
            </Link>
          )}
          <Link href="/recommendations" className="btn btn-primary">
            <ChefHat size={18} />
            <span>What to Cook?</span>
          </Link>
        </div>
      </div>

      {/* Grid Modules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* Card 1: Recommendations */}
        <div className="card card-primary-indicator" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(255, 90, 54, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <ChefHat size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem' }}>Smart Recommendation</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flexGrow: 1 }}>
            Input ingredients available at home, and our recommendation engine will find recipes to prevent food waste.
          </p>
          <Link href="/recommendations" style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            Enter ingredients &rarr;
          </Link>
        </div>

        {/* Card 2: Meal Planner */}
        <div className="card card-primary-indicator" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(0, 180, 216, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
            <Calendar size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem' }}>Weekly Planner</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flexGrow: 1 }}>
            Plan breakfast, lunch, and dinner, to track your diet and manage ingredients before you grocery shop.
          </p>
          <Link href="/planner" style={{ color: 'var(--secondary)', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            Open calendar &rarr;
          </Link>
        </div>

        {/* Card 3: Grocery List */}
        <div className="card card-primary-indicator" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(6, 214, 160, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
            <ShoppingBag size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem' }}>Shopping Checklist</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flexGrow: 1 }}>
            Automatically extract required items from scheduled meals and cross them off during your store visit.
          </p>
          <Link href="/grocery" style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            View grocery list &rarr;
          </Link>
        </div>

        {/* Card 4: Admin Controls */}
        {isAdmin && (
          <div className="card card-primary-indicator" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeftColor: 'var(--primary)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(255, 90, 54, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <ShieldAlert size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem' }}>Admin Control Center</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flexGrow: 1 }}>
              Manage ingredients list, upload new recipes, and track usage trends & recent signups.
            </p>
            <Link href="/admin" style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              Open dashboard &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="dashboard-bottom-grid" style={{ alignItems: 'start' }}>
        
        {/* Today's Meals */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <UtensilsCrossed size={20} style={{ color: 'var(--primary)' }} />
              Today's Meals
            </h2>
            <Link href="/planner" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <Plus size={14} />
              <span>Add Meal</span>
            </Link>
          </div>

          {loadingMeals ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading today's schedule...
            </div>
          ) : todayMeals.length === 0 ? (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span>No meals scheduled for today.</span>
              <Link href="/planner" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                Schedule breakfast, lunch or dinner now
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {todayMeals.map((meal) => (
                <div key={meal.meal_plan_id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span className="badge badge-primary" style={{ alignSelf: 'start', fontSize: '0.65rem' }}>
                      {meal.meal_type}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {meal.recipe_name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={14} />
                      <span>{meal.cooking_time} mins</span>
                    </div>
                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                      {meal.calories} kcal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dietary Settings */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--secondary)' }} />
            Quick Settings
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Adjust your meal suggestion filter. Recipes will be aligned to your selection.
          </p>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Dietary Preference</label>
            <select
              className="form-control"
              value={selectedPreference}
              onChange={handlePreferenceChange}
              style={{ width: '100%' }}
            >
              <option value="None">None</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Healthy">Healthy</option>
              <option value="Gluten-Free">Gluten-Free</option>
            </select>
          </div>

          {updateSuccess && (
            <div style={{
              backgroundColor: 'rgba(6, 214, 160, 0.1)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              padding: '0.5rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              textAlign: 'center'
            }}>
              Preference updated successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
