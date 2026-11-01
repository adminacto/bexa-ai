export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="text-gray-400">
          You don't have permission to access this page.
        </p>
        <a
          href="/dashboard"
          className="inline-block text-sm text-white hover:text-gray-300 underline"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
