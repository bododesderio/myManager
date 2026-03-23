'use client';

import { useState, type FormEvent } from 'react';

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface InlineCommentProps {
  comments: Comment[];
  onAddComment?: (text: string) => void;
}

export function InlineComment({ comments, onAddComment }: InlineCommentProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment?.(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700">Comments ({comments.length})</h4>

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-brand border bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{comment.author}</p>
              <p className="text-xs text-gray-400">{comment.timestamp}</p>
            </div>
            <p className="mt-1 text-sm text-gray-600">{comment.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-brand border border-gray-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
        >
          Comment
        </button>
      </form>
    </div>
  );
}
