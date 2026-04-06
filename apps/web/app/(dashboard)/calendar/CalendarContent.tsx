'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePostCalendar } from '@/lib/hooks/usePosts';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PLATFORM_COLORS: Record<string, string> = {
  twitter: 'bg-sky-400',
  instagram: 'bg-pink-500',
  facebook: 'bg-blue-600',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-gray-800',
  youtube: 'bg-red-600',
};

function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // getDay() returns 0 for Sunday; shift so Monday = 0
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;
  return { daysInMonth, startDayOfWeek };
}

function formatMonth(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function CalendarContent() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const startDate = `${year}-${pad(month + 1)}-01`;
  const endDate = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`;

  const { data, isLoading } = usePostCalendar(startDate, endDate);

  const posts = useMemo(() => (data as any)?.posts || (data as any) || [], [data]);

  const postsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const post of posts) {
      const date = (post.scheduledAt || post.scheduled_at || post.createdAt || '').slice(0, 10);
      if (date) {
        if (!map[date]) map[date] = [];
        map[date].push(post);
      }
    }
    return map;
  }, [posts]);

  const { daysInMonth, startDayOfWeek } = getMonthData(year, month);
  const totalCells = Math.ceil((daysInMonth + startDayOfWeek) / 7) * 7;

  function goPrev() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function goNext() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [openDate, setOpenDate] = useState<string | null>(null);
  const openDayPosts = openDate ? postsByDate[openDate] || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Content Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">Plan and visualize your content schedule.</p>
        </div>
        <Link
          href="/compose"
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          New Post
        </Link>
      </div>

      <div className="rounded-brand border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <button
            type="button"
            aria-label="Previous month"
            onClick={goPrev}
            className="text-sm font-medium text-gray-600 hover:text-brand-primary"
          >
            &larr; Previous
          </button>
          <h2 className="font-heading text-lg font-semibold">{formatMonth(year, month)}</h2>
          <button
            type="button"
            aria-label="Next month"
            onClick={goNext}
            className="text-sm font-medium text-gray-600 hover:text-brand-primary"
          >
            Next &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-7">
          {DAYS.map((day) => (
            <div
              key={day}
              className="hidden border-b border-r px-3 py-2 text-center text-xs font-semibold text-gray-500 sm:block"
            >
              {day}
            </div>
          ))}

          {isLoading
            ? Array.from({ length: totalCells }, (_, i) => (
                <div
                  key={i}
                  className="min-h-[100px] animate-pulse border-b border-r p-2"
                >
                  <div className="h-3 w-4 rounded bg-gray-200" />
                </div>
              ))
            : Array.from({ length: totalCells }, (_, i) => {
                const dayNum = i - startDayOfWeek + 1;
                const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                const dateStr = isValid
                  ? `${year}-${pad(month + 1)}-${pad(dayNum)}`
                  : '';
                const dayPosts = isValid ? postsByDate[dateStr] || [] : [];
                const isToday = dateStr === todayStr;

                if (!isValid) {
                  return <div key={i} className="hidden border-b border-r bg-gray-50/50 sm:block" />;
                }
                const hasPosts = dayPosts.length > 0;
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => {
                      if (hasPosts) setOpenDate(dateStr);
                      else window.location.href = `/compose?date=${dateStr}`;
                    }}
                    aria-label={`${dayNum}: ${dayPosts.length} posts`}
                    className={`min-h-[60px] border-b border-r p-2 text-left text-xs transition hover:bg-gray-50 sm:min-h-[100px] ${
                      isToday ? 'bg-brand-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          isToday ? 'bg-brand-primary text-white' : 'text-gray-700'
                        }`}
                      >
                        {dayNum}
                      </span>
                      <span className="text-xs text-gray-500 sm:hidden">
                        {DAYS[(startDayOfWeek + dayNum - 1) % 7]}
                      </span>
                    </div>
                    <>
                      <div className="mt-1 space-y-0.5">
                          {dayPosts.slice(0, 3).map((post: any) => {
                            const platforms = post.platforms || [];
                            const platform = platforms[0] || 'default';
                            const color =
                              PLATFORM_COLORS[platform] || 'bg-gray-400';
                            return (
                              <div
                                key={post.id}
                                className="flex items-center gap-1 truncate"
                              >
                                <span
                                  className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${color}`}
                                />
                                <span className="truncate text-[10px] text-gray-600">
                                  {post.caption
                                    ? post.caption.slice(0, 20)
                                    : post.title?.slice(0, 20) || 'Post'}
                                </span>
                              </div>
                            );
                          })}
                        {dayPosts.length > 3 && (
                          <span className="text-[10px] text-gray-400">
                            +{dayPosts.length - 3} more
                          </span>
                        )}
                      </div>
                    </>
                  </button>
                );
              })}
        </div>
      </div>

      {openDate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-posts-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpenDate(null)}
        >
          <div
            className="w-full max-w-lg rounded-brand bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 id="day-posts-title" className="font-heading text-lg font-semibold">
                Posts on {openDate}
              </h3>
              <button
                type="button"
                onClick={() => setOpenDate(null)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <ul className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto">
              {openDayPosts.map((post: any) => (
                <li key={post.id} className="rounded-brand border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    {(post.platforms ?? []).map((p: string) => (
                      <span
                        key={p}
                        className={`inline-block h-2 w-2 rounded-full ${PLATFORM_COLORS[p] ?? 'bg-gray-400'}`}
                      />
                    ))}
                    <span className="text-xs text-gray-500">
                      {post.scheduled_at
                        ? new Date(post.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-gray-800">{post.caption || post.title || 'Untitled post'}</p>
                  <Link
                    href={`/posts/${post.id}`}
                    className="mt-2 inline-block text-xs text-brand-primary hover:underline"
                  >
                    Open post →
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <Link
                href={`/compose?date=${openDate}`}
                className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark"
              >
                + New post on this day
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
