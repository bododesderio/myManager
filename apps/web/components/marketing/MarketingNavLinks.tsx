'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import styles from './MarketingNavLinks.module.css';

interface NavLink {
  label: string;
  href: string;
}

export function MarketingNavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <ul className={styles.list}>
      {links.map((link) => {
        const active = isActive(link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href as Route}
              aria-current={active ? 'page' : undefined}
              className={`${styles.link} ${active ? styles.linkActive : ''}`}
            >
              {link.label}
              {active && <span className={styles.underline} aria-hidden="true" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
