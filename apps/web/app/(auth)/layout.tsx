export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div data-theme="light" className="min-h-screen bg-bg">{children}</div>;
}
