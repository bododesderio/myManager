'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';

const navSections = [
  {
    label: 'Content',
    items: [
      { label: 'Pages', href: '/admin/content/pages' },
      { label: 'Blog Posts', href: '/admin/content/blog' },
      { label: 'FAQ', href: '/admin/content/faq' },
      { label: 'Testimonials', href: '/admin/content/testimonials' },
    ],
  },
  {
    label: 'Site Config',
    items: [
      { label: 'Nav Links', href: '/admin/content/nav-links' },
      { label: 'Email Templates', href: '/admin/content/emails' },
      { label: 'Translations', href: '/admin/content/translations' },
      { label: 'Legal', href: '/admin/content/legal' },
    ],
  },
  {
    label: 'Leads & Subscribers',
    items: [
      { label: 'Newsletter', href: '/admin/content/newsletter' },
      { label: 'Contact Leads', href: '/admin/content/leads' },
    ],
  },
];

export function ContentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6">
      {/* Sidebar sub-nav */}
      <aside className="w-56 shrink-0">
        <nav className="sticky top-24 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {section.label}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href as Route}
                        className={`block rounded-md px-3 py-1.5 text-sm transition ${
                          isActive
                            ? 'bg-brand-primary/10 font-semibold text-brand-primary'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
