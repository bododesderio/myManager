export const metadata = { title: 'Invalid Portal Link' };

export default function PortalInvalidPage() {
  return (
    <div
      data-theme="light"
      className="min-h-screen flex items-center justify-center p-4 bg-bg-2"
    >
      <div className="max-w-[400px] rounded-card border border-border bg-bg p-8 text-center">
        {/* Red error icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-light">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="var(--color-error)" strokeWidth="2" />
            <path d="M15 9l-6 6M9 9l6 6" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="mb-2 text-lg font-bold text-text">
          This link has expired
        </h1>

        <p className="mb-6 text-[13px] leading-relaxed text-text-2">
          The portal link you followed is no longer valid. It may have expired or been revoked by your agency. Please request a new link from your account manager.
        </p>

        <p className="mb-1 text-[12px] text-text-muted">
          Need help? Contact your agency or reach out at
        </p>
        <a
          href="mailto:support@mymanager.com"
          className="text-[12px] text-primary underline"
        >
          support@mymanager.com
        </a>

        <div className="mt-6 border-t border-border-light pt-4">
          <span className="text-[10px] text-text-muted">myManager</span>
        </div>
      </div>
    </div>
  );
}
