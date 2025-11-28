import { AuthGuard } from '@/components/AuthGuard';
import { Navigation } from '@/components/Navigation';
import { ProfileForm } from '@/components/ProfileForm';

function ProfilePageContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Hotel Profile</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your hotel information and settings
            </p>
          </div>

          <div className="bg-white px-4 sm:px-6 py-6 sm:py-8 shadow rounded-lg">
            <ProfileForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  );
}
