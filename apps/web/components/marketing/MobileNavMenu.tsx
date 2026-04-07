'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';

interface MobileNavMenuProps {
  links: Array<{ label: string; href: string }>;
}

export function MobileNavMenu({ links }: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="flex flex-col items-center justify-center gap-[5px]"
      >
        <span
          className={`block h-[2px] w-5 bg-text transition-transform ${
            open ? 'translate-y-[7px] rotate-45' : ''
          }`}
        />
        <span
          className={`block h-[2px] w-5 bg-text transition-opacity ${
            open ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`block h-[2px] w-5 bg-text transition-transform ${
            open ? '-translate-y-[7px] -rotate-45' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-16 z-50 w-full border-b border-border bg-white px-6 py-4">
          <ul className="flex flex-col gap-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href as Route}
                  onClick={() => setOpen(false)}
                  className="block text-[14px] font-semibold text-text transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-[14px] font-semibold text-text transition-colors hover:text-primary"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="rounded-btn bg-primary px-4 py-2 text-center text-[11px] font-bold text-white transition-opacity hover:opacity-90"
            >
              Get started free
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
