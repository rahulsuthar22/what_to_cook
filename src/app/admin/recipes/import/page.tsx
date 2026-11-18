'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import AdminRecipeSubnav from '@/components/admin/AdminRecipeSubnav';
import { AdminSpinner } from '@/components/admin/AdminLoader';
import {
  SAMPLE_RECIPES_JSON,
  SAMPLE_RECIPES_CSV,
  FREE_RECIPE_RESOURCES,
  PREPACKAGED_STARTER_PACKS,
  parseCSV,
  normalizeRecipe,
  validateRecipe,
  NormalizedRecipe,
  ValidationResult,
} from '@/lib/recipe-templates';
import {
  UploadCloud,
  FileCode,
  FileSpreadsheet,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  FileText,
  RotateCcw,
  Check,
  ChevronRight,
  Globe,
  Info
} from 'lucide-react';

interface ParsedItem {
  recipe: NormalizedRecipe;
  validation: ValidationResult;
}

export default function AdminRecipeImportPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'resources'>('upload');
  const [pasteContent, setPasteContent] = useState('');
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'copy'>('skip');

  // Preview & Processing state
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [parseError, setParseError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{
    total: number;
    importedCount: number;
    skippedCount: number;
    failedCount: number;
    errors: Array<{ index: number; name: string; error: string }>;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Template Download Handlers
  const handleDownloadTemplate = (format: 'json' | 'csv') => {
    const content = format === 'json' ? SAMPLE_RECIPES_JSON : SAMPLE_RECIPES_CSV;
    const mime = format === 'json' ? 'application/json' : 'text/csv';
    const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whattocook_recipes_template.${format}`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Parse text or file contents
  const processRawText = (text: string, fileName?: string) => {
    setParseError('');
    setImportResult(null);

    const trimmed = text.trim();
    if (!trimmed) {
      setParseError('The file or input appears to be empty.');
      setParsedItems([]);
      return;
    }

    try {
      let rawArray: any[] = [];

      // Check if JSON
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsedJson = JSON.parse(trimmed);
        if (Array.isArray(parsedJson)) {
          rawArray = parsedJson;
        } else if (parsedJson && Array.isArray(parsedJson.recipes)) {
          rawArray = parsedJson.recipes;
        } else if (parsedJson && typeof parsedJson === 'object') {
          rawArray = [parsedJson];
        }
      } else {
        // Fallback to CSV parsing
        const csvRows = parseCSV(trimmed);
        if (csvRows.length < 2) {
          throw new Error('CSV must contain a header row and at least one recipe row.');
        }

        const headers = csvRows[0].map((h) => h.toLowerCase().trim());
        rawArray = csvRows.slice(1).map((row) => {
          const obj: Record<string, string> = {};
          headers.forEach((header, idx) => {
            obj[header] = row[idx] || '';
          });
          return obj;
        });
      }

      if (rawArray.length === 0) {
        throw new Error('No valid recipe items were found in the provided content.');
      }

      const items: ParsedItem[] = rawArray.map((item) => {
        const norm = normalizeRecipe(item);
        const val = validateRecipe(norm);
        return { recipe: norm, validation: val };
      });

      setParsedItems(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setParseError(`Parsing error: ${msg}. Please ensure your file conforms to the template.`);
      setParsedItems([]);
    }
  };

  // File Upload Drop Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processRawText(content, file.name);
    };
    reader.readAsText(file);
  };

  // Load starter pack directly
  const handleLoadStarterPack = (packId: string) => {
    const pack = PREPACKAGED_STARTER_PACKS.find((p) => p.id === packId);
    if (!pack) return;

    const items: ParsedItem[] = pack.recipes.map((r) => {
      const norm = normalizeRecipe(r);
      const val = validateRecipe(norm);
      return { recipe: norm, validation: val };
    });

    setParsedItems(items);
    setParseError('');
    setImportResult(null);
    setActiveTab('upload');
  };

  // Submit batch import to API
  const handleExecuteImport = async () => {
    const validRecipes = parsedItems.map((item) => item.recipe);
    if (validRecipes.length === 0) return;

    setIsSubmitting(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/admin/recipes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipes: validRecipes,
          duplicateStrategy,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setImportResult(data);
      } else {
        setParseError(data.error || 'Failed to complete batch import.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setParseError(msg || 'An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedItems.filter((i) => i.validation.valid).length;
  const errorCount = parsedItems.filter((i) => !i.validation.valid).length;

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
          <UploadCloud size={24} style={{ color: 'var(--primary)' }} />
          Import Recipes
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
          Import recipes from JSON or CSV files.
        </p>
      </div>

      {/* Top Template Download & Web Resources Banner */}
      <div style={{
        backgroundColor: '#12141f',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        background: 'linear-gradient(135deg, rgba(255, 90, 54, 0.06) 0%, rgba(18, 20, 31, 1) 100%)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(0, 180, 216, 0.15)',
              color: '#00b4d8',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Standard Schemas
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
              Required Import Templates
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '520px' }}>
            Download the official schema templates formatted for single-click ingestion. Fill in your recipes and import directly.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleDownloadTemplate('json')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#1a1d2d',
              border: '1px solid rgba(255, 90, 54, 0.3)',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <FileCode size={15} style={{ color: 'var(--primary)' }} />
            <span>JSON Template</span>
          </button>

          <button
            onClick={() => handleDownloadTemplate('csv')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#1a1d2d',
              border: '1px solid rgba(0, 180, 216, 0.3)',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <FileSpreadsheet size={15} style={{ color: 'var(--secondary)' }} />
            <span>CSV Template</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('upload')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1.1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'upload' ? 700 : 500,
            color: activeTab === 'upload' ? '#fff' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'upload' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            cursor: 'pointer',
          }}
        >
          <UploadCloud size={16} />
          <span>Upload File</span>
        </button>

        <button
          onClick={() => setActiveTab('paste')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1.1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'paste' ? 700 : 500,
            color: activeTab === 'paste' ? '#fff' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'paste' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            cursor: 'pointer',
          }}
        >
          <FileText size={16} />
          <span>Paste Text</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1.1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'resources' ? 700 : 500,
            color: activeTab === 'resources' ? '#00b4d8' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'resources' ? 'rgba(0, 180, 216, 0.12)' : 'transparent',
            cursor: 'pointer',
          }}
        >
          <Globe size={16} />
          <span>Datasets</span>
        </button>
      </div>

      {/* TAB 1: FILE UPLOAD DROPZONE */}
      {activeTab === 'upload' && (
        <div style={{
          backgroundColor: '#12141f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '1rem',
        }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.csv"
            style={{ display: 'none' }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '2.5rem 1.5rem',
              borderRadius: '14px',
              border: '2px dashed rgba(255, 90, 54, 0.35)',
              backgroundColor: '#0a0b12',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.85rem',
              transition: 'border-color 0.2s ease',
            }}
          >
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 90, 54, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}>
              <UploadCloud size={28} />
            </div>
            <div>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                Select or Drop .JSON or .CSV file
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Supports standard arrays or CSV exported from Excel or web repositories
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PASTE RAW TEXT / JSON */}
      {activeTab === 'paste' && (
        <div style={{
          backgroundColor: '#12141f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Paste Raw JSON array or CSV text here:
          </label>
          <textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder='[ { "recipe_name": "Paneer Tikka", "category": "Indian", "cooking_time": 25, "instructions": "1. Marinate... 2. Grill..." } ]'
            style={{
              width: '100%',
              height: '180px',
              padding: '1rem',
              backgroundColor: '#07080e',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <div>
            <button
              onClick={() => processRawText(pasteContent)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                border: 'none',
                color: '#fff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={16} />
              <span>Validate & Parse Pasted Content</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: FREE WEB DATASETS & STARTER PACKS */}
      {activeTab === 'resources' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Built-in 1-Click Starter Bundles */}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} style={{ color: 'var(--primary)' }} />
              Pre-Packaged Starter Bundles (1-Click Load)
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Need instant recipes for your app? Click any bundle to load valid, high-resolution recipes directly into the previewer.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}>
              {PREPACKAGED_STARTER_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  style={{
                    backgroundColor: '#12141f',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{pack.title}</span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 90, 54, 0.15)',
                        color: 'var(--primary)',
                      }}>
                        {pack.count} Recipes
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {pack.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleLoadStarterPack(pack.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      backgroundColor: '#1b1e2e',
                      border: '1px solid rgba(255, 90, 54, 0.3)',
                      color: '#fff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>Load {pack.count} Recipes into Importer</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Curated Free Open-Source Web Resources */}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={20} style={{ color: 'var(--secondary)' }} />
              Verified Open-Source Recipe Web Repositories
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Download millions of recipes freely from these public domain and open-access data portals:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {FREE_RECIPE_RESOURCES.map((res) => (
                <div
                  key={res.id}
                  style={{
                    backgroundColor: '#12141f',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                        {res.name}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: res.recommended ? 'rgba(6, 214, 160, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        color: res.recommended ? '#06d6a0' : 'var(--text-muted)',
                        fontWeight: 700,
                      }}>
                        {res.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 0.4rem 0' }}>
                      {res.description}
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Info size={13} style={{ color: 'var(--secondary)' }} />
                      <span>{res.usageTip}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: '#181b29',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <span>Visit Data Source</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ERROR ALERT */}
      {parseError && (
        <div style={{
          padding: '1rem',
          borderRadius: '10px',
          backgroundColor: 'rgba(239, 71, 111, 0.12)',
          border: '1px solid rgba(239, 71, 111, 0.3)',
          color: '#ff85a1',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <AlertTriangle size={18} />
          <span>{parseError}</span>
        </div>
      )}

      {/* SUCCESS RESULT BANNER */}
      {importResult && (
        <div style={{
          padding: '1.25rem',
          borderRadius: '12px',
          backgroundColor: 'rgba(6, 214, 160, 0.1)',
          border: '1px solid rgba(6, 214, 160, 0.3)',
          color: '#06d6a0',
          fontSize: '0.88rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <CheckCircle2 size={18} />
            <span>{importResult.message}</span>
          </div>
          {importResult.errors.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: '#ffd166', marginTop: '0.4rem' }}>
              <strong>Notice:</strong> {importResult.errors.length} items could not be imported due to formatting issues.
            </div>
          )}
        </div>
      )}

      {/* PREVIEW & COMMIT SECTION */}
      {parsedItems.length > 0 && (
        <div style={{
          backgroundColor: '#12141f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          {/* Header Summary */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
                Pre-Import Inspection ({parsedItems.length} Recipes Detected)
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#06d6a0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={14} /> {validCount} Valid & Ready
                </span>
                {errorCount > 0 && (
                  <span style={{ color: '#ef476f', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <XCircle size={14} /> {errorCount} Invalid (Will Be Skipped)
                  </span>
                )}
              </div>
            </div>

            {/* Duplicate Strategy & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  If recipe already exists:
                </label>
                <select
                  value={duplicateStrategy}
                  onChange={(e) => setDuplicateStrategy(e.target.value as any)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#0a0b12',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="skip">Skip Duplicate (Safest)</option>
                  <option value="update">Overwrite & Update Existing</option>
                  <option value="copy">Create Copy with -copy suffix</option>
                </select>
              </div>

              <button
                onClick={handleExecuteImport}
                disabled={isSubmitting || validCount === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.8 : 1,
                  boxShadow: '0 4px 14px rgba(255, 90, 54, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                {isSubmitting ? (
                  <>
                    <AdminSpinner size={16} color="#fff" />
                    <span>Importing {validCount} Recipes...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>Commit Import to Database ({validCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table Preview */}
          <div style={{
            overflowX: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.82rem',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#0a0b12', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recipe Name</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cook Time</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Difficulty</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ingredients</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Steps</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Validation</th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#fff' }}>
                      {item.recipe.name || 'Untitled Recipe'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {item.recipe.category}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {item.recipe.cookingTime} min
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor:
                          item.recipe.difficulty === 'Easy'
                            ? 'rgba(6, 214, 160, 0.12)'
                            : item.recipe.difficulty === 'Medium'
                            ? 'rgba(255, 209, 102, 0.12)'
                            : 'rgba(239, 71, 111, 0.12)',
                        color:
                          item.recipe.difficulty === 'Easy'
                            ? '#06d6a0'
                            : item.recipe.difficulty === 'Medium'
                            ? '#ffd166'
                            : '#ef476f',
                      }}>
                        {item.recipe.difficulty}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {item.recipe.ingredients.length} items
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {item.recipe.instructions.length} steps
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {item.validation.valid ? (
                        <span style={{ color: '#06d6a0', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                          <CheckCircle2 size={14} /> Ready
                        </span>
                      ) : (
                        <span style={{ color: '#ef476f', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }} title={item.validation.errors.join('; ')}>
                          <XCircle size={14} /> Invalid
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

