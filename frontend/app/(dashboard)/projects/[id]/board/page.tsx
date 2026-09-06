"use client";

import { useEffect, useState, use } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { MoreHorizontal, Plus } from "lucide-react";
import api from "@/lib/api";
import { wsService } from "@/lib/websocket";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Task {
  id: string;
  title: string;
  taskNumber: string;
  priority: string;
  position: number;
}

interface Column {
  id: string;
  name: string;
  position: number;
  tasks: Task[];
}

export default function KanbanBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch initial board state
    const fetchBoard = async () => {
      try {
        const response = await api.get(`/projects/${projectId}/kanban/columns`);
        const fetchedColumns: Column[] = response.data.data || [];
        
        // Ensure columns have an empty tasks array if undefined
        fetchedColumns.forEach(c => {
          if (!c.tasks) c.tasks = [];
        });
        
        // Sort tasks by position
        fetchedColumns.forEach(c => {
          c.tasks.sort((a, b) => a.position - b.position);
        });

        setColumns(fetchedColumns);
      } catch (error) {
        toast.error("Failed to load Kanban board");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoard();

    // 2. Connect to WebSocket for real-time updates
    const token = localStorage.getItem("access_token");
    if (token) {
      wsService.connect(token);
      
      const topic = `/topic/projects/${projectId}/kanban`;
      wsService.subscribe(topic, (message) => {
        if (message.type === 'TASK_MOVED') {
          handleWebSocketTaskMoved(message);
        }
      });
    }

    return () => {
      wsService.unsubscribe(`/topic/projects/${projectId}/kanban`);
    };
  }, [projectId]);

  const handleWebSocketTaskMoved = (message: any) => {
    const { taskId, sourceColumnId, destinationColumnId, newPosition } = message;
    
    setColumns(prevColumns => {
      const newCols = [...prevColumns];
      
      let movedTask: Task | null = null;
      let srcColIdx = -1;
      
      // Find the task and remove it from source
      newCols.forEach((col, idx) => {
        const taskIdx = col.tasks.findIndex(t => t.id === taskId);
        if (taskIdx !== -1) {
          movedTask = col.tasks[taskIdx];
          srcColIdx = idx;
        }
      });
      
      if (!movedTask || srcColIdx === -1) return prevColumns; // Should not happen
      
      // Remove from source
      newCols[srcColIdx].tasks = newCols[srcColIdx].tasks.filter(t => t.id !== taskId);
      
      // Add to destination
      const destColIdx = newCols.findIndex(c => c.id === destinationColumnId);
      if (destColIdx !== -1) {
        // Update its position
        (movedTask as Task).position = newPosition;
        newCols[destColIdx].tasks.push(movedTask as Task);
        // Resort destination
        newCols[destColIdx].tasks.sort((a, b) => a.position - b.position);
      }
      
      return newCols;
    });
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Optimistic UI Update
    const newColumns = [...columns];
    const sourceCol = newColumns.find(col => col.id === source.droppableId);
    const destCol = newColumns.find(col => col.id === destination.droppableId);

    if (!sourceCol || !destCol) return;

    const [movedTask] = sourceCol.tasks.splice(source.index, 1);
    
    // Calculate new fractional position
    let newPosition = 0;
    if (destCol.tasks.length === 0) {
      newPosition = 100000;
    } else if (destination.index === 0) {
      newPosition = destCol.tasks[0].position / 2;
    } else if (destination.index === destCol.tasks.length) {
      newPosition = destCol.tasks[destCol.tasks.length - 1].position + 100000;
    } else {
      const prevPos = destCol.tasks[destination.index - 1].position;
      const nextPos = destCol.tasks[destination.index].position;
      newPosition = (prevPos + nextPos) / 2;
    }
    
    movedTask.position = newPosition;
    destCol.tasks.splice(destination.index, 0, movedTask);

    setColumns(newColumns);

    // Persist to backend
    try {
      await api.put(`/tasks/${draggableId}/move`, {
        destinationColumnId: destination.droppableId,
        newPosition: newPosition,
      });
    } catch (error) {
      toast.error("Failed to move task. Reloading board.");
      // Revert optimistic update (simplified: just reload)
      window.location.reload();
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading Kanban board...</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kanban Board</h2>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex h-full items-start gap-6 pb-4">
            {columns.map((column) => (
              <div key={column.id} className="flex h-full max-h-full w-80 min-w-80 flex-col rounded-lg bg-zinc-100/50 p-4 dark:bg-zinc-900/50">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {column.name} <span className="ml-2 text-muted-foreground font-normal">{column.tasks.length}</span>
                  </h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 overflow-y-auto space-y-3 p-1 rounded-md transition-colors ${
                        snapshot.isDraggingOver ? "bg-zinc-200/50 dark:bg-zinc-800/50" : ""
                      }`}
                    >
                      {column.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                            >
                              <Card className={`shadow-sm ${snapshot.isDragging ? 'shadow-md border-primary/50 rotate-2' : ''}`}>
                                <CardHeader className="p-3 pb-0">
                                  <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                      {task.taskNumber}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-3">
                                  <p className="text-sm font-medium mb-3 line-clamp-2 leading-snug">
                                    {task.title}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <Badge variant={task.priority === 'HIGH' ? 'destructive' : 'secondary'} className="text-[10px]">
                                      {task.priority || 'MEDIUM'}
                                    </Badge>
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-[10px]">
                                        U
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
