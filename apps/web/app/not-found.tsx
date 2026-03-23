import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-heading text-6xl font-bold text-brand-primary">404</h1>
      <h2 className="font-heading text-2xl font-semibold">Page Not Found</h2>
      <p className="max-w-md text-gray-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-brand bg-brand-primary px-6 py-3 text-white transition hover:bg-brand-primary-dark"
      >
        Go Home
      </Link>
    </main>
  );
}
