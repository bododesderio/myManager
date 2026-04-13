import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using the myManager platform.',
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-4xl font-extrabold">Terms of Service</h1>
        <p className="mt-4 text-sm text-text-muted">Last updated: March 1, 2026</p>

        <div className="mt-10 space-y-8 text-text-2 leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-bold">1. Acceptance of Terms</h2>
            <p className="mt-3">
              By accessing or using myManager, you agree to be bound by these terms of service. If
              you do not agree to these terms, you may not use the platform.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold">2. Account Responsibilities</h2>
            <p className="mt-3">
              You are responsible for maintaining the security of your account credentials and for
              all activities that occur under your account. You must notify us immediately of any
              unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold">3. Acceptable Use</h2>
            <p className="mt-3">
              You agree not to use the service to publish content that violates any applicable laws,
              infringes on intellectual property rights, or violates the terms of any connected
              social media platform.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold">4. Service Availability</h2>
            <p className="mt-3">
              We strive to maintain high availability but do not guarantee uninterrupted service.
              Scheduled maintenance windows will be communicated in advance.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold">5. Termination</h2>
            <p className="mt-3">
              Either party may terminate the agreement at any time. Upon termination, your data will
              be retained for 30 days before permanent deletion.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
