'use client';

import { useEffect, useState } from 'react';

interface Project {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
}

export function useBoards() {
  const [boards, setBoards] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBoards();
  }, []);

  async function loadBoards() {
    try {
      setLoading(true);
      setError(null);

      const workspaceId = localStorage.getItem('activeWorkspaceId');
      if (!workspaceId) return;

      const res = await fetch(`/api/projects?workspaceId=${workspaceId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);

      setBoards(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }

  async function createBoard(boardData: { name: string; description?: string; color?: string }) {
    const workspaceId = localStorage.getItem('activeWorkspaceId');
    if (!workspaceId) throw new Error('No active workspace');

    const res = await fetch(`/api/projects?workspaceId=${workspaceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(boardData),
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message);

    setBoards((prev) => [json.data, ...prev]);
    return json.data;
  }

  const refetch = () => { loadBoards(); };

  return { boards, loading, error, createBoard, refetch };
}
