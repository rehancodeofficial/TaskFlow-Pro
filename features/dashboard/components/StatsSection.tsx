'use client';

import { StatsSkeleton } from '@/components/skeletons/Stats';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutDashboard, Rocket, TrendingUp, CheckSquare } from 'lucide-react';

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

interface StatsSectionProps {
  totalProjects?: number;
  completedTasks?: number;
  pendingTasks?: number;
  overdueTasks?: number;
  loading?: boolean;
}

export function StatsSection({
  totalProjects = 0,
  completedTasks = 0,
  pendingTasks = 0,
  overdueTasks = 0,
  loading = false,
}: StatsSectionProps) {
  if (loading) {
    return <StatsSkeleton />;
  }

  const stats: StatCard[] = [
    {
      label: 'Active Projects',
      value: totalProjects,
      icon: <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />,
      color: 'bg-blue-100',
    },
    {
      label: 'Completed Tasks',
      value: completedTasks,
      icon: <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />,
      color: 'bg-green-100',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      icon: <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />,
      color: 'bg-yellow-100',
    },
    {
      label: 'Overdue Tasks',
      value: overdueTasks,
      icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />,
      color: 'bg-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
