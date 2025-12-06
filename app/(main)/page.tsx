export const dynamic = 'force-dynamic';

export default function MainPage() {
  return (
    <div className="flex-1 flex items-center justify-center gradient-bg-light dark:gradient-bg-dark">
      <div className="text-center space-y-4 p-8">
        <div className="inline-block p-6 rounded-2xl gradient-accent shadow-2xl glow-primary">
          <h1 className="text-4xl font-bold text-white">Welcome to ChatApp</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Select a channel from the sidebar to start chatting, or create a new channel to begin collaborating with your team.
        </p>
      </div>
    </div>
  );
}
