"use client";

import { useEffect, useState, use } from "react";
import { Plus } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  taskNumber: string;
  priority: string;
  position: number;
}

export default function BacklogPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For MVP backlog, we'll fetch all tasks in the backlog (e.g. status = BACKLOG or tasks without a sprint)
    // The backend in TaskFlow might just treat the first Kanban column as the backlog,
    // or we fetch all tasks for the project. Let's fetch all tasks and filter if needed.
    const fetchTasks = async () => {
      try {
        const response = await api.get(`/projects/${projectId}/tasks`);
        setTasks(response.data.data || []);
      } catch (error) {
        toast.error("Failed to load backlog");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, [projectId]);

  const onDragEnd = (result: DropResult) => {
    // Simple drag and drop reordering inside the backlog
    const { source, destination } = result;
    if (!destination) return;
    
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);
    
    setTasks(items);
    // Ideally we'd persist the new position here
  };

  if (isLoading) {
    return <div className="p-8">Loading backlog...</div>;
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Backlog</h2>
          <p className="text-muted-foreground">
            Plan your upcoming work.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Issue
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="backlog">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="min-h-50"
              >
                {tasks.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                    Your backlog is empty.
                  </div>
                ) : (
                  tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center justify-between border-b p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                            snapshot.isDragging ? 'bg-zinc-50 dark:bg-zinc-900 shadow-md' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-muted-foreground w-16">{task.taskNumber}</span>
                            <span className="text-sm font-medium">{task.title}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {task.priority || 'MEDIUM'}
                          </Badge>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
