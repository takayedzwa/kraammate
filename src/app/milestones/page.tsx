"use client";

import { useState } from "react";
import { Plus, Baby, Star, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createClientInstance } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

const PREDEFINED_MILESTONES = [
  { id: "first_smile", title: "First Smile", icon: "😊", category: "social" },
  { id: "first_laugh", title: "First Laugh", icon: "😂", category: "social" },
  { id: "first_bath", title: "First Bath", icon: "🛁", category: "first_time" },
  { id: "rolling_over", title: "Rolling Over", icon: "🔄", category: "physical" },
  { id: "sitting_up", title: "Sitting Up", icon: "🧘", category: "physical" },
  { id: "crawling", title: "Crawling", icon: "🐛", category: "physical" },
  { id: "first_steps", title: "First Steps", icon: "👣", category: "physical" },
  { id: "first_words", title: "First Words", icon: "💬", category: "communication" },
  { id: "first_teeth", title: "First Teeth", icon: "🦷", category: "physical" },
  { id: "solid_food", title: "First Solid Food", icon: "🥄", category: "feeding" },
];

interface Milestone {
  id: string;
  milestone_type: string;
  title: string;
  description: string | null;
  occurred_at: string;
  notes: string | null;
  media_urls: string[] | null;
  created_at: string;
  logged_by: string;
}

export default function MilestonesPage() {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<typeof PREDEFINED_MILESTONES[0] | null>(null);
  const [customMilestone, setCustomMilestone] = useState("");
  const [notes, setNotes] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await createClientInstance().auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get baby ID from user's babies (simplified - in real app would select baby)
      const { data: babies } = await createClientInstance()
        .from("babies")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);

      if (!babies || babies.length === 0) {
        toast({
          title: "No baby found",
          description: "Please create a baby profile first.",
          variant: "destructive",
        });
        return;
      }

      const baby = babies[0] as { id: string };
      const milestoneType = selectedMilestone ? selectedMilestone.id : "custom";
      const title = selectedMilestone ? selectedMilestone.title : customMilestone;

      const { data, error } = await (createClientInstance() as any)
        .from("milestones")
        .insert({
          baby_id: baby.id,
          logged_by: user.id,
          milestone_type: milestoneType,
          category: selectedMilestone?.category || "first_time",
          title,
          description: selectedMilestone?.title || null,
          occurred_at: new Date(occurredAt).toISOString(),
          notes: notes || null,
          is_custom: !selectedMilestone,
        })
        .select()
        .single();

      if (error) throw error;

      setMilestones([data as any, ...milestones]);
      setDialogOpen(false);
      setSelectedMilestone(null);
      setCustomMilestone("");
      setNotes("");
      setOccurredAt(new Date().toISOString().slice(0, 10));

      toast({
        title: "Milestone added!",
        description: `${title} has been recorded.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Failed to add milestone",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "physical": return "bg-red-100 text-red-700";
      case "social": return "bg-blue-100 text-blue-700";
      case "communication": return "bg-purple-100 text-purple-700";
      case "feeding": return "bg-green-100 text-green-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div className="min-h-screen bg-baby-50 pb-24 safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-baby-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-baby-900">Milestones</h1>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="rounded-full">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Milestone</DialogTitle>
                  <DialogDescription>
                    Record a precious moment in your baby&apos;s development.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMilestone} className="space-y-4">
                  {/* Predefined milestones */}
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {PREDEFINED_MILESTONES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMilestone(m)}
                        className={`p-3 rounded-xl text-left transition-all ${
                          selectedMilestone?.id === m.id
                            ? "bg-baby-500 text-white"
                            : "bg-baby-50 hover:bg-baby-100"
                        }`}
                      >
                        <span className="text-2xl">{m.icon}</span>
                        <p className={`text-sm mt-1 ${selectedMilestone?.id === m.id ? "text-white" : "text-baby-700"}`}>
                          {m.title}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Or custom */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-baby-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-baby-500">Or create custom</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom">Custom milestone</Label>
                    <Input
                      id="custom"
                      placeholder="e.g., First time at the beach"
                      value={customMilestone}
                      onChange={(e) => {
                        setCustomMilestone(e.target.value);
                        setSelectedMilestone(null);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={occurredAt}
                      onChange={(e) => setOccurredAt(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input
                      id="notes"
                      placeholder="Add a note..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading || (!selectedMilestone && !customMilestone)}>
                      {loading ? "Adding..." : "Add Milestone"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {milestones.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-full bg-baby-100 flex items-center justify-center mx-auto mb-6">
              <Star className="h-10 w-10 text-baby-400" />
            </div>
            <h2 className="text-xl font-semibold text-baby-900 mb-2">No milestones yet</h2>
            <p className="text-baby-600 mb-6">Start capturing those precious moments!</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Milestone
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-baby-200" />
              {milestones.map((milestone, index) => {
                const predefined = PREDEFINED_MILESTONES.find((m) => m.id === milestone.milestone_type);
                const icon = predefined?.icon || "⭐";
                return (
                  <div key={milestone.id} className="relative flex gap-4 pl-20 py-4">
                    <div className="absolute left-6 h-5 w-5 rounded-full bg-baby-500 border-4 border-white shadow" />
                    <Card className="flex-1">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{icon}</span>
                            <div>
                              <h3 className="font-semibold text-baby-900">{milestone.title}</h3>
                              <p className="text-sm text-baby-600">{formatDate(milestone.occurred_at)}</p>
                            </div>
                          </div>
                          <Badge className={getCategoryColor((milestone as any).category || "first_time")}>
                            {(milestone as any).category || "first_time"}
                          </Badge>
                        </div>
                        {milestone.notes && (
                          <p className="text-sm text-baby-600 mt-3 pt-3 border-t border-baby-100">
                            {milestone.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav Placeholder */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-baby-100 safe-bottom">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <a href="/dashboard" className="flex flex-col items-center p-2 text-baby-600">
              <Baby className="h-6 w-6" />
              <span className="text-xs mt-1">Home</span>
            </a>
            <a href="/tracking" className="flex flex-col items-center p-2 text-baby-600">
              <Plus className="h-6 w-6" />
              <span className="text-xs mt-1">Log</span>
            </a>
            <a href="/milestones" className="flex flex-col items-center p-2 text-baby-600">
              <Star className="h-6 w-6" />
              <span className="text-xs mt-1">Milestones</span>
            </a>
            <a href="/medical" className="flex flex-col items-center p-2 text-baby-600">
              <Heart className="h-6 w-6" />
              <span className="text-xs mt-1">Health</span>
            </a>
            <a href="/analytics" className="flex flex-col items-center p-2 text-baby-600">
              <Users className="h-6 w-6" />
              <span className="text-xs mt-1">Reports</span>
            </a>
          </div>
        </div>
      </nav>
    </div>
  );
}
