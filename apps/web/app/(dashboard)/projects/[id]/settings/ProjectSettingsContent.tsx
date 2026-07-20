'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProject, useUpdateProject, useDeleteProject } from '@/lib/hooks/useProjects';
import { useToast } from '@/providers/ToastProvider';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Card } from '@mymanager/ui';

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
        <Link href={`/projects/${id}`} className="text-sm text-primary hover:underline">
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
          <Card>
            <h2 className="font-heading text-lg font-semibold">General</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-text-2">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-brand border border-border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="projectDesc" className="block text-sm font-medium text-text-2">
                  Description
                </label>
                <RichTextEditor
                  value={description}
                  onChange={(html) => setDescription(html)}
                  minHeight={100}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={updateProject.isPending}
                  className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
                >
                  {updateProject.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Card>

          {/* Member management */}
          <Card>
            <h2 className="font-heading text-lg font-semibold">Members</h2>
            <p className="mt-2 text-sm text-text-2">Manage team members assigned to this project.</p>
            <Link
              href={`/projects/${id}`}
              className="mt-4 inline-block rounded-brand border border-primary px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-white"
            >
              Manage Members
            </Link>
          </Card>

          {/* Danger zone */}
          <Card className="border-red-200">
            <h2 className="font-heading text-lg font-semibold text-red-600">Danger Zone</h2>
            <p className="mt-2 text-sm text-text-2">
              Permanently delete this project and all associated data.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-4 rounded-brand bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Delete Project
            </button>
          </Card>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-brand bg-bg p-6 shadow-lg">
            <h3 className="font-heading text-lg font-semibold text-red-600">Delete Project</h3>
            <p className="mt-2 text-sm text-text-2">
              This will permanently delete the project and all associated data. This action cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-brand border border-border px-4 py-2 text-sm font-medium transition hover:border-primary"
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
