'use client';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">Hello World!</h1>
        <p className="text-xl text-gray-600 mb-8">
          Welcome to the Book Analyzer application
        </p>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-2">Available Endpoints</h2>
            <div className="space-y-2 text-left">
              <div className="flex items-center space-x-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono">
                  GET
                </span>
                <span className="font-mono">/api/hello</span>
                <span className="text-gray-500">- Hello World endpoint</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">
                  GET
                </span>
                <span className="font-mono">/api/health</span>
                <span className="text-gray-500">- Health check endpoint</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-mono">
                  GET
                </span>
                <span className="font-mono">/api/status</span>
                <span className="text-gray-500">- Status endpoint</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
