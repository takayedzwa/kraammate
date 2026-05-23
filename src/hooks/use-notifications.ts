"use client";

import { useEffect, useState, useCallback } from "react";
import { createClientInstance } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
type NotificationType = Database["public"]["Tables"]["notifications"]["Row"]["type"];

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = createClientInstance()
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      createClientInstance().removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      const { data, error } = await createClientInstance()
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data as Notification[]) || []);
      setUnreadCount((data as Notification[])?.filter((n) => !n.is_read).length || 0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await (createClientInstance() as any)
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await (createClientInstance() as any)
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}

export function useReminders(babyId?: string) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!babyId) {
      setLoading(false);
      return;
    }

    fetchReminders();
  }, [babyId]);

  const fetchReminders = async () => {
    if (!babyId) return;

    try {
      const { data, error } = await createClientInstance()
        .from("reminders")
        .select("*")
        .eq("baby_id", babyId)
        .eq("is_active", true)
        .order("scheduled_for", { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async (
    reminderType: NotificationType,
    title: string,
    scheduledFor: Date,
    description?: string,
    recurrence?: string
  ) => {
    const { data: { user } } = await createClientInstance().auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await (createClientInstance() as any)
      .from("reminders")
      .insert({
        baby_id: babyId,
        created_by: user.id,
        reminder_type: reminderType,
        title,
        description: description || null,
        scheduled_for: scheduledFor.toISOString(),
        recurrence: recurrence || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    setReminders((prev) => [...prev, data].sort((a, b) =>
      new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
    ));
    return data;
  };

  const deleteReminder = async (id: string) => {
    const { error } = await (createClientInstance() as any)
      .from("reminders")
      .delete()
      .eq("id", id);

    if (!error) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const toggleReminder = async (id: string, isActive: boolean) => {
    const { error } = await (createClientInstance() as any)
      .from("reminders")
      .update({ is_active: isActive })
      .eq("id", id);

    if (!error) {
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: isActive } : r))
      );
    }
  };

  return {
    reminders,
    loading,
    createReminder,
    deleteReminder,
    toggleReminder,
    refresh: fetchReminders,
  };
}
