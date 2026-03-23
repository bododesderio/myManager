import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How myManager collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-4xl font-extrabold">Privacy Policy</h1>
        <p className="mt-4 text-sm text-gray-500">Last updated: March 1, 2026</p>

        <div className="mt-10 space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-bold">1. Information We Collect</h2>
            <p className="mt-3">
              We collect information you provide directly to us, such as when you create an account,
              connect social media accounts, or contact support. This includes your name, email
              address, and social media account tokens.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold">2. How We Use Your Information</h2>
            <p className="mt-3">
              We use the information we collect to provide, maintain, and improve our services,
              process transactions, send communications, and for analytics and research purposes.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold">3. Data Security</h2>
            <p className="mt-3">
              We implement industry-standard security measures to protect your data, including
              encryption at rest and in transit, regular security audits, and access controls.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold">4. Data Retention</h2>
            <p className="mt-3">
              We retain your data for as long as your account is active. You may request deletion of
              your data at any time through the settings page or by contacting support.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold">5. Contact Us</h2>
            <p className="mt-3">
              If you have questions about this privacy policy, please contact us at
              privacy@mymanager.app.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
