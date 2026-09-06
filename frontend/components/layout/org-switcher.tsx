"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOrgStore } from "@/store/orgStore";
import { useState } from "react";
import { toast } from "sonner";

export default function OrgSwitcher() {
  const { organizations, activeOrg, setActiveOrg, createOrganization } = useOrgStore();
  const [open, setOpen] = useState(false);
  const [showNewOrgDialog, setShowNewOrgDialog] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    try {
      setIsCreating(true);
      await createOrganization(newOrgName);
      setShowNewOrgDialog(false);
      setNewOrgName("");
      setOpen(false);
      toast.success("Organization created successfully");
    } catch (error) {
      toast.error("Failed to create organization");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={showNewOrgDialog} onOpenChange={setShowNewOrgDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select an organization"
            className="w-50 justify-between"
          >
            <Building className="mr-2 h-4 w-4" />
            {activeOrg ? activeOrg.name : "Select Org..."}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-50 p-0" align="start">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search organization..." />
              <CommandEmpty>No organization found.</CommandEmpty>
              <CommandGroup heading="Organizations">
                {organizations.map((org) => (
                  <CommandItem
                    key={org.id}
                    onSelect={() => {
                      setActiveOrg(org);
                      setOpen(false);
                    }}
                    className="text-sm"
                  >
                    <Building className="mr-2 h-4 w-4" />
                    {org.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        activeOrg?.id === org.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setShowNewOrgDialog(true);
                    }}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Organization
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            Add a new organization to manage projects and teams.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 flex flex-col">
          <div className="space-y-2">
            <Label htmlFor="name">Organization name</Label>
            <Input
              id="name"
              placeholder="Acme Inc."
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              disabled={isCreating}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewOrgDialog(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleCreateOrg} disabled={isCreating || !newOrgName.trim()}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
