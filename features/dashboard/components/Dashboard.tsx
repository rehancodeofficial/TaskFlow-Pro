'use client';

import Navbar from '@/components/layout/Navbar';
import { useState } from 'react';
import { useBoards } from '../hooks/useBoards';
import { BoardsSection } from './BoardsSection';
import { StatsSection } from './StatsSection';
import { DashboardHeader } from './DashboardHeader';
import { ErrorState } from '@/components/common/Error';

interface Project {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
}

export default function Dashboard() {
  const { createBoard, boards, loading, error, refetch } = useBoards();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchValue, setSearchValue] = useState('');

  const filteredBoards: Project[] = boards.filter((b: Project) =>
    b.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleCreateBoard = async () => {
    await createBoard({ name: 'New Project' });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <ErrorState
            title="Error loading projects"
            message={error}
            onRetry={refetch}
            retryText="Reload projects"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <DashboardHeader onCreateBoard={handleCreateBoard} loading={loading} />

        <StatsSection
          totalProjects={boards.length}
          completedTasks={0}
          pendingTasks={0}
          overdueTasks={0}
          loading={loading}
        />

        <BoardsSection
          boards={filteredBoards}
          loading={loading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreateBoard={handleCreateBoard}
          onSearchChange={setSearchValue}
          searchValue={searchValue}
        />
      </main>
    </div>
  );
}
