"use client";

import { useState } from "react";
import { Moon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClientInstance } from "@/lib/supabase";
import type { SleepType } from "@/types/database";

interface SleepFormProps {
  babyId: string;
  onSuccess?: () => void;
}

export function SleepForm({ babyId, onSuccess }: SleepFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sleepType, setSleepType] = useState<SleepType>("nap");
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("");
  const [quality, setQuality] = useState<number>(3);
  const [location, setLocation] = useState<"crib" | "bassinet" | "stroller" | "carrier" | "bed" | "other">("crib");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await createClientInstance().auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const durationMinutes = duration ? parseInt(duration) : null;

      const { error } = await (createClientInstance() as any).from("sleep_logs").insert({
        baby_id: babyId,
        logged_by: user.id,
        sleep_type: sleepType,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        duration_minutes: durationMinutes,
        quality,
        location,
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Sleep logged!",
        description: `${sleepType === "nap" ? "Nap" : "Night sleep"} session recorded.`,
        variant: "success",
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Failed to log sleep",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-purple-500" />
          Log Sleep
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sleep Type */}
          <div className="space-y-2">
            <Label>Sleep Type</Label>
            <div className="flex gap-2">
              {(["nap", "night_sleep"] as SleepType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSleepType(type)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    sleepType === type
                      ? "bg-purple-500 text-white"
                      : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                  }`}
                >
                  {type === "nap" ? "🌤️ Nap" : "🌙 Night"}
                </button>
              ))}
            </div>
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="sleep-start">
              <Clock className="h-4 w-4 inline mr-1" />
              Start Time
            </Label>
            <Input
              id="sleep-start"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <Label htmlFor="sleep-end">End Time (optional)</Label>
            <Input
              id="sleep-end"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="sleep-duration">Duration (minutes)</Label>
            <Input
              id="sleep-duration"
              type="number"
              placeholder="e.g., 90"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Sleep Location</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["crib", "bassinet", "stroller", "carrier", "bed", "other"] as const).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={`py-2 rounded-xl text-xs font-medium transition-all ${
                    location === loc
                      ? "bg-purple-500 text-white"
                      : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                  }`}
                >
                  {loc === "crib" ? "🛏️ Crib" : loc === "bassinet" ? "🧺 Bassinet" : loc === "stroller" ? "🚼 Stroller" : loc === "carrier" ? "🎒 Carrier" : loc === "bed" ? "🛏️ Bed" : "📍 Other"}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <Label>Sleep Quality</Label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setQuality(value)}
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-lg transition-all ${
                    quality === value
                      ? "bg-purple-500 text-white scale-110"
                      : "bg-purple-100 text-purple-400"
                  }`}
                >
                  {value === 1 ? "😴" : value === 2 ? "🥱" : value === 3 ? "😐" : value === 4 ? "😊" : "🌟"}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="sleep-notes">Notes</Label>
            <Input
              id="sleep-notes"
              placeholder="Any observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full h-12 bg-purple-500 hover:bg-purple-600" disabled={loading}>
            {loading ? "Logging..." : "Log Sleep"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
