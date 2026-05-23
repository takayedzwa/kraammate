"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PresenceIndicatorProps {
  presence: Map<string, { status: string; current_page?: string }>;
  babyId?: string;
}

export function PresenceIndicator({ presence, babyId }: PresenceIndicatorProps) {
  if (!babyId || presence.size === 0) return null;

  const onlineUsers = Array.from(presence.entries()).filter(
    ([, data]) => data.status === "online"
  );

  if (onlineUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-baby-200">
      <Users className="h-4 w-4 text-baby-500" />
      <div className="flex -space-x-2">
        {onlineUsers.slice(0, 4).map(([userId, data]) => (
          <Avatar key={userId} className="h-6 w-6 border-2 border-white">
            <AvatarFallback className="h-6 w-6 text-xs bg-baby-200">
              {data.status === "online" && "🟢"}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      {onlineUsers.length > 1 && (
        <Badge variant="secondary" className="h-5 text-xs">
          {onlineUsers.length} online
        </Badge>
      )}
    </div>
  );
}
