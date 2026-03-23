'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProjects, useDeleteProject } from '@/lib/hooks/useProjects';
import { useToast } from '@/providers/ToastProvider';
import { CardGridSkeleton } from '@/components/skeletons/CardSkeleton';

export function ProjectsContent() {
  const { data, isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const { addToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const projects: any[] = (data as any)?.projects || (data as any) || [];

  function handleDelete(id: string) {
    setDeletingId(id);
  }

  function confirmDelete() {
    if (!deletingId) return;
    deleteProject.mutate(deletingId, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Project deleted successfully.' });
        setDeletingId(null);
      },
      onError: () => {
        addToast({ type: 'error', message: 'Failed to delete project.' });
        setDeletingId(null);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">Manage client projects and workspaces.</p>
        </div>
        <button className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark">
          New Project
        </button>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : projects.length === 0 ? (
        <div className="rounded-brand border bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12.5l4.5 4.5L12 12m0 0l5.5 5m-5.5-5V3" />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-gray-900">No projects yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create a project to start organizing your work.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <div key={project.id} className="group relative rounded-brand border bg-white p-5 shadow-sm transition hover:border-brand-primary">
              <Link href={`/projects/${project.id}`} className="absolute inset-0 z-10" />
              <h3 className="font-heading text-lg font-semibold">{project.name}</h3>
              {project.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{project.description}</p>
              )}
              <div className="mt-3 flex gap-4 text-sm text-gray-500">
                <span>{project.memberCount ?? project.members ?? 0} members</span>
                <span>{project.postCount ?? project.posts ?? 0} posts</span>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(project.id);
                }}
                className="relative z-20 mt-3 text-sm text-red-500 opacity-0 transition hover:underline group-hover:opacity-100"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-brand bg-white p-6 shadow-lg">
            <h3 className="font-heading text-lg font-semibold">Delete Project</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this project? All associated data will be lost.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteProject.isPending}
                className="rounded-brand bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleteProject.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
