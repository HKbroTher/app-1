import { router, Tabs } from 'expo-router';

import { TabBar } from '@/components/ui/tab-bar';
import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Explore' }} />
      <Tabs.Screen
        name="post"
        options={{ title: 'Post' }}
        listeners={{
          // Post doesn't switch tabs: it opens the full-screen create flow on top.
          tabPress: (e) => {
            e.preventDefault();
            router.push('/create');
          },
        }}
      />
      <Tabs.Screen name="messages" options={{ title: 'Message' }} />
      <Tabs.Screen name="profile" options={{ title: 'My Profile' }} />
    </Tabs>
  );
}
