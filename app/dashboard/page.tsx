'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/AuthGuard';
import { Navigation } from '@/components/Navigation';
import Link from 'next/link';
import { FileText, DollarSign, BarChart3, User } from 'lucide-react';

function DashboardContent() {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Manage Menu',
      description: 'Add, edit, or remove menu items',
      href: '/menu',
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Generate Bill',
      description: 'Create invoices for tables',
      href: '/billing',
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'View Reports',
      description: 'Check revenue and invoices',
      href: '/reports',
      icon: BarChart3,
      color: 'bg-purple-500',
    },
    {
      title: 'Update Profile',
      description: 'Manage hotel information',
      href: '/profile',
      icon: User,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Welcome to your dashboard
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Hotel Name</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">
                {user?.hotelName}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Email</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                {user?.email}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Tables</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">
                {user?.tableCount}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 sm:p-6 min-h-[120px]"
                >
                  <div className={`${action.color} w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="text-white" size={20} />
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                    {action.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
