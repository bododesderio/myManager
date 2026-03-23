'use client';

import { useState } from 'react';

interface CalendarPost {
  id: string;
  title: string;
  date: string;
  platform: string;
  status: 'scheduled' | 'published' | 'draft';
}

interface ContentCalendarProps {
  posts?: CalendarPost[];
  month?: number;
  year?: number;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function ContentCalendar({ posts = [], month: initialMonth, year: initialYear }: ContentCalendarProps) {
  const now = new Date();
  const [month, setMonth] = useState(initialMonth ?? now.getMonth());
  const [year, setYear] = useState(initialYear ?? now.getFullYear());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-based

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const getPostsForDay = (day: number): CalendarPost[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter((p) => p.date === dateStr);
  };

  return (
    <div className="rounded-brand border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <button onClick={prevMonth} className="text-sm font-medium text-gray-600 hover:text-brand-primary">
          &larr; Previous
        </button>
        <h2 className="font-heading text-lg font-semibold">{monthName} {year}</h2>
        <button onClick={nextMonth} className="text-sm font-medium text-gray-600 hover:text-brand-primary">
          Next &rarr;
        </button>
      </div>
      <div className="grid grid-cols-7">
        {DAYS.map((day) => (
          <div key={day} className="border-b border-r px-3 py-2 text-center text-xs font-semibold text-gray-500">
            {day}
          </div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="min-h-[100px] border-b border-r bg-gray-50" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayPosts = getPostsForDay(day);
          return (
            <div key={day} className="min-h-[100px] border-b border-r p-2 hover:bg-gray-50">
              <span className="text-xs text-gray-500">{day}</span>
              {dayPosts.map((post) => (
                <div key={post.id} className="mt-1 truncate rounded bg-brand-primary/10 px-1.5 py-0.5 text-[10px] text-brand-primary">
                  {post.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
