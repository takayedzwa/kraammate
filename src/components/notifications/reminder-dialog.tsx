"use client";

import { useState } from "react";
import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useReminders } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";

interface ReminderDialogProps {
  babyId: string;
}

type ReminderType = "feeding_reminder" | "medication_reminder" | "appointment_reminder" | "sleep_reminder" | "vaccination_reminder";

const REMINDER_TYPES: { value: ReminderType; label: string; icon: string }[] = [
  { value: "feeding_reminder", label: "Feeding", icon: "🍼" },
  { value: "medication_reminder", label: "Medication", icon: "💊" },
  { value: "appointment_reminder", label: "Appointment", icon: "📅" },
  { value: "sleep_reminder", label: "Sleep", icon: "😴" },
  { value: "vaccination_reminder", label: "Vaccination", icon: "💉" },
];

export function ReminderDialog({ babyId }: ReminderDialogProps) {
  const { toast } = useToast();
  const { createReminder, reminders, deleteReminder, toggleReminder } = useReminders(babyId);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reminderType, setReminderType] = useState<ReminderType>("feeding_reminder");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState(new Date().toISOString().slice(0, 16));
  const [recurrence, setRecurrence] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createReminder(
        reminderType,
        title,
        new Date(scheduledFor),
        description || undefined,
        recurrence || undefined
      );

      toast({
        title: "Reminder created!",
        description: "You'll be notified at the scheduled time.",
        variant: "success",
      });

      setOpen(false);
      setTitle("");
      setDescription("");
      setScheduledFor(new Date().toISOString().slice(0, 16));
      setRecurrence("");
    } catch (error) {
      toast({
        title: "Failed to create reminder",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatReminderTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Clock className="h-4 w-4" />
          Reminders
          {reminders.length > 0 && (
            <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
              {reminders.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Manage Reminders
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing reminders */}
          {reminders.length > 0 && (
            <div className="space-y-2">
              <Label>Active Reminders</Label>
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 bg-baby-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {REMINDER_TYPES.find((t) => t.value === reminder.reminder_type)?.icon || "🔔"}
                    </span>
                    <div>
                      <p className="font-medium text-sm text-baby-900">{reminder.title}</p>
                      <p className="text-xs text-baby-500">{formatReminderTime(reminder.scheduled_for)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleReminder(reminder.id, !reminder.is_active)}
                      className={`h-8 ${reminder.is_active ? "text-green-600" : "text-baby-400"}`}
                    >
                      {reminder.is_active ? "✓" : "○"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReminder(reminder.id)}
                      className="h-8 text-red-500"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create new reminder form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-baby-900 font-medium">
              <Plus className="h-4 w-4" />
              New Reminder
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2 flex-wrap">
                {REMINDER_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setReminderType(type.value)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      reminderType === type.value
                        ? "bg-baby-500 text-white"
                        : "bg-baby-100 text-baby-700 hover:bg-baby-200"
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-title">Title</Label>
              <Input
                id="reminder-title"
                placeholder="e.g., Morning feeding"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-desc">Description (optional)</Label>
              <Input
                id="reminder-desc"
                placeholder="e.g., 120ml formula"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-time">Schedule for</Label>
              <Input
                id="reminder-time"
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-recurrence">Repeat (optional)</Label>
              <select
                id="reminder-recurrence"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="flex h-12 w-full rounded-xl border-2 border-baby-200 bg-white px-4 py-3 text-sm"
              >
                <option value="">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="every_3_hours">Every 3 hours</option>
                <option value="every_4_hours">Every 4 hours</option>
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Reminder"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
