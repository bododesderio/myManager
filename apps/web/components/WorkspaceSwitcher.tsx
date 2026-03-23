'use client';

import { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (workspaces.length <= 1) {
    return (
      <div className="px-2 py-1.5 text-xs font-medium text-gray-500 truncate">
        {activeWorkspace?.name || 'My Workspace'}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-brand px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
      >
        <div className="h-6 w-6 rounded-md bg-brand-primary/20 flex items-center justify-center text-xs font-bold text-brand-primary">
          {activeWorkspace?.name?.[0]?.toUpperCase() || 'W'}
        </div>
        <span className="flex-1 truncate text-left text-xs font-medium">
          {activeWorkspace?.name || 'Select Workspace'}
        </span>
        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-brand border bg-white py-1 shadow-lg">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => {
                setActiveWorkspace(workspace.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                workspace.id === activeWorkspaceId ? 'bg-brand-primary/5 text-brand-primary' : 'text-gray-700'
              }`}
            >
              <div className="h-6 w-6 rounded-md bg-brand-primary/20 flex items-center justify-center text-xs font-bold text-brand-primary">
                {workspace.name[0]?.toUpperCase()}
              </div>
              <span className="truncate">{workspace.name}</span>
              {workspace.id === activeWorkspaceId && (
                <svg className="ml-auto h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
