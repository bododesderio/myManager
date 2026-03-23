'use client';

import { useState, type FormEvent } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ContactFormProps {
  supportEmail?: string;
  salesEmail?: string;
}

export function ContactForm({ supportEmail, salesEmail }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      subject: (form.elements.namedItem('subject') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to send message. Please try again.');
      }

      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="mt-10 rounded-card border border-accent bg-accent/5 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-[20px] font-bold text-text">Message Sent!</h2>
        <p className="mt-2 text-[14px] text-text-2">
          Thanks for reaching out. We will get back to you within 24 hours.
        </p>
        {supportEmail && (
          <p className="mt-4 text-[12px] text-text-muted">
            You can also email us directly at{' '}
            <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
              {supportEmail}
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      <div>
        <label htmlFor="name" className="block text-[13px] font-medium text-text">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 block w-full rounded-input border border-border px-4 py-2.5 text-[14px] text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-[13px] font-medium text-text">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-input border border-border px-4 py-2.5 text-[14px] text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-[13px] font-medium text-text">
          Subject
        </label>
        <select
          id="subject"
          name="subject"
          className="mt-1 block w-full rounded-input border border-border px-4 py-2.5 text-[14px] text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option>General Inquiry</option>
          <option>Sales</option>
          <option>Support</option>
          <option>Partnership</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-[13px] font-medium text-text">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="mt-1 block w-full rounded-input border border-border px-4 py-2.5 text-[14px] text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {status === 'error' && (
        <div className="rounded-input border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-btn bg-primary px-6 py-3 text-[13px] font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
