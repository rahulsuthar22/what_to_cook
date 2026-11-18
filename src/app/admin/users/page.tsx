'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminSpinner } from '@/components/admin/AdminLoader';
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  Heart,
  Star,
  UserSearch,
} from 'lucide-react';

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  mobileNumber?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  _count: { mealPlans: number; favourites: number; reviews: number };
}

/** Generate avatar initials from fullName — first char of first & last word */
function getInitials(name: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0][0]?.toUpperCase() ?? '?';
  return (
    (words[0][0]?.toUpperCase() ?? '') +
    (words[words.length - 1][0]?.toUpperCase() ?? '')
  );
}

function AvatarCircle({ name, size = 32 }: { name: string; size?: number }) {
  const fontSize = size <= 32 ? '0.7rem' : '1.1rem';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 90, 54, 0.15)',
        border: '1px solid var(--primary)',
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 700,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {getInitials(name)}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'info',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  };

  const fetchUsers = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          search: searchQuery,
          sort: sortBy,
          limit: String(rowsPerPage),
          offset: String((currentPage - 1) * rowsPerPage),
        });

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          setUsers(data.users ?? []);
          setTotal(data.total ?? 0);
        } else {
          showToast(data.error ?? 'Failed to fetch users', 'error');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error';
        showToast(msg, 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, sortBy, rowsPerPage, currentPage]
  );

  // Initial load + react to filter/pagination changes
  useEffect(() => {
    fetchUsers(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, rowsPerPage, currentPage]);

  // Reset page when search changes, then trigger fetch
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch after page resets to 1 when search changes
  useEffect(() => {
    if (currentPage === 1) {
      fetchUsers(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const startRow = total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, total);

  const toastColors: Record<string, string> = {
    success: '#06d6a0',
    error: '#ef476f',
    info: 'var(--secondary)',
  };
  const toastBg: Record<string, string> = {
    success: 'rgba(6, 214, 160, 0.12)',
    error: 'rgba(239, 71, 111, 0.12)',
    info: 'rgba(0, 180, 216, 0.12)',
  };

  return (
    <div
      style={{
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        minHeight: '100%',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Users
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Registered customer accounts
          </div>
        </div>

        <button
          onClick={() => fetchUsers(true)}
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
            cursor: refreshing || loading ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
          }}
        >
          {refreshing ? (
            <AdminSpinner size={14} color="var(--primary)" />
          ) : (
            <RefreshCw size={14} />
          )}
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          backgroundColor: '#12141c',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2.2rem',
              borderRadius: '6px',
              backgroundColor: '#0a0b12',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as 'newest' | 'oldest' | 'name');
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
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* ── Table card ── */}
      <div
        style={{
          backgroundColor: '#12141c',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem 1rem',
            }}
          >
            <AdminSpinner size={28} color="var(--primary)" />
          </div>
        ) : users.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '4rem 1rem',
              color: 'var(--text-muted)',
            }}
          >
            <UserSearch size={36} style={{ opacity: 0.4 }} />
            <span style={{ fontSize: '0.9rem' }}>No users found</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.84rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  {['#', 'User', 'Email', 'Phone', 'Joined', 'Plans', 'Favs', 'Reviews', ''].map(
                    (col) => (
                      <th
                        key={col}
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          fontSize: '0.74rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => {
                  const rowNum = (currentPage - 1) * rowsPerPage + idx + 1;
                  const isEven = idx % 2 === 1;
                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        backgroundColor: isEven ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                          'rgba(255, 90, 54, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = isEven
                          ? 'rgba(255, 255, 255, 0.015)'
                          : 'transparent';
                      }}
                    >
                      {/* # */}
                      <td
                        style={{
                          padding: '0.7rem 1rem',
                          color: 'var(--text-muted)',
                          fontSize: '0.78rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rowNum}
                      </td>

                      {/* User */}
                      <td style={{ padding: '0.7rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <AvatarCircle name={user.fullName} size={32} />
                          <span style={{ fontWeight: 500, color: '#fff', fontSize: '0.85rem' }}>
                            {user.fullName}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td
                        style={{
                          padding: '0.7rem 1rem',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.email}
                      </td>

                      {/* Phone */}
                      <td
                        style={{
                          padding: '0.7rem 1rem',
                          color: user.mobileNumber ? 'var(--text-secondary)' : 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.mobileNumber ?? '—'}
                      </td>

                      {/* Joined */}
                      <td
                        style={{
                          padding: '0.7rem 1rem',
                          color: 'var(--text-muted)',
                          fontSize: '0.78rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Plans */}
                      <td style={{ padding: '0.7rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.8rem',
                            color: 'var(--secondary)',
                          }}
                        >
                          <BookOpen size={12} />
                          {user._count.mealPlans}
                        </span>
                      </td>

                      {/* Favs */}
                      <td style={{ padding: '0.7rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.8rem',
                            color: '#ef476f',
                          }}
                        >
                          <Heart size={12} />
                          {user._count.favourites}
                        </span>
                      </td>

                      {/* Reviews */}
                      <td style={{ padding: '0.7rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.8rem',
                            color: 'var(--warning)',
                          }}
                        >
                          <Star size={12} />
                          {user._count.reviews}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.7rem 1rem', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setSelectedUser(user)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.35rem 0.7rem',
                            borderRadius: '5px',
                            backgroundColor: 'rgba(0, 180, 216, 0.1)',
                            border: '1px solid rgba(0, 180, 216, 0.25)',
                            color: 'var(--secondary)',
                            fontSize: '0.78rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                              'rgba(0, 180, 216, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                              'rgba(0, 180, 216, 0.1)';
                          }}
                        >
                          <Eye size={13} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {total === 0
              ? 'No results'
              : `Showing ${startRow}–${endRow} of ${total}`}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Rows per page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Rows:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.35rem 0.6rem',
                  borderRadius: '5px',
                  backgroundColor: '#0a0b12',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Prev */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '5px',
                backgroundColor: '#1b1e2c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: currentPage <= 1 ? 'var(--text-muted)' : '#fff',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={15} />
            </button>

            {/* Page indicator */}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '52px', textAlign: 'center' }}>
              {currentPage} / {totalPages}
            </span>

            {/* Next */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '5px',
                backgroundColor: '#1b1e2c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: currentPage >= totalPages ? 'var(--text-muted)' : '#fff',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.5 : 1,
              }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── View User Modal ── */}
      {selectedUser && (
        <div
          onClick={() => setSelectedUser(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#12141c',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              padding: '1.75rem',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedUser(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>

            {/* Avatar + Name */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              <AvatarCircle name={selectedUser.fullName} size={56} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  {selectedUser.fullName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  ID: {selectedUser.id}
                </div>
              </div>
            </div>

            {/* Detail rows */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                marginBottom: '1.5rem',
              }}
            >
              {/* Email */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '7px',
                  backgroundColor: '#0a0b12',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <Mail size={15} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>
                    Email
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#fff' }}>{selectedUser.email}</div>
                </div>
              </div>

              {/* Phone */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '7px',
                  backgroundColor: '#0a0b12',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <Phone size={15} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>
                    Phone
                  </div>
                  <div
                    style={{
                      fontSize: '0.84rem',
                      color: selectedUser.mobileNumber ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {selectedUser.mobileNumber ?? 'Not provided'}
                  </div>
                </div>
              </div>

              {/* Joined */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '7px',
                  backgroundColor: '#0a0b12',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <Calendar size={15} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>
                    Joined
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#fff' }}>
                    {new Date(selectedUser.createdAt).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity stats */}
            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                paddingTop: '1.25rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.85rem',
                }}
              >
                Activity
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.65rem',
                }}
              >
                {/* Meal Plans */}
                <div
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '7px',
                    backgroundColor: 'rgba(0, 180, 216, 0.08)',
                    border: '1px solid rgba(0, 180, 216, 0.18)',
                    textAlign: 'center',
                  }}
                >
                  <BookOpen size={16} style={{ color: 'var(--secondary)', marginBottom: '0.35rem' }} />
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                    {selectedUser._count.mealPlans}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Meal Plans
                  </div>
                </div>

                {/* Favourites */}
                <div
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '7px',
                    backgroundColor: 'rgba(239, 71, 111, 0.08)',
                    border: '1px solid rgba(239, 71, 111, 0.18)',
                    textAlign: 'center',
                  }}
                >
                  <Heart size={16} style={{ color: '#ef476f', marginBottom: '0.35rem' }} />
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                    {selectedUser._count.favourites}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Favourites
                  </div>
                </div>

                {/* Reviews */}
                <div
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '7px',
                    backgroundColor: 'rgba(255, 209, 102, 0.08)',
                    border: '1px solid rgba(255, 209, 102, 0.18)',
                    textAlign: 'center',
                  }}
                >
                  <Star size={16} style={{ color: 'var(--warning)', marginBottom: '0.35rem' }} />
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                    {selectedUser._count.reviews}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Reviews
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            backgroundColor: toastBg[toast.type],
            border: `1px solid ${toastColors[toast.type]}40`,
            color: toastColors[toast.type],
            fontSize: '0.84rem',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            maxWidth: '340px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
