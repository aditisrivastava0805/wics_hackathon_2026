'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, MessageSquare, UserPlus } from 'lucide-react';

export default function ConcertRoomPage() {
  const params = useParams();
  const concertId = params.id as string;

  return (
    <div>
      {/* Back button */}
      <Link
        href="/concerts"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={18} />
        <span>Back to Concerts</span>
      </Link>

      {/* Concert Header Placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-xs">Image</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Concert Name</h1>
            <p className="text-primary-600 font-medium">Artist Name</p>
            <p className="text-gray-500 text-sm mt-1">Venue • Date</p>
            <p className="text-xs text-gray-400 mt-2">Concert ID: {concertId}</p>
          </div>
        </div>
        
        <button className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
          Join This Room
        </button>
      </div>

      {/* Room Content Placeholder */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Members Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-900">Room Members</h2>
            </div>
            
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-gray-200"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-100 rounded w-20 mb-1"></div>
                    <div className="h-2 bg-gray-100 rounded w-16"></div>
                  </div>
                  <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg">
                    <UserPlus size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            <p className="mt-4 text-xs text-gray-400 text-center">
              Member cards will show compatibility scores
            </p>
          </div>
        </div>

        {/* Chat Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[400px]">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <MessageSquare size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-900">Room Chat</h2>
            </div>
            
            <div className="flex-1 p-4 flex items-center justify-center">
              <p className="text-gray-400 text-sm text-center">
                Public room chat will appear here.<br />
                Real-time updates via Firestore.
              </p>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  disabled
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  disabled
                  className="px-4 py-2 bg-gray-200 text-gray-400 rounded-lg"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
