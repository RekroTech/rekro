import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const user = await getSession();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-900">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-zinc-950 sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to Rekro
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {user ? (
              <>
                You are logged in as <span className="font-medium text-zinc-950 dark:text-zinc-50">{user.email}</span>.
                Go to your dashboard to see protected content.
              </>
            ) : (
              <>
                This is a public page. Sign in to access your dashboard and protected content.
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          {user ? (
            <Link
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 md:w-[158px]"
              href="/dashboard"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 md:w-[158px]"
              href="/login"
            >
              Sign In
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
