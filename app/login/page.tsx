import Link from 'next/link';
import { LoginForm } from '@/components/LoginForm';
import { Hotel } from 'lucide-react';

export default function LoginPage() {
  const isDatabaseConfigured = !!process.env.DATABASE_URL;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-3 shadow-lg animate-bounce-slow">
              <Hotel size={32} className="text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link 
              href="/signup" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 hover:underline"
            >
              Create one now
            </Link>
          </p>
        </div>

        {/* Development Mode Notice */}
        {!isDatabaseConfigured && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 animate-fade-in">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 mt-0.5">ℹ️</div>
              <div>
                <p className="text-sm text-blue-800 font-medium mb-1">
                  Testing the app?
                </p>
                <p className="text-xs text-blue-700">
                  Login requires database setup. Use{' '}
                  <Link href="/signup" className="font-semibold underline hover:text-blue-900">
                    &quot;Create Account&quot;
                  </Link>
                  {' '}instead to test with mock data.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white px-6 py-8 shadow-xl rounded-2xl border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
