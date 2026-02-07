'use client';

import { Users, UserCheck, Clock, MessageSquare } from 'lucide-react';

export default function ConnectionsPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
        <p className="text-gray-500 mt-1">
          Manage your concert connection requests
        </p>
      </div>

      {/* Incoming Requests Placeholder */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-yellow-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Incoming Requests
          </h2>
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            0
          </span>
        </div>
        
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
          <p className="text-gray-400 text-sm">
            Incoming connection requests will appear here.<br />
            You can accept or decline each request.
          </p>
        </div>
      </section>

      {/* Sent Requests Placeholder */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Sent Requests
          </h2>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
            0
          </span>
        </div>
        
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
          <p className="text-gray-400 text-sm">
            Your pending connection requests will appear here.<br />
            Waiting for the other person to respond.
          </p>
        </div>
      </section>

      {/* Accepted Connections Placeholder */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <UserCheck size={18} className="text-green-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Your Connections
          </h2>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
            0
          </span>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">No connections yet</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Join a concert room and connect with others who share your music taste!
          </p>
        </div>
      </section>
    </div>
  );
}
