'use client';

import { useEffect, useState } from 'react';

interface ColumnTask {
  id: string;
  title: string;
  priority?: string;
  status: string;
  storyPoints?: number;
}

interface Column {
  id: string;
  title: string;
  tasks: ColumnTask[];
}

export function useBoard(projectId: string) {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'BACKLOG', title: 'Backlog', tasks: [] },
    { id: 'TODO', title: 'To Do', tasks: [] },
    { id: 'IN_PROGRESS', title: 'In Progress', tasks: [] },
    { id: 'IN_REVIEW', title: 'In Review', tasks: [] },
    { id: 'DONE', title: 'Done', tasks: [] },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) loadBoard();
  }, [projectId]);

  async function loadBoard() {
    try {
      setLoading(true);
      setError(null);

      // Derive workspaceId from localStorage/session
      const workspaceId = localStorage.getItem('activeWorkspaceId');
      if (!workspaceId) return;

      const res = await fetch(
        `/api/tasks?workspaceId=${workspaceId}&projectId=${projectId}&limit=100`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);

      // Group tasks into column buckets
      const tasksByStatus: Record<string, ColumnTask[]> = {
        BACKLOG: [],
        TODO: [],
        IN_PROGRESS: [],
        IN_REVIEW: [],
        DONE: [],
      };

      for (const task of json.data) {
        const bucket = tasksByStatus[task.status] || tasksByStatus['BACKLOG'];
        bucket.push({
          id: task.id,
          title: task.title,
          priority: task.priority,
          status: task.status,
          storyPoints: task.storyPoints,
        });
      }

      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: tasksByStatus[col.id] || [],
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setLoading(false);
    }
  }

  async function moveTask(taskId: string, newStatus: string, newOrder: number) {
    const prevColumns = JSON.parse(JSON.stringify(columns));

    // Optimistic update
    setColumns((prev) => {
      const next = prev.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }));

      const movedTask = prev.flatMap((col) => col.tasks).find((t) => t.id === taskId);
      const targetCol = next.find((col) => col.id === newStatus);
      if (movedTask && targetCol) {
        targetCol.tasks.splice(newOrder, 0, { ...movedTask, status: newStatus });
      }

      return next;
    });

    try {
      const workspaceId = localStorage.getItem('activeWorkspaceId');
      const res = await fetch(`/api/tasks/${taskId}?workspaceId=${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
    } catch (err) {
      // Rollback on failure
      setColumns(prevColumns);
      setError(err instanceof Error ? err.message : 'Failed to move task');
    }
  }

  return { columns, setColumns, loading, error, moveTask, reload: loadBoard };
}
