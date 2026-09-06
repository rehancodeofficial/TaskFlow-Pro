"use client";

import { Bell, LogOut, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import OrgSwitcher from "./org-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { wsService } from "@/lib/websocket";

export default function Header() {
  const { user, logout } = useAuthStore();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    // Notification WebSocket logic for the user
    if (!user) return;
    
    const token = localStorage.getItem("access_token");
    if (token) {
      wsService.connect(token);
      const topic = `/user/${user.id}/queue/notifications`;
      
      const sub = wsService.subscribe(topic, (msg) => {
        setHasUnread(true);
      });
      
      return () => wsService.unsubscribe(topic);
    }
  }, [user]);

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b bg-white px-6 dark:bg-zinc-950 shadow-sm z-10">
      <div className="flex items-center gap-4">
        <OrgSwitcher />
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
              {hasUnread && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-zinc-500">
              No new notifications
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent transition-all hover:ring-primary/20">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground font-medium">{getInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
