import Link from 'next/link';
import { Hotel, FileText, TrendingUp, Shield } from 'lucide-react';

export default function Home() {
  const isDatabaseConfigured = !!process.env.DATABASE_URL;
  const isJWTConfigured = !!process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your_jwt_secret_key_here';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-8">
      <div className="max-w-4xl w-full space-y-12 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg animate-bounce-slow">
              <Hotel size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Hotel Billing Admin Portal
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your hotel&apos;s billing operations with AI-powered invoice generation
          </p>
        </div>



        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <FileText className="text-blue-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Billing</h3>
            <p className="text-sm text-gray-600">
              AI-powered invoice generation with automatic calculations for GST, service charges, and discounts
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Revenue Reports</h3>
            <p className="text-sm text-gray-600">
              Comprehensive daily and monthly revenue tracking with CSV and PDF export capabilities
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Shield className="text-green-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
            <p className="text-sm text-gray-600">
              Enterprise-grade security with JWT authentication and encrypted data storage
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/signup"
            className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 text-white font-medium shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 text-center min-h-[44px] flex items-center justify-center transition-all duration-200 transform hover:scale-105"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto rounded-lg border-2 border-blue-600 px-8 py-3 text-blue-600 font-medium hover:bg-blue-50 text-center min-h-[44px] flex items-center justify-center transition-all duration-200 transform hover:scale-105"
          >
            Sign In
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
          <p>Built with Next.js, React, and PostgreSQL</p>
        </div>
      </div>
    </main>
  );
}
