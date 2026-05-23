"use client";

import { useState } from "react";
import { Clock, Droplet, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createClientInstance } from "@/lib/supabase";
import type { FeedingType } from "@/types/database";

interface FeedingFormProps {
  babyId: string;
  onSuccess?: () => void;
}

export function FeedingForm({ babyId, onSuccess }: FeedingFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [feedingType, setFeedingType] = useState<FeedingType>("breastfeeding");
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [duration, setDuration] = useState("");
  const [amount, setAmount] = useState("");
  const [breastSide, setBreastSide] = useState<"left" | "right" | "both">("both");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<number>(3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await createClientInstance().auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const durationMinutes = duration ? parseInt(duration) : null;
      const amountMl = amount ? parseFloat(amount) : null;

      const { error } = await (createClientInstance() as any).from("feeding_logs").insert({
        baby_id: babyId,
        logged_by: user.id,
        feeding_type: feedingType,
        start_time: new Date(startTime).toISOString(),
        duration_minutes: durationMinutes,
        amount_ml: amountMl,
        breast_side: feedingType === "breastfeeding" ? breastSide : null,
        notes: notes || null,
        rating,
      });

      if (error) throw error;

      toast({
        title: "Feeding logged!",
        description: `${feedingType === "breastfeeding" ? "Breastfeeding" : "Feeding"} session recorded.`,
        variant: "success",
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Failed to log feeding",
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
          <Droplet className="h-5 w-5 text-blue-500" />
          Log Feeding
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feeding Type */}
          <div className="space-y-2">
            <Label>Feeding Type</Label>
            <div className="flex gap-2 flex-wrap">
              {(["breastfeeding", "bottle", "pumping", "mixed"] as FeedingType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFeedingType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    feedingType === type
                      ? "bg-baby-500 text-white"
                      : "bg-baby-100 text-baby-700 hover:bg-baby-200"
                  }`}
                >
                  {type === "breastfeeding" ? "Breast" : type === "bottle" ? "Bottle" : type === "pumping" ? "Pumping" : "Mixed"}
                </button>
              ))}
            </div>
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="start-time">
              <Clock className="h-4 w-4 inline mr-1" />
              Start Time
            </Label>
            <Input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          {/* Duration or Amount based on type */}
          {feedingType === "breastfeeding" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 20"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Breast Side</Label>
                <div className="flex gap-2">
                  {(["left", "right", "both"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setBreastSide(side)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                        breastSide === side
                          ? "bg-baby-500 text-white"
                          : "bg-baby-100 text-baby-700 hover:bg-baby-200"
                      }`}
                    >
                      {side === "left" ? "Left" : side === "right" ? "Right" : "Both"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="amount">
                <Droplet className="h-4 w-4 inline mr-1" />
                Amount (ml)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 120"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <Label>How well did baby feed?</Label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-lg transition-all ${
                    rating === value
                      ? "bg-baby-500 text-white scale-110"
                      : "bg-baby-100 text-baby-400"
                  }`}
                >
                  {value === 1 ? "😢" : value === 2 ? "🙁" : value === 3 ? "😐" : value === 4 ? "🙂" : "😊"}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Any observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? "Logging..." : "Log Feeding"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
