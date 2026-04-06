export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" className="min-h-screen bg-bg-2">
      {children}
    </div>
  );
}
