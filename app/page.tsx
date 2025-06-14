//app/page.tsx

import { LoginForm } from "@/components/login-form"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/40">
      <div className="w-full max-w-md flex flex-col items-center justify-center space-y-8 bg-white/90 dark:bg-muted/90 rounded-2xl shadow-2xl p-8 border border-border">
        <img
          src="/favicon.png"
          alt="Bol Bachhan Logo"
          className="w-20 h-20 mb-2 drop-shadow-[0_0_24px_rgba(56,189,248,0.85)] rounded-2xl"
        />
        <h1 className="text-4xl font-extrabold tracking-tight text-center text-gray-900 dark:text-gray-50 mb-2">
          Bol Bachhan
        </h1>
        <div className="text-center w-full">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-2">Sign in to access the admin panel</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
