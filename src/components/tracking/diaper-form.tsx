"use client";

import { useState } from "react";
import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createClientInstance } from "@/lib/supabase";
import type { DiaperType } from "@/types/database";

interface DiaperFormProps {
  babyId: string;
  onSuccess?: () => void;
}

export function DiaperForm({ babyId, onSuccess }: DiaperFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [diaperType, setDiaperType] = useState<DiaperType>("wet");
  const [color, setColor] = useState("");
  const [consistency, setConsistency] = useState<"normal" | "watery" | "hard" | "mucusy">("normal");
  const [amount, setAmount] = useState<"small" | "medium" | "large" | "overflow">("medium");
  const [loggedAt, setLoggedAt] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await createClientInstance().auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (createClientInstance() as any).from("diaper_logs").insert({
        baby_id: babyId,
        logged_by: user.id,
        diaper_type: diaperType,
        color: color || null,
        consistency,
        amount,
        logged_at: new Date(loggedAt).toISOString(),
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Diaper change logged!",
        description: `${diaperType === "wet" ? "Wet" : diaperType === "dirty" ? "Dirty" : "Mixed"} diaper recorded.`,
        variant: "success",
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Failed to log diaper change",
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
          <Droplets className="h-5 w-5 text-amber-500" />
          Log Diaper Change
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date/Time */}
          <div className="space-y-2">
            <Label htmlFor="diaper-datetime">Date & Time</Label>
            <Input
              id="diaper-datetime"
              type="datetime-local"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
              required
            />
          </div>

          {/* Diaper Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              {(["wet", "dirty", "mixed"] as DiaperType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDiaperType(type)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                    diaperType === type
                      ? "bg-amber-500 text-white"
                      : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  }`}
                >
                  {type === "wet" ? "💧 Wet" : type === "dirty" ? "💩 Dirty" : "🔄 Mixed"}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="flex gap-2">
              {(["small", "medium", "large", "overflow"] as const).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    amount === amt
                      ? "bg-amber-500 text-white"
                      : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  }`}
                >
                  {amt === "small" ? "💧" : amt === "medium" ? "💧💧" : amt === "large" ? "💧💧💧" : "🌊"}
                  <br />
                  {amt.charAt(0).toUpperCase() + amt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Color (for dirty diapers) */}
          {diaperType !== "wet" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="e.g., Yellow, Green, Brown"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Consistency</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["normal", "watery", "hard", "mucusy"] as const).map((cons) => (
                    <button
                      key={cons}
                      type="button"
                      onClick={() => setConsistency(cons)}
                      className={`py-2 rounded-xl text-sm font-medium transition-all ${
                        consistency === cons
                          ? "bg-amber-500 text-white"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      }`}
                    >
                      {cons.charAt(0).toUpperCase() + cons.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="diaper-notes">Notes</Label>
            <Input
              id="diaper-notes"
              placeholder="Any observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full h-12 bg-amber-500 hover:bg-amber-600" disabled={loading}>
            {loading ? "Logging..." : "Log Diaper Change"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
