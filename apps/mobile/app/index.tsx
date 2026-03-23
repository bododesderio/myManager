import { Redirect } from 'expo-router';

export default function Index() {
  const isAuthenticated = false; // TODO: check auth state
  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/(auth)/login'} />;
}
