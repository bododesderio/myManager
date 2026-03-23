'use client';

import { useState } from 'react';

interface ScheduleSlot {
  id: string;
  time: string;
  day: string;
  postId?: string;
  postTitle?: string;
}

interface DragDropSchedulerProps {
  slots?: ScheduleSlot[];
  onSlotUpdate?: (slotId: string, postId: string) => void;
}

const TIME_SLOTS = ['09:00', '12:00', '15:00', '18:00', '21:00'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function DragDropScheduler({ slots = [], onSlotUpdate }: DragDropSchedulerProps) {
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  const getSlot = (day: string, time: string): ScheduleSlot | undefined => {
    return slots.find((s) => s.day === day && s.time === time);
  };

  return (
    <div className="rounded-brand border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h3 className="font-heading text-lg font-semibold">Weekly Schedule</h3>
        <p className="text-sm text-gray-500">Drag and drop posts to time slots.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time</th>
              {DAYS.map((day) => (
                <th key={day} className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((time) => (
              <tr key={time} className="border-b">
                <td className="px-4 py-3 text-xs text-gray-500">{time}</td>
                {DAYS.map((day) => {
                  const slot = getSlot(day, time);
                  const slotKey = `${day}-${time}`;
                  return (
                    <td key={slotKey} className="px-2 py-2">
                      <div
                        onClick={() => {
                          setActiveSlot(activeSlot === slotKey ? null : slotKey);
                          if (slot && onSlotUpdate) onSlotUpdate(slot.id, '');
                        }}
                        className={`min-h-[48px] cursor-pointer rounded-brand border border-dashed p-1.5 text-center text-xs transition ${
                          activeSlot === slotKey ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {slot?.postTitle ? (
                          <span className="text-brand-primary">{slot.postTitle}</span>
                        ) : (
                          <span className="text-gray-300">+</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
