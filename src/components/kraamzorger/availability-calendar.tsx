"use client";

import { useState } from "react";
import { Calendar, Clock, Trash2, Edit, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { RecurringAvailability } from "@/hooks/use-availability";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayShortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface AvailabilityCalendarProps {
  availabilities: RecurringAvailability[];
  onAdd: (data: Omit<RecurringAvailability, "id">) => Promise<void>;
  onUpdate: (id: string, data: Partial<RecurringAvailability>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function AvailabilityCalendar({ availabilities, onAdd, onUpdate, onDelete }: AvailabilityCalendarProps) {
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [newTime, setNewTime] = useState({ start: "09:00", end: "17:00" });
  const [isAvailable, setIsAvailable] = useState(true);

  const getAvailabilityForDay = (day: number) => {
    return availabilities.find((a) => a.day_of_week === day);
  };

  const handleAddAvailability = async (day: number) => {
    setEditingDay(day);
  };

  const handleSave = async (day: number) => {
    await onAdd({
      day_of_week: day,
      start_time: newTime.start,
      end_time: newTime.end,
      is_available: isAvailable,
    });
    setEditingDay(null);
    setNewTime({ start: "09:00", end: "17:00" });
    setIsAvailable(true);
  };

  const handleCancel = () => {
    setEditingDay(null);
    setNewTime({ start: "09:00", end: "17:00" });
    setIsAvailable(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Weekly Availability
        </CardTitle>
        <CardDescription>
          Set your recurring weekly availability schedule
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dayNames.map((day, index) => {
            const availability = getAvailabilityForDay(index);
            const isEditing = editingDay === index;

            return (
              <div
                key={day}
                className="flex items-center justify-between p-3 rounded-lg border border-baby-100 bg-white hover:border-baby-200 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-[120px]">
                  <span className="font-medium text-baby-900">{dayShortNames[index]}</span>
                  <span className="text-sm text-baby-500 hidden sm:inline">{day}</span>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={newTime.start}
                        onChange={(e) => setNewTime({ ...newTime, start: e.target.value })}
                        className="w-28"
                      />
                      <span className="text-baby-400">-</span>
                      <Input
                        type="time"
                        value={newTime.end}
                        onChange={(e) => setNewTime({ ...newTime, end: e.target.value })}
                        className="w-28"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`available-${index}`} className="text-sm">Available</Label>
                      <Switch
                        id={`available-${index}`}
                        checked={isAvailable}
                        onCheckedChange={setIsAvailable}
                      />
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => handleSave(index)}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : availability ? (
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-baby-500" />
                      <span className={`text-sm ${availability.is_available ? 'text-baby-700' : 'text-amber-700'}`}>
                        {availability.start_time} - {availability.end_time}
                      </span>
                    </div>
                    <Badge variant={availability.is_available ? "success" : "info"}>
                      {availability.is_available ? "Available" : "Unavailable"}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(availability.day_of_week!.toString())}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddAvailability(index)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add</span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
