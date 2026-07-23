'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';

const navSections = [
  {
    label: 'Content',
    items: [
      { label: 'Pages', href: '/superadmin/content/pages' },
      { label: 'Blog Posts', href: '/superadmin/content/blog' },
      { label: 'FAQ', href: '/superadmin/content/faq' },
      { label: 'Testimonials', href: '/superadmin/content/testimonials' },
    ],
  },
  {
    label: 'Site Config',
    items: [
      { label: 'Nav Links', href: '/superadmin/content/nav-links' },
      { label: 'Email Templates', href: '/superadmin/content/emails' },
      { label: 'Translations', href: '/superadmin/content/translations' },
      { label: 'Legal', href: '/superadmin/content/legal' },
    ],
  },
  {
    label: 'Leads & Subscribers',
    items: [
      { label: 'Newsletter', href: '/superadmin/content/newsletter' },
      { label: 'Contact Leads', href: '/superadmin/content/leads' },
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
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
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
                            ? 'bg-primary/10 font-semibold text-primary'
                            : 'text-text-2 hover:bg-bg-2 hover:text-text'
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
