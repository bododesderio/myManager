import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Dashboard | MyManager',
};

export default function DashboardPage() {
  redirect('/home');
}
