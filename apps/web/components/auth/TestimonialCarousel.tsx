'use client';

import { useEffect, useState } from 'react';

interface Testimonial {
  id: string;
  author_name: string;
  author_role: string;
  author_initials: string;
  author_avatar_color: string;
  company: string;
  quote: string;
  rating: number;
}

export function TestimonialCarousel() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/v1/testimonials');
        if (!res.ok) return;
        const data = await res.json();
        // Shuffle randomly
        const shuffled = [...data].sort(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 - 0.5);
        setTestimonials(shuffled);
      } catch { /* ignore */ }
    }
    load();
  }, []);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  const t = testimonials[currentIndex];

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-4 transition-all duration-500">
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: t.rating }, (_, i) => (
          <svg key={i} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-[12px] text-white/90 italic leading-relaxed">
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="flex items-center gap-2.5 mt-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ backgroundColor: t.author_avatar_color || '#1D9E75' }}
        >
          {t.author_initials}
        </div>
        <div>
          <p className="text-[11px] text-white font-medium">{t.author_name}</p>
          <p className="text-[10px] text-white/60">{t.author_role}, {t.company}</p>
        </div>
      </div>
      {testimonials.length > 1 && (
        <div className="flex gap-1.5 mt-3 justify-center">
          {testimonials.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/30'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
