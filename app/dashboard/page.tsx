export default function DashboardHome() {
  return (
    <div className="flex flex-1 items-center justify-center w-full h-full">
      <div className="flex flex-col items-center gap-8 p-12 rounded-2xl shadow-2xl bg-white/90 dark:bg-muted/90 border border-border max-w-2xl w-full">
        <img
          src="/favicon.png"
          alt="Bol Bachhan Logo"
          className="w-28 h-28 drop-shadow-[0_0_32px_rgba(56,189,248,0.85)] rounded-2xl"
        />
        <h1 className="text-5xl font-extrabold tracking-tight text-center text-gray-900 dark:text-gray-50">
          Bol Bachhan
        </h1>
        <p className="text-2xl text-muted-foreground text-center max-w-lg">
          Welcome to your AI-powered call management dashboard.
        </p>
      </div>
    </div>
  );
} 