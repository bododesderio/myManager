'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProject, useUpdateProject, useDeleteProject } from '@/lib/hooks/useProjects';
import { useToast } from '@/providers/ToastProvider';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';

export function ProjectSettingsContent({ id }: { id: string }) {
  const router = useRouter();
  const { data: projectData, isLoading } = useProject(id);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { addToast } = useToast();

  const project: any = projectData || {};

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (project.name) setName(project.name);
    if (project.description) setDescription(project.description);
  }, [project.name, project.description]);

  function handleSave() {
    updateProject.mutate(
      { id, name, description },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: 'Project updated successfully.' });
        },
        onError: () => {
          addToast({ type: 'error', message: 'Failed to update project.' });
        },
      },
    );
  }

  function handleDelete() {
    deleteProject.mutate(id, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Project deleted successfully.' });
        router.push('/projects');
      },
      onError: () => {
        addToast({ type: 'error', message: 'Failed to delete project.' });
        setShowDeleteConfirm(false);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/projects/${id}`} className="text-sm text-brand-primary hover:underline">
          &larr; Project #{id}
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-bold">Project Settings</h1>

      {isLoading ? (
        <div className="max-w-2xl space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {/* General settings */}
          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">General</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label htmlFor="projectDesc" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="projectDesc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={updateProject.isPending}
                  className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
                >
                  {updateProject.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Member management */}
          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Members</h2>
            <p className="mt-2 text-sm text-gray-500">Manage team members assigned to this project.</p>
            <Link
              href={`/projects/${id}`}
              className="mt-4 inline-block rounded-brand border border-brand-primary px-4 py-2 text-sm font-medium text-brand-primary transition hover:bg-brand-primary hover:text-white"
            >
              Manage Members
            </Link>
          </div>

          {/* Danger zone */}
          <div className="rounded-brand border border-red-200 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-red-600">Danger Zone</h2>
            <p className="mt-2 text-sm text-gray-500">
              Permanently delete this project and all associated data.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-4 rounded-brand bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Delete Project
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-brand bg-white p-6 shadow-lg">
            <h3 className="font-heading text-lg font-semibold text-red-600">Delete Project</h3>
            <p className="mt-2 text-sm text-gray-500">
              This will permanently delete the project and all associated data. This action cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteProject.isPending}
                className="rounded-brand bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleteProject.isPending ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
