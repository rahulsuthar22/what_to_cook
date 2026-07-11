'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Calendar, 
  ChefHat, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  RotateCcw,
  RotateCw,
  Send, 
  X, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface Recipe {
  recipe_id: number;
  recipe_name: string;
  category: string;
  cooking_time: number;
  difficulty_level: string;
  image_url: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  video_url: string;
}

interface Comment {
  id: number;
  user: string;
  text: string;
  time: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

export default function FoodReelsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showVolumeBadge, setShowVolumeBadge] = useState(false);
  const [likedReels, setLikedReels] = useState<Record<number, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<number, number>>({});
  const [showComments, setShowComments] = useState(false);
  const [activeCommentsRecipeId, setActiveCommentsRecipeId] = useState<number | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  
  // YouTube API Player states
  const [isPlaying, setIsPlaying] = useState<Record<number, boolean>>({});
  const [currentTime, setCurrentTime] = useState<Record<number, number>>({});
  const [duration, setDuration] = useState<Record<number, number>>({});

  // Overlay HUD visibility controls
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [hoveredReelId, setHoveredReelId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const resetOverlayTimer = () => {
    if (isMobile) {
      setOverlayVisible(true);
      return;
    }
    setOverlayVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setOverlayVisible(false);
    }, 3000); // Auto-hide details after 3 seconds of inactivity
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const playersRef = useRef<Record<number, any>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Comments database stored in memory
  const [commentsDb, setCommentsDb] = useState<Record<number, Comment[]>>({
    1: [
      { id: 1, user: 'Aarav Patel', text: 'This looks so rich and creamy! Preparing it tonight.', time: '2h ago' },
      { id: 2, user: 'Neha Sharma', text: 'I replaced butter with ghee, tasted absolutely divine!', time: '4h ago' },
      { id: 3, user: 'David K.', text: 'Perfect instructions, came out restaurant style.', time: '1d ago' }
    ],
    2: [
      { id: 1, user: 'Chef Jordan', text: 'Pro tip: Make sure the rice is cold before tossing it!', time: '3h ago' },
      { id: 2, user: 'Priya R.', text: 'Fast, healthy, and my kids absolutely loved it.', time: '10h ago' }
    ],
    3: [
      { id: 1, user: 'Sanya Gupta', text: 'So soothing for rainy days. Super easy too!', time: '12h ago' }
    ],
    4: [
      { id: 1, user: 'Rahul Suthar', text: 'Crispy cumin potatoes, pairs beautifully with paratha.', time: '5h ago' }
    ],
    5: [
      { id: 1, user: 'Elena Rostova', text: 'Elena here: Love the heavy garlic punch in this spinach!', time: '2d ago' }
    ]
  });

  // Planner popup state
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [plannerRecipeId, setPlannerRecipeId] = useState<number | null>(null);
  const [plannerDate, setPlannerDate] = useState('');
  const [plannerType, setPlannerType] = useState('Lunch');
  const [plannerSuccess, setPlannerSuccess] = useState(false);

  // Copy share link alert
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  // Parse Video ID from YouTube URLs
  const getYoutubeVideoId = (url: string) => {
    try {
      let videoId = 'w77zP6-oXgI';
      if (url.includes('embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0] || videoId;
      } else if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0] || videoId;
      }
      return videoId;
    } catch (e) {
      return 'w77zP6-oXgI';
    }
  };

  // Fetch Recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch('/api/recipes');
        const data = await res.json();
        if (data.success) {
          const list: Recipe[] = data.recipes.map((r: any) => ({
            recipe_id: r.recipe_id,
            recipe_name: r.recipe_name,
            category: r.category,
            cooking_time: r.cooking_time,
            difficulty_level: r.difficulty_level,
            image_url: r.image_url,
            calories: r.calories,
            protein: r.protein,
            carbs: r.carbs,
            fat: r.fat,
            video_url: r.video_url || 'https://www.youtube.com/embed/w77zP6-oXgI'
          }));
          setRecipes(list);
        }
      } catch (err) {
        console.error('Failed to load reels data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  // Fetch live Likes and Comments status from DB when user session or recipes load
  useEffect(() => {
    if (recipes.length === 0) return;

    recipes.forEach(async (r) => {
      try {
        const urlLikes = `/api/recipes/${r.recipe_id}/likes` + (user?.uid ? `?user_id=${user.uid}` : '');
        const resLikes = await fetch(urlLikes);
        const dataLikes = await resLikes.json();
        if (dataLikes.success) {
          setLikesCount(prev => ({ ...prev, [r.recipe_id]: dataLikes.likesCount }));
          setLikedReels(prev => ({ ...prev, [r.recipe_id]: dataLikes.liked }));
        }

        const resComments = await fetch(`/api/recipes/${r.recipe_id}/comments`);
        const dataComments = await resComments.json();
        if (dataComments.success) {
          setCommentsDb(prev => ({ ...prev, [r.recipe_id]: dataComments.comments }));
        }
      } catch (err) {
        console.error(`Failed to load details for recipe ${r.recipe_id}`, err);
      }
    });
  }, [recipes, user]);

  // Initialize YouTube Iframe Player API
  useEffect(() => {
    if (recipes.length === 0) return;

    // Load YouTube Script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let pollInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        recipes.forEach((r, idx) => {
          const elementId = `youtube-player-${r.recipe_id}`;
          const el = document.getElementById(elementId);
          if (el && !playersRef.current[r.recipe_id]) {
            playersRef.current[r.recipe_id] = new window.YT.Player(elementId, {
              events: {
                onReady: (event: any) => {
                  if (isMuted) {
                    event.target.mute();
                  } else {
                    event.target.unMute();
                  }
                  
                  // Play only if it is the first reel on load
                  if (idx === 0) {
                    event.target.playVideo();
                    setIsPlaying(prev => ({ ...prev, [r.recipe_id]: true }));
                  }
                },
                onStateChange: (event: any) => {
                  if (event.data === window.YT.PlayerState.ENDED) {
                    event.target.playVideo();
                  }
                  const playing = event.data === window.YT.PlayerState.PLAYING;
                  setIsPlaying(prev => ({ ...prev, [r.recipe_id]: playing }));
                }
              }
            });
          }
        });
        clearInterval(pollInterval);
      }
    }, 500);

    return () => clearInterval(pollInterval);
  }, [recipes]);

  // Track playback duration and progress time
  useEffect(() => {
    const timeInterval = setInterval(() => {
      const activeRecipe = recipes[activeReelIndex];
      if (activeRecipe) {
        const player = playersRef.current[activeRecipe.recipe_id];
        if (player && typeof player.getCurrentTime === 'function' && typeof player.getDuration === 'function') {
          const current = player.getCurrentTime();
          const dur = player.getDuration();
          if (current !== undefined) setCurrentTime(prev => ({ ...prev, [activeRecipe.recipe_id]: current }));
          if (dur !== undefined && dur > 0) setDuration(prev => ({ ...prev, [activeRecipe.recipe_id]: dur }));
        }
      }
    }, 250);

    return () => clearInterval(timeInterval);
  }, [activeReelIndex, recipes]);

  // Handle snapping and page scrolling
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPosition = containerRef.current.scrollTop;
    const reelHeight = containerRef.current.clientHeight;
    const index = Math.round(scrollPosition / reelHeight);
    if (index !== activeReelIndex && index >= 0 && index < recipes.length) {
      setActiveReelIndex(index);
    }
  };

  // Synchronize playing & muting on active index change
  useEffect(() => {
    if (recipes.length === 0) return;
    recipes.forEach((r, idx) => {
      const player = playersRef.current[r.recipe_id];
      if (player && typeof player.playVideo === 'function' && typeof player.pauseVideo === 'function') {
        if (idx === activeReelIndex) {
          player.playVideo();
          setIsPlaying(prev => ({ ...prev, [r.recipe_id]: true }));
          if (isMuted) {
            player.mute();
          } else {
            player.unMute();
          }
        } else {
          player.pauseVideo();
          setIsPlaying(prev => ({ ...prev, [r.recipe_id]: false }));
        }
      }
    });
  }, [activeReelIndex, recipes, isMuted]);

  // Toggle Video Sound (Mute/Unmute)
  const handleToggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    
    recipes.forEach(r => {
      const player = playersRef.current[r.recipe_id];
      if (player && typeof player.mute === 'function' && typeof player.unMute === 'function') {
        if (nextMuted) {
          player.mute();
        } else {
          player.unMute();
        }
      }
    });

    setShowVolumeBadge(true);
    setTimeout(() => {
      setShowVolumeBadge(false);
    }, 1000);
  };

  // Show overlay controls momentarily when active reel index changes
  useEffect(() => {
    resetOverlayTimer();
  }, [activeReelIndex]);

  // Toggle Play/Pause
  const handleTogglePlay = (recipeId: number) => {
    resetOverlayTimer();
    const player = playersRef.current[recipeId];
    if (player && typeof player.getPlayerState === 'function') {
      const state = player.getPlayerState();
      if (state === 1) { // 1 = PLAYING
        player.pauseVideo();
        setIsPlaying(prev => ({ ...prev, [recipeId]: false }));
      } else {
        player.playVideo();
        setIsPlaying(prev => ({ ...prev, [recipeId]: true }));
      }
    }
  };

  // Fast Forward 10 Seconds
  const skipForward = (recipeId: number) => {
    resetOverlayTimer();
    const player = playersRef.current[recipeId];
    if (player && typeof player.getCurrentTime === 'function' && typeof player.seekTo === 'function') {
      const current = player.getCurrentTime();
      const dur = duration[recipeId] || player.getDuration() || 0;
      player.seekTo(Math.min(dur, current + 10), true);
    }
  };

  // Rewind 10 Seconds
  const skipBackward = (recipeId: number) => {
    resetOverlayTimer();
    const player = playersRef.current[recipeId];
    if (player && typeof player.getCurrentTime === 'function' && typeof player.seekTo === 'function') {
      const current = player.getCurrentTime();
      player.seekTo(Math.max(0, current - 10), true);
    }
  };

  // Timeline scrubber slider handler
  const handleScrub = (recipeId: number, value: number) => {
    resetOverlayTimer();
    const player = playersRef.current[recipeId];
    if (player && typeof player.seekTo === 'function') {
      player.seekTo(value, true);
      setCurrentTime(prev => ({ ...prev, [recipeId]: value }));
    }
  };

  const handleToggleLike = async (recipeId: number) => {
    if (!user?.uid) {
      alert('Please log in to like recipes!');
      return;
    }

    try {
      const res = await fetch(`/api/recipes/${recipeId}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid })
      });
      const data = await res.json();
      if (data.success) {
        setLikedReels(prev => ({ ...prev, [recipeId]: data.liked }));
        setLikesCount(prev => ({ ...prev, [recipeId]: data.likesCount }));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleOpenComments = (recipeId: number) => {
    setActiveCommentsRecipeId(recipeId);
    setShowComments(true);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || activeCommentsRecipeId === null) return;
    if (!user?.uid) {
      alert('Please log in to comment!');
      return;
    }

    try {
      const res = await fetch(`/api/recipes/${activeCommentsRecipeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          comment: newCommentText.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setCommentsDb(prev => ({
          ...prev,
          [activeCommentsRecipeId]: [data.comment, ...(prev[activeCommentsRecipeId] || [])]
        }));
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const handleShareReel = (recipeId: number) => {
    const url = `${window.location.origin}/recipes/${recipeId}`;
    navigator.clipboard.writeText(url);
    setShowCopyAlert(true);
    setTimeout(() => {
      setShowCopyAlert(false);
    }, 2000);
  };

  const handleOpenPlanner = (recipeId: number) => {
    setPlannerRecipeId(recipeId);
    setShowPlannerModal(true);
    setPlannerSuccess(false);
  };

  const handleAddToPlannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plannerRecipeId || !plannerDate) return;
    if (!user?.uid) {
      alert('Please log in to plan meals!');
      return;
    }

    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          recipe_id: plannerRecipeId,
          meal_date: plannerDate,
          meal_type: plannerType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPlannerSuccess(true);
        setTimeout(() => {
          setShowPlannerModal(false);
          setPlannerSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Error adding to planner:', err);
    }
  };

  // Format MM:SS for Time Display
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === undefined) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-display)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span>Tuning Food Reels...</span>
      </div>
    );
  }

  return (
    <div 
      className="reels-page-wrapper"
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >

      {/* Copy Alert Toast */}
      {showCopyAlert && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--success)',
          color: '#fff',
          padding: '0.6rem 1.5rem',
          borderRadius: '30px',
          zIndex: 1000,
          boxShadow: '0 8px 30px rgba(6, 214, 160, 0.3)',
          fontWeight: 700,
          fontSize: '0.85rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          Link copied to clipboard!
        </div>
      )}

      {/* Main Reels Console */}
      <div style={{
        display: 'grid',
        gap: '2.5rem',
        height: '100%',
        alignItems: 'center'
      }} className="reels-layout-grid">
        
        {/* Left Side: Reel Video Container */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          style={{
            height: '100%',
            width: '100%',
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            scrollbarWidth: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
            borderRadius: '24px',
            backgroundColor: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            position: 'relative'
          }}
          className="reels-scroll-container"
        >
          {recipes.map((recipe, index) => {
            const isLiked = likedReels[recipe.recipe_id] || false;
            const currentLikes = likesCount[recipe.recipe_id] || 0;
            const commentsCount = commentsDb[recipe.recipe_id]?.length || 0;
            const activeIsPlaying = isPlaying[recipe.recipe_id] ?? false;

            const videoId = getYoutubeVideoId(recipe.video_url);
            const isHudVisible = index === activeReelIndex && (overlayVisible || isMobile);

            return (
              <div 
                key={recipe.recipe_id}
                onMouseEnter={() => {
                  setHoveredReelId(recipe.recipe_id);
                  resetOverlayTimer();
                }}
                onMouseMove={resetOverlayTimer}
                onMouseLeave={() => {
                  setOverlayVisible(false);
                  if (hideTimerRef.current) {
                    clearTimeout(hideTimerRef.current);
                  }
                }}
                style={{
                  height: '100%',
                  minHeight: '100%',
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always',
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#000',
                  overflow: 'hidden'
                }}
              >
                {/* Video Player Embed Wrapper */}
                <div 
                  onClick={() => handleTogglePlay(recipe.recipe_id)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                    zIndex: 1
                  }}
                >
                  <iframe
                    id={`youtube-player-${recipe.recipe_id}`}
                    src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=${index === 0 ? 1 : 0}&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&disablekb=1`}
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: 'scale(1.35)', // Zoom to hide black letterbox
                      border: 'none',
                      pointerEvents: 'none'
                    }}
                    allow="autoplay; encrypted-media"
                  />
                </div>

                {/* Speaker Mute/Unmute Float (Top Right) */}
                <button 
                  onClick={(e) => handleToggleMute(e)}
                  style={{
                    position: 'absolute',
                    top: '1.25rem',
                    right: '1.25rem',
                    zIndex: 10,
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 0.4s ease, visibility 0.4s ease, transform 0.2s',
                    opacity: isHudVisible ? 1 : 0,
                    visibility: isHudVisible ? 'visible' : 'hidden',
                    pointerEvents: isHudVisible ? 'auto' : 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                {/* Floating Mute status Badge */}
                {showVolumeBadge && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    background: 'rgba(0,0,0,0.8)',
                    borderRadius: '50%',
                    padding: '1.25rem',
                    color: '#fff',
                    animation: 'fadeOut 1s forwards',
                    pointerEvents: 'none'
                  }}>
                    {isMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}
                  </div>
                )}

                {/* Play/Pause Overlay indicator */}
                {!activeIsPlaying && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9,
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: '50%',
                    width: '70px',
                    height: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    pointerEvents: 'none',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <Play size={32} fill="#fff" />
                  </div>
                )}

                {/* Bottom Shadow Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '45%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />

                {/* Details Overlay Panel (Bottom Left) */}
                <div style={{
                  position: 'absolute',
                  bottom: '2.75rem',
                  left: '1.5rem',
                  right: '5.5rem',
                  zIndex: 3,
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  pointerEvents: isHudVisible ? 'auto' : 'none',
                  opacity: isHudVisible ? 1 : 0,
                  visibility: isHudVisible ? 'visible' : 'hidden',
                  transition: 'opacity 0.4s ease, visibility 0.4s ease'
                }}>
                  {/* Category tag */}
                  <span style={{
                    alignSelf: 'flex-start',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #ff7a45 100%)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {recipe.category}
                  </span>

                  <h3 className="reel-recipe-title" style={{
                    fontWeight: 800,
                    margin: 0,
                    textShadow: '0 2px 4px rgba(0,0,0,0.6)'
                  }}>
                    {recipe.recipe_name}
                  </h3>

                  {/* Micro Nutritional Summary */}
                  <div className="reel-nutrition-badge" style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: 'rgba(255,255,255,0.85)',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '8px',
                    width: 'fit-content'
                  }}>
                    <span>🔥 {recipe.calories} kcal</span>
                    <span>•</span>
                    <span>💪 P: {recipe.protein}g</span>
                    <span>•</span>
                    <span>🍞 C: {recipe.carbs}g</span>
                  </div>

                  {/* Skip Controls & Duration Stats */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginTop: '0.25rem'
                  }}>
                    {/* Control skip button panel */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '30px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); skipBackward(recipe.recipe_id); }}
                        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        title="Rewind 10s"
                      >
                        <RotateCcw size={14} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>10s</span>
                      </button>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleTogglePlay(recipe.recipe_id); }}
                        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {activeIsPlaying ? <Pause size={14} fill="#fff" /> : <Play size={14} fill="#fff" />}
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); skipForward(recipe.recipe_id); }}
                        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        title="Fast Forward 10s"
                      >
                        <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>10s</span>
                        <RotateCw size={14} />
                      </button>
                    </div>
                  </div>

                  {/* View Details CTA */}
                  <Link 
                    href={`/recipes/${recipe.recipe_id}`}
                    className="reel-cta-btn"
                    style={{
                      marginTop: '0.25rem',
                      background: '#fff',
                      color: '#000',
                      textDecoration: 'none',
                      fontWeight: 700,
                      borderRadius: '25px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      width: 'fit-content',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <ChefHat size={16} />
                    <span>View Recipe Details</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Right Interactive Sidebar Icons (Bottom Right) */}
                <div 
                  className="reel-actions-sidebar"
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    zIndex: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {/* Like Button */}
                  <button 
                    onClick={() => handleToggleLike(recipe.recipe_id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: isLiked ? 'var(--primary)' : '#fff',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '0.65rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <Heart size={20} fill={isLiked ? 'var(--primary)' : 'none'} style={{ transition: 'fill 0.2s' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>{currentLikes}</span>
                  </button>

                  {/* Comment Button */}
                  <button 
                    onClick={() => handleOpenComments(recipe.recipe_id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#fff',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '0.65rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <MessageSquare size={20} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{commentsCount}</span>
                  </button>

                  {/* Planner Calendar */}
                  <button 
                    onClick={() => handleOpenPlanner(recipe.recipe_id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#fff',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '0.65rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <Calendar size={20} />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Schedule</span>
                  </button>

                  {/* Share button */}
                  <button 
                    onClick={() => handleShareReel(recipe.recipe_id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#fff',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '0.65rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <Share2 size={20} />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Share</span>
                  </button>
                </div>

                {/* Interactive Timeline Progress Scrubber Bar (Bottom Edge) */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  padding: '0.5rem 1rem',
                  boxSizing: 'border-box',
                  zIndex: 15,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                  pointerEvents: isHudVisible ? 'auto' : 'none',
                  opacity: isHudVisible ? 1 : 0,
                  visibility: isHudVisible ? 'visible' : 'hidden',
                  transition: 'opacity 0.4s ease, visibility 0.4s ease'
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff', minWidth: '35px', textAlign: 'right' }}>
                    {formatTime(currentTime[recipe.recipe_id] || 0)}
                  </span>
                  <input 
                    type="range"
                    min={0}
                    max={duration[recipe.recipe_id] || 100}
                    value={currentTime[recipe.recipe_id] || 0}
                    onChange={(e) => handleScrub(recipe.recipe_id, parseFloat(e.target.value))}
                    className="reel-scrubber"
                    style={{
                      flex: 1,
                      margin: 0,
                      padding: 0
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff', minWidth: '35px' }}>
                    {formatTime(duration[recipe.recipe_id] || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Reels Feed Dashboard Context */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          height: '100%',
          justifyContent: 'center'
        }} className="reels-context-panel">
          
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Smart Food Reels</h2>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Welcome to the ultimate cooking feed! Swipe or scroll up/down inside the console to explore quick visual preparation guides.
            </p>

            <div style={{
              background: 'rgba(255, 90, 54, 0.04)',
              border: '1px dashed rgba(255, 90, 54, 0.2)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                💡 Chef Shortcuts:
              </span>
              <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '1.2rem', lineHeight: 1.5 }}>
                <li>Click on the video screen to Play/Pause.</li>
                <li>Use the skip buttons or drag the timeline bar at the bottom to rewind/fast-forward the video.</li>
                <li>Tap the speaker in the top right to toggle sound.</li>
              </ul>
            </div>

            {/* Current Active Reel Stats */}
            {recipes[activeReelIndex] && (
              <div style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Now playing: {recipes[activeReelIndex].recipe_name}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--bg-base)', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Difficulty</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {recipes[activeReelIndex].difficulty_level}
                    </span>
                  </div>
                  <div style={{ background: 'var(--bg-base)', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Prep Time</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {recipes[activeReelIndex].cooking_time} mins
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* COMMENTS DRAWER / OVERLAY PANEL */}
      {showComments && activeCommentsRecipeId !== null && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-color)',
          zIndex: 100,
          boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Comments ({commentsDb[activeCommentsRecipeId]?.length || 0})
            </h3>
            <button 
              onClick={() => setShowComments(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Comments List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {(commentsDb[activeCommentsRecipeId] || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
                No comments yet. Start the conversation!
              </p>
            ) : (
              (commentsDb[activeCommentsRecipeId] || []).map((comment) => (
                <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {comment.user}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {comment.time}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {comment.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Comment Form input */}
          <form 
            onSubmit={handlePostComment}
            style={{
              padding: '1rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-base)'
            }}
          >
            <input 
              type="text" 
              placeholder="Add a comment..."
              className="form-control"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              style={{ flex: 1, borderRadius: '20px', paddingLeft: '1rem' }}
            />
            <button 
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.6rem 0.8rem', borderRadius: '50%', minWidth: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* QUICK PLANNER MODAL */}
      {showPlannerModal && plannerRecipeId !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{
            width: '90%',
            maxWidth: '400px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={18} style={{ color: 'var(--primary)' }} />
                Schedule in Planner
              </h3>
              <button 
                onClick={() => setShowPlannerModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {plannerSuccess ? (
              <div style={{
                backgroundColor: 'rgba(6, 214, 160, 0.1)',
                color: 'var(--success)',
                border: '1px solid var(--success)',
                padding: '0.8rem',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '0.85rem'
              }}>
                ✓ Added to your Weekly Planner!
              </div>
            ) : (
              <form onSubmit={handleAddToPlannerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Target Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={plannerDate}
                    onChange={(e) => setPlannerDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Meal Slot</label>
                  <select 
                    className="form-control"
                    value={plannerType}
                    onChange={(e) => setPlannerType(e.target.value)}
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', fontWeight: 700, marginTop: '0.5rem' }}
                >
                  Confirm Schedule
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
