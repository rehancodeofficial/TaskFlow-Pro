"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, MoreVertical } from "lucide-react";
import api from "@/lib/api";
import { useOrgStore } from "@/store/orgStore";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
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

interface Project {
  id: string;
  name: string;
  description: string;
  key: string;
  status: string;
  teamId?: string;
}

export default function ProjectsPage() {
  const { activeOrg } = useOrgStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog state
  const [open, setOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectKey, setNewProjectKey] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!activeOrg) return;
      setIsLoading(true);
      try {
        // TaskFlow allows fetching projects by org ID or just /projects depending on backend.
        // Assuming /projects returns projects for the active tenant (via X-Tenant-ID header)
        const response = await api.get("/projects");
        setProjects(response.data.data);
      } catch (error) {
        toast.error("Failed to fetch projects");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [activeOrg]);

  const handleCreateProject = async () => {
    try {
      setIsCreating(true);
      const payload = {
        name: newProjectName,
        key: newProjectKey.toUpperCase(),
        description: newProjectDesc,
        organizationId: activeOrg?.id, // Sent if required, but also in header
      };
      
      const response = await api.post("/projects", payload);
      setProjects([...projects, response.data.data]);
      setOpen(false);
      toast.success("Project created successfully");
      
      // Reset form
      setNewProjectName("");
      setNewProjectKey("");
      setNewProjectDesc("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  if (!activeOrg) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-500">Please select an organization first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage your organization's projects and boards.
          </p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Add a new project to track work across your team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="key">Project Key (Prefix for tasks)</Label>
                <Input
                  id="key"
                  value={newProjectKey}
                  onChange={(e) => setNewProjectKey(e.target.value)}
                  placeholder="e.g. WEB"
                  maxLength={5}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <Input
                  id="desc"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Brief description of the project"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={isCreating || !newProjectName || !newProjectKey}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-t-xl" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <FolderKanban className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No projects created</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              You haven't created any projects yet. Create one to start tracking tasks.
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="group transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">
                      <Link href={`/projects/${project.id}/board`} className="hover:underline">
                        {project.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || "No description provided."}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardFooter className="flex justify-between border-t pt-4">
                <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {project.status || 'ACTIVE'}
                </Badge>
                <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  KEY: {project.key}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
