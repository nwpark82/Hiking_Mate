import { Header } from '@/components/layout/Header';

export default function Loading() {
  return (
    <>
      <Header title="등산로 상세" />

      <main className="max-w-screen-lg mx-auto pb-20">
        {/* Map Skeleton */}
        <div className="h-80 bg-gray-200 animate-pulse" />

        {/* Content Skeleton */}
        <section className="p-4">
          {/* Title Skeleton */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex gap-2 mb-3">
                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <div className="h-8 w-64 bg-gray-300 rounded animate-pulse mb-2" />
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 shadow-soft border border-gray-100 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-xl mx-auto mb-2" />
                <div className="h-3 w-16 bg-gray-200 rounded mx-auto mb-2" />
                <div className="h-6 w-20 bg-gray-300 rounded mx-auto" />
              </div>
            ))}
          </div>

          {/* Description Skeleton */}
          <div className="mb-6">
            <div className="h-6 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-11/12" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-10/12" />
            </div>
          </div>

          {/* Features Skeleton */}
          <div className="mb-6">
            <div className="h-6 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-24 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
