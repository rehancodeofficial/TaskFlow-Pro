"use Client";

import { HeaderSkeleton } from "@/components/skeletons/DashboardHeader";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { Plus } from "lucide-react";

interface DashboardHeaderProps {
  onCreateBoard: () => void;
  loading: boolean;
}

export function DashboardHeader({
  onCreateBoard,
  loading,
}: DashboardHeaderProps) {
  const { user } = useUser();

  if (loading) {
    return <HeaderSkeleton />;
  }

  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {user?.firstName ?? user?.emailAddresses[0].emailAddress}!
        👋
      </h1>
      <p className="text-gray-600">
        Here's what's happening with your boards today.
      </p>
      <Button
        className="w-full sm:w-auto mt-2 cursor-pointer"
        onClick={onCreateBoard}
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Board
      </Button>
    </div>
  );
}
