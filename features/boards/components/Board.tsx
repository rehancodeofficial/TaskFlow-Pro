'use client';

import Navbar from '@/components/layout/Navbar';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ErrorState } from '@/components/common/Error';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useBoard } from '../hooks/useBoard';
import { BoardColumns } from './BoardColumns';
import { BoardHeader } from './BoardHeader';

interface ColumnTask {
  id: string;
  title: string;
  priority?: string;
  status: string;
  storyPoints?: number;
}

export default function Board() {
  const { id } = useParams<{ id: string }>();
  const { columns, loading, error, moveTask, reload } = useBoard(id);

  const [activeTask, setActiveTask] = useState<ColumnTask | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [filters, setFilters] = useState({
    priority: [] as string[],
    dueDate: null as string | null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = columns.flatMap((col) => col.tasks).find((t) => t.id === taskId);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (_event: DragOverEvent) => { /* optimistic handled in hook */ };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const targetCol = columns.find((col) => col.id === overId);
    if (targetCol) {
      const sourceCol = columns.find((col) => col.tasks.some((t) => t.id === taskId));
      if (sourceCol && sourceCol.id !== targetCol.id) {
        await moveTask(taskId, targetCol.id, targetCol.tasks.length);
      }
      return;
    }

    // Dropped on a task
    const targetColByTask = columns.find((col) => col.tasks.some((t) => t.id === overId));
    if (targetColByTask) {
      const newIndex = targetColByTask.tasks.findIndex((t) => t.id === overId);
      await moveTask(taskId, targetColByTask.id, newIndex);
    }
  };

  const filteredColumns = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((task) => {
      if (filters.priority.length > 0 && task.priority && !filters.priority.includes(task.priority)) return false;
      return true;
    }),
  }));

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-2 py-4">
          <ErrorState
            title="Error loading board"
            message={error}
            onRetry={reload}
            retryText="Reload board"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-2 py-4 sm:px-4 sm:py-6">
        <BoardHeader
          totalTasks={columns.reduce((sum, col) => sum + col.tasks.length, 0)}
          loading={loading}
          onCreateColumn={() => {}}
          onCreateTask={() => setIsCreatingTask(true)}
        />

        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <BoardColumns
            columns={filteredColumns}
            loading={loading}
            onCreateTask={() => {}}
            onEditColumn={() => {}}
            onDeleteColumn={() => {}}
            onDeleteTask={() => {}}
            onCreateColumn={() => {}}
          />
          <DragOverlay>
            {activeTask ? (
              <div className="bg-white border shadow-lg rounded-lg p-3 opacity-90 text-sm font-medium">
                {activeTask.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
}
