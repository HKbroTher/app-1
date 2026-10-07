import { ProfileView } from '@/components/profile-view';
import { CURRENT_USER_ID } from '@/data/mock';

export default function MyProfileScreen() {
  return <ProfileView userId={CURRENT_USER_ID} inTabs />;
}
