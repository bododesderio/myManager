export const metadata = { title: 'Invalid Portal Link' };

export default function PortalInvalidPage() {
  return (
    <div
      data-theme="light"
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-bg-2)' }}
    >
      <div
        className="text-center"
        style={{
          maxWidth: 400,
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding: 32,
        }}
      >
        {/* Red error icon */}
        <div
          className="mx-auto flex items-center justify-center"
          style={{
            width: 48,
            height: 48,
            borderRadius: 9999,
            backgroundColor: 'var(--color-error-light)',
            marginBottom: 16,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="var(--color-error)" strokeWidth="2" />
            <path d="M15 9l-6 6M9 9l6 6" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h1
          className="font-bold"
          style={{ fontSize: 18, color: 'var(--color-text)', marginBottom: 8 }}
        >
          This link has expired
        </h1>

        <p
          style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.5, marginBottom: 24 }}
        >
          The portal link you followed is no longer valid. It may have expired or been revoked by your agency. Please request a new link from your account manager.
        </p>

        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
          Need help? Contact your agency or reach out at
        </p>
        <a
          href="mailto:support@mymanager.com"
          style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'underline' }}
        >
          support@mymanager.com
        </a>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border-light)' }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>myManager</span>
        </div>
      </div>
    </div>
  );
}
