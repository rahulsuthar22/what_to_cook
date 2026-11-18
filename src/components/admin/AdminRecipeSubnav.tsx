'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChefHat, UploadCloud, DownloadCloud } from 'lucide-react';

export default function AdminRecipeSubnav() {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Recipes',
      href: '/admin/recipes',
      icon: ChefHat,
    },
    {
      name: 'Import',
      href: '/admin/recipes/import',
      icon: UploadCloud,
    },
    {
      name: 'Export',
      href: '/admin/recipes/export',
      icon: DownloadCloud,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: '#12141f',
        padding: '0.35rem',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'rgba(255, 90, 54, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(255, 90, 54, 0.3)' : '1px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            <Icon size={15} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
