"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diff = now.getTime() - past.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getIconForType = (type: string | null) => {
    switch (type) {
      case "feeding_reminder": return "🍼";
      case "medication_reminder": return "💊";
      case "appointment_reminder": return "📅";
      case "sleep_reminder": return "😴";
      case "vaccination_reminder": return "💉";
      default: return "🔔";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Notifications</DialogTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-sm text-baby-500"
              >
                Mark all read
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto mt-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-baby-400">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`p-3 rounded-xl cursor-pointer transition-colors ${
                  notification.is_read
                    ? "bg-baby-50 hover:bg-baby-100"
                    : "bg-white border border-baby-200 hover:bg-baby-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getIconForType(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-sm ${
                        notification.is_read ? "text-baby-600" : "text-baby-900"
                      }`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-baby-400">
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-baby-500 mt-1">{notification.message}</p>
                    {notification.action_url && (
                      <Button variant="link" className="h-auto p-0 text-sm text-baby-600 mt-2">
                        View details →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
