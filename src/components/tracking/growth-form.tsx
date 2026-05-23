"use client";

import { useState } from "react";
import { Thermometer, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClientInstance } from "@/lib/supabase";

interface GrowthFormProps {
  babyId: string;
  onSuccess?: () => void;
}

export function GrowthForm({ babyId, onSuccess }: GrowthFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [headCircumference, setHeadCircumference] = useState("");
  const [loggedAt, setLoggedAt] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await createClientInstance().auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const weightGrams = weight ? parseFloat(weight) * 1000 : null; // Convert kg to grams

      const { error } = await (createClientInstance() as any).from("growth_logs").insert({
        baby_id: babyId,
        logged_by: user.id,
        weight: weightGrams,
        height: height ? parseFloat(height) : null,
        head_circumference: headCircumference ? parseFloat(headCircumference) : null,
        logged_at: new Date(loggedAt).toISOString(),
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Growth logged!",
        description: "Measurements recorded successfully.",
        variant: "success",
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Failed to log growth",
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
          <Thermometer className="h-5 w-5 text-green-500" />
          Log Growth
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="growth-datetime">Date & Time</Label>
            <Input
              id="growth-datetime"
              type="datetime-local"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                placeholder="e.g., 5.50"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Length (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                placeholder="e.g., 60"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="head">Head (cm)</Label>
              <Input
                id="head"
                type="number"
                step="0.1"
                placeholder="e.g., 40"
                value={headCircumference}
                onChange={(e) => setHeadCircumference(e.target.value)}
              />
            </div>
          </div>

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
            {loading ? "Logging..." : "Log Growth"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
