'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ChefHat, Calendar, ShoppingBag, ArrowRight, UtensilsCrossed } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-secondary)'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 80% 20%, rgba(255, 90, 54, 0.07) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(0, 180, 216, 0.05) 0%, transparent 50%), var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Blur Orbs */}
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255, 90, 54, 0.1)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(0, 180, 216, 0.07)', filter: 'blur(70px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem', zIndex: 10 }}>
        
        {/* Brand Icon */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #ff7a45 100%)',
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 6px 15px var(--primary-glow)',
          animation: 'float 4s ease-in-out infinite'
        }}>
          <UtensilsCrossed size={32} />
        </div>

        {/* Title & Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Academic Project Submission (VGU CDOE 2025-26)
          </span>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, background: 'linear-gradient(135deg, #fff 0%, var(--text-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Smart "What to Cook"<br/>Recommendation System
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            An intelligent food recommendation solution that matches available ingredients, respects dietary preferences, schedules weekly meals, and auto-compiles shopping lists to reduce waste.
          </p>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/login" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.05rem' }}>
            <span>Sign In to System</span>
            <ArrowRight size={18} />
          </Link>
          <Link href="/register" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.05rem' }}>
            <span>Create Account</span>
          </Link>
        </div>

        {/* Core Features Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', width: '100%', marginTop: '2rem' }}>
          <div className="card card-glass" style={{ padding: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ color: 'var(--primary)' }}><ChefHat size={24} /></div>
            <h3 style={{ fontSize: '1.1rem' }}>Ingredient Matcher</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Calculates matching recipe lists based on items in your cupboard to minimize food waste.
            </p>
          </div>

          <div className="card card-glass" style={{ padding: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ color: 'var(--secondary)' }}><Calendar size={24} /></div>
            <h3 style={{ fontSize: '1.1rem' }}>Weekly Planner</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Schedule meals in a calendar grid (breakfast, lunch, dinner) aligned to dietary preferences.
            </p>
          </div>

          <div className="card card-glass" style={{ padding: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ color: 'var(--success)' }}><ShoppingBag size={24} /></div>
            <h3 style={{ fontSize: '1.1rem' }}>Auto Grocery List</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Generates shopping lists from scheduled recipes, checking off items during shopping trips.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
