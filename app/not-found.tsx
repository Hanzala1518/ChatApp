import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg-light dark:gradient-bg-dark p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="inline-block p-6 rounded-2xl gradient-accent">
          <h1 className="text-6xl font-bold text-white">404</h1>
        </div>
        <h2 className="text-3xl font-bold">Page Not Found</h2>
        <p className="text-muted-foreground text-lg">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild variant="gradient" size="lg">
          <Link href="/">
            <Home className="mr-2 h-5 w-5" />
            Go Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
