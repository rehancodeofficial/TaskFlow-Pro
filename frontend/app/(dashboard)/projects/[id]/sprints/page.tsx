"use client";

import { useEffect, useState, use } from "react";
import { format } from "date-fns";
import { Plus, CalendarIcon, Play, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function SprintsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchSprints();
  }, [projectId]);

  const fetchSprints = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/projects/${projectId}/sprints`);
      setSprints(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch sprints");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSprint = async () => {
    if (!name || !startDate || !endDate) return;
    try {
      setIsCreating(true);
      const payload = {
        name,
        goal,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        projectId
      };
      
      const response = await api.post(`/projects/${projectId}/sprints`, payload);
      setSprints([...sprints, response.data.data]);
      setOpen(false);
      toast.success("Sprint created successfully");
      
      setName("");
      setGoal("");
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error) {
      toast.error("Failed to create sprint");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (sprintId: string, status: string) => {
    try {
      await api.patch(`/sprints/${sprintId}/status?status=${status}`);
      toast.success(`Sprint marked as ${status}`);
      fetchSprints(); // Refresh to ensure correct state
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading sprints...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sprints</h2>
          <p className="text-muted-foreground">
            Plan and manage your project's agile sprints.
          </p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Sprint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Sprint</DialogTitle>
              <DialogDescription>
                Define the timeframe and goal for your next sprint.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Sprint Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sprint 1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goal">Sprint Goal (Optional)</Label>
                <Input
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="What do we want to achieve?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleCreateSprint} disabled={isCreating || !name || !startDate || !endDate}>
                Create Sprint
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sprints.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">No sprints found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map((sprint) => (
            <Card key={sprint.id} className={sprint.status === 'ACTIVE' ? 'border-primary shadow-sm' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{sprint.name}</CardTitle>
                  <Badge variant={sprint.status === 'ACTIVE' ? 'default' : sprint.status === 'COMPLETED' ? 'secondary' : 'outline'}>
                    {sprint.status}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {sprint.goal || "No goal specified."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-zinc-500">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{format(new Date(sprint.startDate), "MMM d")} - {format(new Date(sprint.endDate), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-zinc-50 dark:bg-zinc-900 border-t p-4 flex justify-end gap-2">
                {sprint.status === 'PLANNED' && (
                  <Button size="sm" onClick={() => handleUpdateStatus(sprint.id, 'ACTIVE')}>
                    <Play className="mr-2 h-4 w-4" /> Start Sprint
                  </Button>
                )}
                {sprint.status === 'ACTIVE' && (
                  <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateStatus(sprint.id, 'COMPLETED')}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Complete Sprint
                  </Button>
                )}
                {sprint.status === 'COMPLETED' && (
                  <span className="text-sm text-muted-foreground">Sprint Completed</span>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
