"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";
import { cn } from "@/lib/utils";

const projectNavItems = [
  { name: "Board", href: "board" },
  { name: "Backlog", href: "backlog" },
  { name: "Sprints", href: "sprints" },
  { name: "Settings", href: "settings" },
];

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex space-x-4 border-b pb-4">
        {projectNavItems.map((item) => {
          const href = `/projects/${projectId}/${item.href}`;
          const isActive = pathname.includes(href);
          
          return (
            <Link
              key={item.name}
              href={href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
