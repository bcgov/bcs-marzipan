import { Link } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';

export function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 py-8 text-center">
      <h1 className="mb-2 text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild>
        <Link to={isAuthenticated ? '/' : '/login'}>
          {isAuthenticated ? 'Return to home' : 'Return to login'}
        </Link>
      </Button>
    </div>
  );
}
