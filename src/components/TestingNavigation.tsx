
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TestTube, Home } from 'lucide-react';

export function TestingNavigation() {
  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <Button asChild variant="outline" size="sm">
        <Link to="/" className="flex items-center gap-2">
          <Home className="w-4 h-4" />
          Home
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link to="/testing" className="flex items-center gap-2">
          <TestTube className="w-4 h-4" />
          Testing Suite
        </Link>
      </Button>
    </div>
  );
}
