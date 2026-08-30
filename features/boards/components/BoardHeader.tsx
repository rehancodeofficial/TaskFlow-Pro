"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BoardHeaderSkeleton } from "@/components/skeletons/BoardHeader";

interface BoardHeaderProps {
  totalTasks: number;
  loading: boolean;
  onCreateColumn: () => void;
  onCreateTask: () => void;
}

export function BoardHeader({
  totalTasks,
  loading,
  onCreateColumn,
  onCreateTask,
}: BoardHeaderProps) {
  if (loading) {
    return <BoardHeaderSkeleton />;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Total Tasks: </span>
          {totalTasks}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="text-gray-500 hover:text-gray-700 cursor-pointer"
          onClick={onCreateColumn}
        >
          <Plus />
          Add New List
        </Button>
        <Button className="cursor-pointer w-auto" onClick={onCreateTask}>
          <Plus />
          Add Task
        </Button>
      </div>
    </div>
  );
}