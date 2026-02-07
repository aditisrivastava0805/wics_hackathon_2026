'use client';

import Link from 'next/link';
import { MessageSquare, PartyPopper } from 'lucide-react';

export default function ThreadsPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 mt-1">
          Private conversations with your concert connections
        </p>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No conversations yet
        </h2>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          When someone accepts your connection request (or you accept theirs), 
          a private thread will appear here.
        </p>
        <Link
          href="/concerts"
          className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Browse Concerts
        </Link>
      </div>

      {/* Thread List Placeholder */}
      <div className="mt-6 space-y-3">
        <p className="text-sm text-gray-500 mb-2">
          Thread preview (placeholder):
        </p>
        
        {[1].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-dashed border-gray-300 p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-100 rounded w-24"></div>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-accent-100 text-accent-700 text-xs rounded-full">
                  <PartyPopper size={10} />
                  Going Together!
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded w-32 mt-1"></div>
            </div>
            <div className="h-3 bg-gray-100 rounded w-12"></div>
          </div>
        ))}
        
        <p className="text-xs text-gray-400 text-center mt-4">
          Each thread includes private chat + coordination checklist
        </p>
      </div>
    </div>
  );
}
