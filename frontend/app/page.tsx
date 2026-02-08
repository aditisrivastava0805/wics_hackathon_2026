import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-primary-700 mb-4">
          Encore
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Find your concert buddy at UT Austin. Connect with students who share your music taste,
          budget, and concert vibes.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 bg-white text-primary-600 border border-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
          >
            Sign Up
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Only available for @utexas.edu email addresses
        </p>
      </div>
    </main>
  );
}
