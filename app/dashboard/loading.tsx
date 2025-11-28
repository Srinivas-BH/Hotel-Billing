export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow h-16"></div>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="rounded-lg bg-white p-4 sm:p-6 shadow mb-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 bg-gray-100 rounded-md h-20"></div>
              <div className="p-3 bg-gray-100 rounded-md h-20"></div>
              <div className="p-3 bg-gray-100 rounded-md h-20"></div>
            </div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow h-32"></div>
            <div className="bg-white rounded-lg shadow h-32"></div>
            <div className="bg-white rounded-lg shadow h-32"></div>
            <div className="bg-white rounded-lg shadow h-32"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
