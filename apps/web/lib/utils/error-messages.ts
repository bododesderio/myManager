import type { ApiError } from '@mymanager/types';

const ERROR_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password.',
  AUTH_EMAIL_NOT_VERIFIED: 'Please verify your email before logging in.',
  AUTH_TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  AUTH_TOKEN_INVALID: 'Invalid authentication token.',
  AUTH_REFRESH_TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  AUTH_2FA_REQUIRED: 'Two-factor authentication code is required.',
  AUTH_2FA_INVALID: 'Invalid two-factor authentication code.',
  AUTH_ACCOUNT_SUSPENDED: 'Your account has been suspended. Contact support.',

  PLAN_LIMIT_POSTS: 'You have reached your monthly post limit. Upgrade your plan to post more.',
  PLAN_LIMIT_ACCOUNTS: 'You have reached your connected accounts limit. Upgrade to connect more.',
  PLAN_LIMIT_SEATS: 'You have reached your team member limit. Upgrade for more seats.',
  PLAN_LIMIT_PROJECTS: 'You have reached your project limit. Upgrade for more projects.',
  PLAN_LIMIT_STORAGE: 'You have reached your storage limit. Upgrade for more space.',
  PLAN_LIMIT_AI_CREDITS: 'You have used all your AI credits this month. Upgrade for more.',
  PLAN_LIMIT_SCHEDULED_QUEUE: 'Your scheduled queue is full. Upgrade for more scheduled posts.',
  PLAN_FEATURE_DISABLED: 'This feature is not available on your current plan.',

  WORKSPACE_NOT_FOUND: 'Workspace not found.',
  WORKSPACE_ACCESS_DENIED: 'You do not have access to this workspace.',
  WORKSPACE_MEMBER_EXISTS: 'This user is already a member of the workspace.',

  POST_NOT_FOUND: 'Post not found.',
  POST_ALREADY_PUBLISHED: 'This post has already been published.',
  POST_VALIDATION_FAILED: 'Post validation failed. Please check your content.',
  POST_PUBLISHING_FAILED: 'Failed to publish post. Please try again.',

  SOCIAL_ACCOUNT_NOT_FOUND: 'Social account not found.',
  SOCIAL_TOKEN_EXPIRED: 'Your social account connection has expired. Please reconnect.',
  SOCIAL_TOKEN_REFRESH_FAILED: 'Failed to refresh social account token. Please reconnect.',
  SOCIAL_API_ERROR: 'Social platform API error. Please try again later.',

  MEDIA_UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  MEDIA_FILE_TOO_LARGE: 'File exceeds the maximum size allowed.',
  MEDIA_INVALID_TYPE: 'Invalid file type.',
  MEDIA_STORAGE_EXCEEDED: 'Storage limit exceeded. Upgrade your plan or delete some files.',

  BILLING_PAYMENT_FAILED: 'Payment failed. Please check your payment method.',
  BILLING_SUBSCRIPTION_INACTIVE: 'Your subscription is inactive.',
  BILLING_WEBHOOK_INVALID: 'Invalid billing webhook.',

  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',
};

export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';

  // Handle ApiError shape
  if (typeof error === 'object' && 'error' in (error as any)) {
    const apiError = error as ApiError;
    const code = apiError.error.code;
    return ERROR_MESSAGES[code] || apiError.error.message || 'An unexpected error occurred.';
  }

  // Handle Error instances
  if (error instanceof Error) {
    return ERROR_MESSAGES[error.message] || error.message;
  }

  // Handle string
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  return 'An unexpected error occurred.';
}
