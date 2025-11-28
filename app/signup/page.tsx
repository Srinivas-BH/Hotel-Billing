import Link from 'next/link';
import { SignupForm } from '@/components/SignupForm';
import { Hotel } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-3 shadow-lg animate-bounce-slow">
              <Hotel size={32} className="text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create your hotel account
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
        <div className="mt-8 bg-white px-6 py-8 shadow-xl rounded-2xl border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
          <SignupForm />
        </div>
        <p className="text-center text-xs text-gray-500 animate-fade-in">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
