'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ArrowRight, Filter, LayoutDashboard, MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface NavbarProps {
  boardTitle?: string;
  onEditBoard?: () => void;
  onFilterClick?: () => void;
  filterCount?: number;
  className?: string;
}

const Navbar = ({
  boardTitle,
  onEditBoard,
  onFilterClick,
  filterCount,
  className,
}: NavbarProps) => {
  const pathname = usePathname();

  const isDashboardPage = pathname === '/dashboard' || pathname?.startsWith('/app');
  const isBoardPage = pathname?.startsWith('/boards/');

  if (isDashboardPage) {
    return (
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <LayoutDashboard className="h-6 w-6 sm:w-8 sm:h-8 text-blue-600" />
              <span className="text-xl sm:text-2xl font-bold text-gray-900">TaskFlow Pro</span>
            </div>
          </Link>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/app/settings/profile">
              <Button variant="ghost" size="sm">Profile</Button>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  if (isBoardPage) {
    return (
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                href="/app/dashboard"
                className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-6 sm:w-6" />
                <span className="hidden sm:inline">Back to dashboard</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <div className="h-4 sm:h-6 w-px bg-gray-300 hidden sm:block" />
              <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 min-w-0">
                <LayoutDashboard className="text-blue-600 h-5 w-5" />
                <div className="items-center space-x-1 sm:space-x-2 min-w-0">
                  <span className="text-lg font-bold text-gray-900 truncate">{boardTitle}</span>
                  {onEditBoard && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 flex-shrink-0 p-0 cursor-pointer" onClick={onEditBoard}>
                      <MoreHorizontal />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {onFilterClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFilterClick}
                  className={`text-xs sm:text-sm cursor-pointer ${filterCount && filterCount > 0 ? 'bg-blue-100 border-blue-200' : ''}`}
                >
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Filter</span>
                  {filterCount && filterCount > 0 && (
                    <Badge variant="secondary" className="text-xs ml-1 sm:ml-2 bg-blue-100 border-blue-200">
                      {filterCount}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={cn('border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50', className)}>
      <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <LayoutDashboard className="h-6 w-6 sm:w-8 sm:h-8 text-blue-600" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900">TaskFlow Pro</span>
          </div>
        </Link>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm cursor-pointer">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-xs sm:text-sm cursor-pointer">
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
