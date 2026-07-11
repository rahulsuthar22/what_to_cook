'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Calendar, 
  Trash2, 
  Plus, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Sparkles,
  Utensils
} from 'lucide-react';
import Link from 'next/link';

interface ScheduledMeal {
  meal_plan_id: number;
  meal_type: string;
  meal_date: string;
  recipe_id: number;
  recipe_name: string;
  cooking_time: number;
  calories: number;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function PlannerPage() {
  const { user } = useAuth();
  const [mealPlans, setMealPlans] = useState<ScheduledMeal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date tracking: defaults to current week starting Monday
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Grocery generation date range
  const [genStartDate, setGenStartDate] = useState('');
  const [genEndDate, setGenEndDate] = useState('');
  const [genSuccessMsg, setGenSuccessMsg] = useState('');
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMealPlans();
      setupDefaultGeneratorDates();
    }
  }, [user, currentDate]);

  const setupDefaultGeneratorDates = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 6);
    
    setGenStartDate(today.toISOString().split('T')[0]);
    setGenEndDate(nextWeek.toISOString().split('T')[0]);
  };

  // Get date object for each day of the current week (Mon-Sun)
  const getWeekDates = () => {
    const dates = [];
    const tempDate = new Date(currentDate);
    // Find Monday of the current week
    const day = tempDate.getDay();
    const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1);
    tempDate.setDate(diff);

    for (let i = 0; i < 7; i++) {
      dates.push(new Date(tempDate));
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const startOfWeek = weekDates[0];
  const endOfWeek = weekDates[6];

  const fetchMealPlans = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const startStr = startOfWeek.toISOString().split('T')[0];
      const endStr = endOfWeek.toISOString().split('T')[0];
      const res = await fetch(`/api/planner?user_id=${user.uid}&start_date=${startStr}&end_date=${endStr}`);
      const data = await res.json();
      if (data.success && data.mealPlans) {
        setMealPlans(data.mealPlans);
      }
    } catch (err) {
      console.error('Error fetching meal plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async (mealPlanId: number) => {
    try {
      const res = await fetch(`/api/planner?meal_plan_id=${mealPlanId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMealPlans(mealPlans.filter(item => item.meal_plan_id !== mealPlanId));
      }
    } catch (err) {
      console.error('Error deleting meal plan:', err);
    }
  };

  const handleGenerateGrocery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !genStartDate || !genEndDate) return;
    
    setGenLoading(true);
    setGenSuccessMsg('');
    try {
      const res = await fetch('/api/grocery/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          start_date: genStartDate,
          end_date: genEndDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setGenSuccessMsg(data.message || 'Grocery list updated successfully!');
      }
    } catch (err) {
      console.error('Error generating grocery:', err);
    } finally {
      setGenLoading(false);
    }
  };

  const navigateWeek = (weeks: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + weeks * 7);
    setCurrentDate(newDate);
  };

  // Helper to find meal scheduled for specific day/type
  const findScheduledMeal = (date: Date, type: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return mealPlans.find(meal => {
      const mealDateStr = new Date(meal.meal_date).toISOString().split('T')[0];
      return mealDateStr === dateStr && meal.meal_type === type;
    });
  };

  const weekRangeLabel = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title & Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Weekly Meal Planner</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Schedule recipes for breakfast, lunch, and dinner to stay organized.
          </p>
        </div>

        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', backgroundColor: 'var(--bg-surface)', padding: '0.5rem 1rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => navigateWeek(-1)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: '0.95rem', minWidth: '160px', textAlign: 'center' }}>
            {weekRangeLabel}
          </span>
          <button 
            onClick={() => navigateWeek(1)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Main Grid: Days vs Meal Types */}
      <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-color)', textAlign: 'left', width: '150px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                Day
              </th>
              {MEAL_TYPES.map(type => (
                <th key={type} style={{ padding: '1rem', borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  {type}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekDates.map((date, idx) => {
              const dayName = WEEKDAYS[idx];
              const isToday = new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];
              
              return (
                <tr key={dayName} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isToday ? 'rgba(255, 90, 54, 0.02)' : 'transparent' }}>
                  {/* Day Header Column */}
                  <td style={{ padding: '1.25rem 1rem', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: isToday ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {dayName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </td>

                  {/* Meal Slot Columns */}
                  {MEAL_TYPES.map(type => {
                    const meal = findScheduledMeal(date, type);
                    return (
                      <td key={type} style={{ padding: '1rem', verticalAlign: 'top', width: '22%' }}>
                        {meal ? (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            position: 'relative'
                          }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', paddingRight: '1.5rem', lineHeight: 1.2 }}>
                              {meal.recipe_name}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                <Clock size={10} />
                                <span>{meal.cooking_time}m</span>
                              </div>
                              <span className="badge badge-secondary" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>
                                {meal.calories} kcal
                              </span>
                            </div>
                            
                            <button
                              onClick={() => handleDeleteMeal(meal.meal_plan_id)}
                              style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ) : (
                          <Link href="/recommendations" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            padding: '1rem 0.5rem',
                            border: '1px dashed var(--border-color)',
                            borderRadius: '8px',
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                            transition: 'var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.color = 'var(--primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.color = 'var(--text-muted)';
                          }}
                          >
                            <Plus size={12} />
                            <span>Schedule</span>
                          </Link>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Auto Grocery Generation Section */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', padding: '2.5rem' }}>
        
        {/* Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} style={{ color: 'var(--primary)' }} />
            Generate Grocery List
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Ready to shop? Define a date range, and we will pull all required ingredients from your scheduled meals. Any ingredients already on your list are safely skipped.
          </p>
        </div>

        {/* Form Column */}
        <form onSubmit={handleGenerateGrocery} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center' }}>
          {genSuccessMsg && (
            <div style={{
              backgroundColor: 'rgba(6, 214, 160, 0.1)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              padding: '0.8rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              textAlign: 'center'
            }}>
              {genSuccessMsg}{' '}
              <Link href="/grocery" style={{ fontWeight: 700, textDecoration: 'underline', color: 'var(--success)' }}>
                View Grocery List &rarr;
              </Link>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={genStartDate}
                onChange={(e) => setGenStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={genEndDate}
                onChange={(e) => setGenEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success"
            style={{ width: '100%', padding: '0.9rem' }}
            disabled={genLoading || !genStartDate || !genEndDate}
          >
            <Sparkles size={16} />
            {genLoading ? 'Analyzing recipes...' : 'Compile Shopping List'}
          </button>
        </form>
      </div>

    </div>
  );
}
