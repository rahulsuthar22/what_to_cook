'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminRecipeSubnav from '@/components/admin/AdminRecipeSubnav';
import { AdminSpinner } from '@/components/admin/AdminLoader';
import {
  DownloadCloud,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  ArrowLeft,
  Database,
  Filter,
  Check
} from 'lucide-react';

export default function AdminRecipeExportPage() {
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [previewSnippet, setPreviewSnippet] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch initial summary and categories
  useEffect(() => {
    let isMounted = true;
    fetch('/api/recipes?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.recipes)) {
          setTotalCount(data.recipes.length);
          const cats = Array.from(
            new Set<string>(data.recipes.map((r: any) => r.category).filter(Boolean))
          );
          setCategories(cats);
        }
      })
      .catch((err) => console.error('Failed to fetch recipes count:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch preview when format or category changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingPreview(true);

    const query = new URLSearchParams({
      format: selectedFormat,
      category: selectedCategory,
    });

    fetch(`/api/admin/recipes/export?${query.toString()}`)
      .then((res) => (selectedFormat === 'csv' ? res.text() : res.json()))
      .then((data) => {
        if (!isMounted) return;
        if (selectedFormat === 'csv') {
          const lines = (data as string).split('\n').slice(0, 8).join('\n');
          setPreviewSnippet(lines);
        } else {
          const sample = {
            exportMetadata: data.exportMetadata,
            recipes: (data.recipes || []).slice(0, 2),
            _note: `... plus ${(data.recipes?.length || 0) - Math.min(2, data.recipes?.length || 0)} more items in full download`,
          };
          setPreviewSnippet(JSON.stringify(sample, null, 2));
        }
      })
      .catch((err) => {
        console.error('Failed to load export preview:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPreview(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, selectedFormat]);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const query = new URLSearchParams({
        format: selectedFormat,
        category: selectedCategory,
        download: 'true',
      });

      const response = await fetch(`/api/admin/recipes/export?${query.toString()}`);
      if (!response.ok) throw new Error('Export download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `whattocook-recipes-${selectedCategory.toLowerCase()}-${timestamp}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      console.error('Download error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = () => {
    if (!previewSnippet) return;
    navigator.clipboard.writeText(previewSnippet);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Sub Navigation */}
      <AdminRecipeSubnav />

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <Link
            href="/admin/recipes"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            Recipes
          </Link>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.25rem 0' }}>
          <DownloadCloud size={24} style={{ color: 'var(--primary)' }} />
          Export Catalog
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
          Export recipes in JSON or CSV format.
        </p>
      </div>

      {/* Stats Summary Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
      }}>
        <div style={{
          backgroundColor: '#12141f',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 90, 54, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}>
            <Database size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Available in Database
            </span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
              {totalCount === null ? <AdminSpinner size={16} /> : `${totalCount} Recipes`}
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#12141f',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 180, 216, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--secondary)',
          }}>
            <Filter size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Unique Cuisines / Categories
            </span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
              {categories.length} Categories
            </div>
          </div>
        </div>
      </div>

      {/* Main Export Configuration Card */}
      <div style={{
        backgroundColor: '#12141f',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
      }}>
        {/* Format Selection Cards */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
            1. Select Export Format
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}>
            {/* JSON Option */}
            <div
              onClick={() => setSelectedFormat('json')}
              style={{
                cursor: 'pointer',
                padding: '1.25rem',
                borderRadius: '12px',
                backgroundColor: selectedFormat === 'json' ? 'rgba(255, 90, 54, 0.1)' : '#0b0c13',
                border: selectedFormat === 'json' ? '2px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 90, 54, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                flexShrink: 0,
              }}>
                <FileCode size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>JSON Format</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(255, 90, 54, 0.2)', color: 'var(--primary)', fontWeight: 700 }}>
                    RECOMMENDED
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Full fidelity, nested arrays for steps, ingredients, nutrition, and metadata.
                </p>
              </div>
            </div>

            {/* CSV Option */}
            <div
              onClick={() => setSelectedFormat('csv')}
              style={{
                cursor: 'pointer',
                padding: '1.25rem',
                borderRadius: '12px',
                backgroundColor: selectedFormat === 'csv' ? 'rgba(0, 180, 216, 0.1)' : '#0b0c13',
                border: selectedFormat === 'csv' ? '2px solid var(--secondary)' : '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 180, 216, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--secondary)',
                flexShrink: 0,
              }}>
                <FileSpreadsheet size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>CSV Spreadsheet</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(0, 180, 216, 0.2)', color: 'var(--secondary)', fontWeight: 700 }}>
                    EXCEL / SHEETS
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Tabular comma-separated values compatible with Google Sheets, Excel, and analytics pipelines.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
            2. Scope / Category Filter
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '360px',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#0a0b12',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Categories & Recipes (Full Catalog)</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} Category Only
              </option>
            ))}
          </select>
        </div>

        {/* Live Snippet Preview */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
              3. Sample Preview ({selectedFormat.toUpperCase()})
            </label>
            <button
              onClick={handleCopy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'none',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
                padding: '0.3rem 0.65rem',
                color: copySuccess ? '#06d6a0' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              {copySuccess ? <Check size={13} /> : <Copy size={13} />}
              <span>{copySuccess ? 'Copied Preview!' : 'Copy Preview'}</span>
            </button>
          </div>

          <div style={{
            position: 'relative',
            backgroundColor: '#07080e',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.78rem',
            color: '#a0aec0',
            maxHeight: '220px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {isLoadingPreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', color: 'var(--text-muted)' }}>
                <AdminSpinner size={16} />
                <span>Generating live export snippet...</span>
              </div>
            ) : (
              previewSnippet || 'No recipes available to preview.'
            )}
          </div>
        </div>

        {/* Download Action Button */}
        <div>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              padding: '0.9rem 2rem',
              borderRadius: '10px',
              backgroundColor: 'var(--primary)',
              border: 'none',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.8 : 1,
              boxShadow: isExporting
                ? '0 2px 8px rgba(255, 90, 54, 0.2)'
                : '0 4px 16px rgba(255, 90, 54, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            {isExporting ? (
              <>
                <AdminSpinner size={18} color="#fff" />
                <span>Packaging & Generating File...</span>
              </>
            ) : (
              <>
                <DownloadCloud size={18} />
                <span>Download {selectedFormat.toUpperCase()} Catalog</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

