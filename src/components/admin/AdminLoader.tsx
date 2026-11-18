'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Flame } from 'lucide-react';

/**
 * Standard vector spinner styled for the Admin portal theme.
 */
export function AdminSpinner({
  size = 18,
  color = 'var(--primary)',
  className = '',
  style = {},
}: {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-spin ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="2.75"
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke={color}
        strokeWidth="2.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Convenience button spinner with optional label.
 */
export function AdminButtonSpinner({
  size = 16,
  color = '#ffffff',
  label,
}: {
  size?: number;
  color?: string;
  label?: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}
    >
      <AdminSpinner size={size} color={color} />
      {label && <span>{label}</span>}
    </span>
  );
}

/**
 * Full page or layout-level loading screen matching the WhatToCook Admin theme.
 */
export function AdminPageLoader({
  title = 'WhatToCook Admin',
  subtitle = 'Loading workspace resources...',
  fullScreen = false,
}: {
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullScreen ? '100vh' : '450px',
        width: '100%',
        backgroundColor: '#0b0c13',
        color: 'var(--text-primary)',
        gap: '1.25rem',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient glow */}
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 90, 54, 0.12) 0%, rgba(0, 180, 216, 0.04) 50%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'adminPulseGlow 3s ease-in-out infinite',
        }}
      />

      {/* Rotating concentric spinner badge */}
      <div
        style={{
          position: 'relative',
          width: '74px',
          height: '74px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Outer glowing orbital ring */}
        <div
          className="animate-spin"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2.5px solid rgba(255, 255, 255, 0.08)',
            borderTopColor: 'var(--primary)',
            borderRightColor: 'var(--secondary)',
            boxShadow: '0 0 16px rgba(255, 90, 54, 0.35)',
          }}
        />

        {/* Inner brand emblem */}
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ff5a36 0%, #d9381e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 6px 18px rgba(255, 90, 54, 0.45)',
          }}
        >
          <Flame size={24} />
        </div>
      </div>

      {/* Text Info */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: '#ffffff',
            margin: '0 0 0.35rem 0',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            margin: 0,
            letterSpacing: '0.02em',
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/**
 * Dispatches an event to trigger the admin route progress bar imperatively.
 */
export function startAdminNav() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin-nav-start'));
  }
}

/**
 * Dispatches an event to complete the admin route progress bar imperatively.
 */
export function stopAdminNav() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin-nav-done'));
  }
}

/**
 * Internal route progress tracker that observes pathname and search params.
 */
function AdminRouteTracker({
  onDone,
}: {
  onDone: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onDone();
  }, [pathname, searchParams, onDone]);

  return null;
}

/**
 * Global Admin Route Progress Bar and delayed loading indicator.
 * Displays:
 * 1. A top glowing progress bar when navigating.
 * 2. A floating glass HUD pill if the route transition takes more than 180ms.
 */
export function AdminRouteProgress() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDelayedHud, setShowDelayedHud] = useState(false);

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hudTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = React.useCallback(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);

    setIsNavigating(true);
    setProgress(15);
    setShowDelayedHud(false);

    // If taking time (> 180ms), show floating HUD
    hudTimerRef.current = setTimeout(() => {
      setShowDelayedHud(true);
    }, 180);

    // Smoothly advance progress bar up to ~80%
    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 82) return prev;
        const diff = 82 - prev;
        return prev + Math.max(diff * 0.15, 2);
      });
    }, 150);
  }, []);

  const finishProgress = React.useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (hudTimerRef.current) {
      clearTimeout(hudTimerRef.current);
      hudTimerRef.current = null;
    }

    setProgress(100);
    setShowDelayedHud(false);

    const fadeTimer = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 250);

    return () => clearTimeout(fadeTimer);
  }, []);

  // Intercept click events on links targeting /admin/*
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Don't trigger for modified clicks (cmd/ctrl click, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) {
        return;
      }

      const target = (e.target as HTMLElement)?.closest('a');
      if (!target || !target.href) return;

      try {
        const url = new URL(target.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Check if internal navigation within or to /admin
        const isSameOrigin = url.origin === currentUrl.origin;
        const isAdminTarget = url.pathname.startsWith('/admin') || currentUrl.pathname.startsWith('/admin');
        const isDifferentRoute = url.pathname !== currentUrl.pathname || url.search !== currentUrl.search;

        if (isSameOrigin && isAdminTarget && isDifferentRoute && target.target !== '_blank') {
          startProgress();
        }
      } catch {
        // Ignore invalid URLs
      }
    };

    const handlePopState = () => {
      startProgress();
    };

    const handleCustomStart = () => {
      startProgress();
    };

    const handleCustomDone = () => {
      finishProgress();
    };

    document.addEventListener('click', handleDocumentClick, true);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('admin-nav-start', handleCustomStart);
    window.addEventListener('admin-nav-done', handleCustomDone);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('admin-nav-start', handleCustomStart);
      window.removeEventListener('admin-nav-done', handleCustomDone);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    };
  }, [startProgress, finishProgress]);

  return (
    <>
      <Suspense fallback={null}>
        <AdminRouteTracker onDone={finishProgress} />
      </Suspense>

      {/* Top glowing progress bar */}
      {isNavigating && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '3px',
            zIndex: 99999,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #ff5a36 0%, #ff8c42 50%, #00b4d8 100%)',
              boxShadow: '0 0 12px rgba(255, 90, 54, 0.8), 0 0 4px rgba(0, 180, 216, 0.6)',
              transition: progress === 100 ? 'width 0.15s ease, opacity 0.25s ease' : 'width 0.2s cubic-bezier(0.1, 0.05, 0.2, 1)',
              opacity: progress === 100 ? 0 : 1,
            }}
          />
        </div>
      )}

      {/* Floating HUD pill when navigation takes time (>180ms) */}
      {isNavigating && showDelayedHud && (
        <div
          style={{
            position: 'fixed',
            top: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99998,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.45rem 1rem',
            borderRadius: '24px',
            backgroundColor: 'rgba(18, 20, 31, 0.94)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 90, 54, 0.35)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 16px rgba(255, 90, 54, 0.25)',
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
            animation: 'adminPillSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <AdminSpinner size={15} color="var(--primary)" />
          <span>Loading page...</span>
        </div>
      )}
    </>
  );
}

