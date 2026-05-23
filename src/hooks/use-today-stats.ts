import { useEffect, useState } from "react";
import { createClientInstance } from "@/lib/supabase";

interface TodayStats {
  feedings: number;
  sleeps: number;
  diapers: number;
}

export function useTodayStats(babyId: string | null) {
  const [stats, setStats] = useState<TodayStats>({ feedings: 0, sleeps: 0, diapers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!babyId) {
      setStats({ feedings: 0, sleeps: 0, diapers: 0 });
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      today.setHours(23, 59, 59, 999);
      const todayEnd = today.toISOString();

      try {
        const [feedingResult, sleepResult, diaperResult] = await Promise.all([
          createClientInstance()
            .from("feeding_logs")
            .select("id", { count: "exact", head: true })
            .eq("baby_id", babyId)
            .gte("start_time", todayStart)
            .lte("start_time", todayEnd),

          createClientInstance()
            .from("sleep_logs")
            .select("id", { count: "exact", head: true })
            .eq("baby_id", babyId)
            .gte("start_time", todayStart)
            .lte("start_time", todayEnd),

          createClientInstance()
            .from("diaper_logs")
            .select("id", { count: "exact", head: true })
            .eq("baby_id", babyId)
            .gte("logged_at", todayStart)
            .lte("logged_at", todayEnd),
        ]);

        setStats({
          feedings: feedingResult.count || 0,
          sleeps: sleepResult.count || 0,
          diapers: diaperResult.count || 0,
        });
      } catch (error) {
        console.error("Error fetching today's stats:", error);
        setStats({ feedings: 0, sleeps: 0, diapers: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [babyId]);

  return { stats, loading };
}
