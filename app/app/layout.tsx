import { ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard, CheckSquare, FolderOpen, Settings, Users } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <span className="font-bold text-lg tracking-tight text-indigo-600 dark:text-indigo-400">
            TaskFlow Pro
          </span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavItem href="/app/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem href="/app/projects" icon={<FolderOpen size={20} />} label="Projects" />
          <NavItem href="/app/tasks" icon={<CheckSquare size={20} />} label="My Tasks" />
          <NavItem href="/app/team" icon={<Users size={20} />} label="Team" />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <NavItem href="/app/settings" icon={<Settings size={20} />} label="Settings" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              Workspace
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* User Profile Placeholder */}
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-medium">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}
