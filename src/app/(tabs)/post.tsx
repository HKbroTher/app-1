import { Redirect } from 'expo-router';

// The Post tab never shows its own screen (its tabPress opens /create); this covers deep links.
export default function PostTab() {
  return <Redirect href="/create" />;
}
