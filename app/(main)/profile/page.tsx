'use client';

import { useAuth } from '@/context/auth-context';
import { User, Mail, Music, DollarSign, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  const { user, userProfile } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-gray-500 mt-1">
          Manage your preferences and account settings
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {userProfile?.displayName || 'User'}
            </h2>
            <p className="text-gray-500 flex items-center gap-1">
              <Mail size={14} />
              {user?.email}
            </p>
          </div>
        </div>

        {/* Current Preferences */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Music size={16} className="text-primary-600" />
              <span className="font-medium text-gray-700">Music Preferences</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                <span className="text-gray-500">Genres:</span>{' '}
                {userProfile?.musicPreferences?.genres?.join(', ') || 'Not set'}
              </p>
              <p>
                <span className="text-gray-500">Artists:</span>{' '}
                {userProfile?.musicPreferences?.artists?.join(', ') || 'Not set'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-green-600" />
              <span className="font-medium text-gray-700">Budget Range</span>
            </div>
            <p className="text-sm text-gray-600">
              {userProfile?.budgetRange === 'under40' && 'Under $40'}
              {userProfile?.budgetRange === '40to80' && '$40 - $80'}
              {userProfile?.budgetRange === 'flexible' && 'Flexible'}
              {!userProfile?.budgetRange && 'Not set'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-purple-600" />
              <span className="font-medium text-gray-700">Concert Vibes</span>
            </div>
            <p className="text-sm text-gray-600">
              {userProfile?.concertVibes?.map((v) => {
                if (v === 'moshPit') return 'Mosh Pit Energy';
                if (v === 'chillBalcony') return 'Chill Balcony';
                if (v === 'indieListening') return 'Indie Listening';
                return v;
              }).join(', ') || 'Not set'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form Placeholder */}
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
        <p className="text-gray-500 mb-4">
          Profile editing form will be implemented here.
        </p>
        <button
          disabled
          className="px-6 py-2 bg-gray-200 text-gray-400 rounded-lg"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
