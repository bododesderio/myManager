import { ErrorPage, Illustrations } from '@/components/errors/ErrorPage';

export default function NotFound() {
  return (
    <ErrorPage
      code="404"
      title="Page not found"
      subtitle="We can't find what you're looking for."
      whatHappened="The page may have been moved, renamed, or never existed. Double-check the URL, or head back to the dashboard."
      illustration={<Illustrations.NotFound />}
      primaryAction={{ label: 'Go home', href: '/' }}
      secondaryAction={{ label: 'Open dashboard', href: '/home' }}
    />
  );
}
