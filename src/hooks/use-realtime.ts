import { useEffect, useState, useCallback } from "react";
import { createClientInstance } from "@/lib/supabase";
import type { Database } from "@/types/database";

type ActivityFeed = Database["public"]["Tables"]["activity_feed"]["Row"];

interface UseRealtimeOptions {
  babyId?: string;
  onNewActivity?: (activity: ActivityFeed) => void;
}

export function useRealtime({ babyId, onNewActivity }: UseRealtimeOptions) {
  const [activities, setActivities] = useState<ActivityFeed[]>([]);
  const [presence, setPresence] = useState<Map<string, { status: string; current_page?: string }>>(new Map());

  // Subscribe to activity feed
  useEffect(() => {
    if (!babyId) return;

    // Fetch initial activities
    const fetchActivities = async () => {
      const { data } = await createClientInstance()
        .from("activity_feed")
        .select("*")
        .eq("baby_id", babyId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setActivities(data);
    };

    fetchActivities();

    // Subscribe to realtime changes
    const channel = (createClientInstance() as any)
      .channel(`activity-${babyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_feed",
          filter: `baby_id=eq.${babyId}`,
        },
        (payload: any) => {
          const newActivity = payload.new as ActivityFeed;
          setActivities((prev) => [newActivity, ...prev]);
          onNewActivity?.(newActivity);
        }
      )
      .subscribe();

    return () => {
      createClientInstance().removeChannel(channel);
    };
  }, [babyId, onNewActivity]);

  // Presence tracking
  const updatePresence = useCallback(async (status: "online" | "away" | "offline", currentPage?: string) => {
    const { data: { user } } = await createClientInstance().auth.getUser();
    if (!user) return;

    await (createClientInstance() as any).from("presence").upsert({
      user_id: user.id,
      baby_id: babyId,
      status,
      current_page: currentPage,
      last_seen: new Date().toISOString(),
    });
  }, [babyId]);

  useEffect(() => {
    if (!babyId) return;

    // Initial presence
    updatePresence("online");

    // Update presence periodically
    const interval = setInterval(() => {
      updatePresence("online");
    }, 30000); // Every 30 seconds

    // Fetch other users' presence
    const fetchPresence = async () => {
      const { data } = await (createClientInstance() as any)
        .from("presence")
        .select("user_id, status, current_page, profiles(full_name, avatar_url)")
        .eq("baby_id", babyId)
        .neq("status", "offline");

      if (data) {
        const presenceMap = new Map<string, { status: string; current_page?: string }>(
          data.map((p: any) => [p.user_id as string, { status: p.status, current_page: p.current_page || undefined }])
        );
        setPresence(presenceMap);
      }
    };

    fetchPresence();

    return () => {
      clearInterval(interval);
      updatePresence("offline");
    };
  }, [babyId, updatePresence]);

  const logActivity = useCallback(async (
    action: string,
    entityType: string,
    entityId: string | null,
    summary: string,
    metadata?: Record<string, unknown>
  ) => {
    const { data: { user } } = await createClientInstance().auth.getUser();
    if (!user) return;

    await (createClientInstance() as any).from("activity_feed").insert({
      baby_id: babyId,
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      summary,
      metadata,
    });
  }, [babyId]);

  return {
    activities,
    presence,
    logActivity,
    updatePresence,
  };
}
