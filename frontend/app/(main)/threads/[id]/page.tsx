'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PartyPopper, Send, Plus, Check } from 'lucide-react';

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.id as string;

  return (
    <div>
      {/* Back button */}
      <Link
        href="/threads"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={18} />
        <span>Back to Messages</span>
      </Link>

      {/* Thread Header Placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-medium">JD</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Jane Doe</p>
              <p className="text-sm text-gray-500">Taylor Swift @ Moody Center</p>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            <PartyPopper size={18} />
            Going Together?
          </button>
        </div>
        
        <p className="text-xs text-gray-400 mt-3">Thread ID: {threadId}</p>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[450px]">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Private Chat</h2>
            </div>
            
            <div className="flex-1 p-4 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">
                  Private messages will appear here.
                </p>
                <p className="text-gray-300 text-xs">
                  Real-time updates via Firestore onSnapshot
                </p>
              </div>
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
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Checklist Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">
              Coordination Checklist
            </h2>
            
            <div className="space-y-2 mb-4">
              {['Buy tickets', 'Decide meeting spot', 'Plan transportation'].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                >
                  <button className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-primary-500">
                    {i === 0 && <Check size={12} className="text-green-500" />}
                  </button>
                  <span className={`flex-1 text-sm ${i === 0 ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add item..."
                disabled
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                disabled
                className="p-2 bg-gray-200 text-gray-400 rounded-lg"
              >
                <Plus size={18} />
              </button>
            </div>
            
            <p className="text-xs text-gray-400 mt-4 text-center">
              Shared checklist for concert coordination
            </p>
          </div>

          {/* Concert Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Concert Details
            </h3>
            <p className="text-sm text-gray-600">Taylor Swift - Eras Tour</p>
            <p className="text-sm text-gray-500">Moody Center</p>
            <p className="text-sm text-gray-500">March 15, 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
