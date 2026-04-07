'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/providers/ToastProvider';
import styles from './StockImagesContent.module.css';

interface SystemConfigRow {
  key: string;
  value: string;
  category: string;
}

export function StockImagesContent() {
  const { addToast } = useToast();
  const [rows, setRows] = useState<SystemConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await apiClient.get<SystemConfigRow[]>(
        '/admin/system-config?category=stock_images',
      );
      setRows(data);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to load stock images.' });
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, []);

  async function save(key: string, value: string) {
    setSaving(key);
    try {
      await apiClient.put('/admin/system-config', {
        key,
        value,
        category: 'stock_images',
        is_secret: false,
      });
      addToast({ type: 'success', message: `Saved ${key}` });
    } catch (err) {
      addToast({ type: 'error', message: `Failed to save ${key}` });
    } finally {
      setSaving(null);
    }
  }

  async function remove(key: string) {
    if (!confirm(`Delete stock image "${key}"?`)) return;
    try {
      await apiClient.delete(`/admin/system-config/${encodeURIComponent(key)}`);
      setRows((prev) => prev.filter((r) => r.key !== key));
      addToast({ type: 'success', message: 'Deleted' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to delete' });
    }
  }

  async function addNew() {
    if (!newKey.trim() || !newValue.trim()) {
      addToast({ type: 'warning', message: 'Both key and URL are required.' });
      return;
    }
    await save(newKey.trim(), newValue.trim());
    setRows((prev) => [
      ...prev,
      { key: newKey.trim(), value: newValue.trim(), category: 'stock_images' },
    ]);
    setNewKey('');
    setNewValue('');
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Stock Images</h1>
          <p className={styles.subtitle}>
            Marketing-page images. Edits propagate to the public site within 5 minutes
            (or instantly if you bust the cache).
          </p>
        </div>
      </header>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        <>
          <div className={styles.grid}>
            {rows.map((row) => (
              <Row
                key={row.key}
                row={row}
                onSave={(value) => save(row.key, value)}
                onDelete={() => remove(row.key)}
                saving={saving === row.key}
              />
            ))}
          </div>

          <section className={styles.addSection}>
            <h2 className={styles.h2}>Add new image</h2>
            <div className={styles.addRow}>
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="key (e.g. hero_about)"
                className={styles.input}
              />
              <input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="https://images.unsplash.com/…"
                className={styles.input}
              />
              <button type="button" onClick={addNew} className={styles.btnPrimary}>
                Add
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Row({
  row,
  onSave,
  onDelete,
  saving,
}: {
  row: SystemConfigRow;
  onSave: (value: string) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [value, setValue] = useState(row.value);
  const dirty = value !== row.value;
  return (
    <div className={styles.card}>
      <div className={styles.preview}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt={row.key} className={styles.previewImg} />
      </div>
      <label className={styles.label}>{row.key}</label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={styles.input}
      />
      <div className={styles.cardActions}>
        <button
          type="button"
          onClick={() => onSave(value)}
          disabled={!dirty || saving}
          className={styles.btnPrimary}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onDelete} className={styles.btnGhost}>
          Delete
        </button>
      </div>
    </div>
  );
}
