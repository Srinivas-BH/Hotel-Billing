'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';

function BillingContent() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to orders page - billing is now integrated there
    router.replace('/orders');
  }, [router]);

  return null;
}

export default function BillingPage() {
  return (
    <AuthGuard>
      <BillingContent />
    </AuthGuard>
  );
}
