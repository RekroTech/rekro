import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Welcome, {user.name}!
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            This is a protected page. Only authenticated users can access this content.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                User ID
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {user.id}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                Email
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {user.email}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                Status
              </h3>
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                Authenticated ✓
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
