'use client';

import { useState } from 'react';

interface NewsletterFormProps {
  title?: string;
  description?: string;
  disclaimer?: string;
}

export function NewsletterForm({ title, description, disclaimer }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Something went wrong');
      }

      setStatus('success');
      setMessage('Thanks for subscribing!');
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message ?? 'Something went wrong');
    }
  }

  return (
    <div>
      {title && (
        <h4 className="mb-3 text-[11px] font-bold uppercase text-text-muted">
          {title}
        </h4>
      )}
      {description && (
        <p className="mb-3 text-[12px] text-text-muted">
          {description}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-input border border-border bg-bg px-3 py-2 text-[12px] text-text outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-btn bg-primary px-4 py-2 text-[11px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === 'loading' ? '...' : 'Subscribe'}
        </button>
      </form>

      {status === 'success' && (
        <p className="mt-2 text-[11px] text-primary">
          {message}
        </p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-[11px] text-error">
          {message}
        </p>
      )}

      {disclaimer && (
        <p className="mt-2 text-[10px] text-text-muted">
          {disclaimer}
        </p>
      )}
    </div>
  );
}
