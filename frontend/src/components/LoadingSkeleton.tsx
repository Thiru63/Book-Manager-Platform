'use client';

export default function LoadingSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white dark:bg-gray-800/60 rounded-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 animate-pulse"
                >
                    <div className="flex">
                        <div className="w-24 sm:w-28 h-[160px] bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                        <div className="flex-1 p-4 space-y-3">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                            <div className="flex gap-2">
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                            </div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 mt-auto" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
            ))}
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 animate-pulse">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
    );
}
