"use client";

import { useState } from "react";
import { Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClientInstance } from "@/lib/supabase";

interface TemperatureFormProps {
  babyId: string;
  onSuccess?: () => void;
}

export function TemperatureForm({ babyId, onSuccess }: TemperatureFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState("");
  const [measurementMethod, setMeasurementMethod] = useState<"rectal" | "ear" | "forehead" | "armpit" | "oral">("armpit");
  const [loggedAt, setLoggedAt] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await createClientInstance().auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (createClientInstance() as any).from("temperature_logs").insert({
        baby_id: babyId,
        logged_by: user.id,
        temperature: parseFloat(temperature),
        measurement_method: measurementMethod,
        logged_at: new Date(loggedAt).toISOString(),
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Temperature logged!",
        description: `Temperature of ${temperature}°C recorded.`,
        variant: "success",
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Failed to log temperature",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 36) return "text-blue-500";
    if (temp > 37.5) return "text-red-500";
    return "text-green-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-red-500" />
          Log Temperature
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="temp-datetime">Date & Time</Label>
            <Input
              id="temp-datetime"
              type="datetime-local"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature (°C) *</Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              placeholder="e.g., 37.0"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              required
              className={temperature ? getTemperatureColor(parseFloat(temperature)) : ""}
            />
            <p className="text-xs text-baby-600">
              Normal: 36.1°C - 37.2°C | Fever: &gt; 37.5°C
            </p>
          </div>

          <div className="space-y-2">
            <Label>Measurement Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["armpit", "rectal", "ear", "forehead", "oral"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setMeasurementMethod(method)}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    measurementMethod === method
                      ? "bg-red-500 text-white"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temp-notes">Notes</Label>
            <Input
              id="temp-notes"
              placeholder="Any symptoms or observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? "Logging..." : "Log Temperature"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
