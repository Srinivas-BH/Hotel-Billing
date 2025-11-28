export default function BillingLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow h-16"></div>
      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 sm:mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-12 bg-gray-100 rounded"></div>
            </div>
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-12 bg-gray-100 rounded"></div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 sm:p-6 shadow animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-100 rounded"></div>
              <div className="h-12 bg-gray-100 rounded"></div>
              <div className="h-12 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
