"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Baby, Droplets, Moon, Thermometer, Milestone, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useBabies } from "@/hooks/use-baby";
import { useToast } from "@/hooks/use-toast";
import { useTodayStats } from "@/hooks/use-today-stats";
import { calculateAge, formatDate } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ReminderDialog } from "@/components/notifications/reminder-dialog";
import { useRealtime } from "@/hooks/use-realtime";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, profile } = useAuth();
  const { babies, loading: babiesLoading } = useBabies(user?.id || "");
  const { toast } = useToast();
  const [selectedBaby, setSelectedBaby] = useState<string | null>(null);
  const { activities } = useRealtime({ babyId: selectedBaby || undefined });
  const { stats: todayStats } = useTodayStats(selectedBaby);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (babies.length > 0 && !selectedBaby) {
      setSelectedBaby(babies[0].id);
    }
  }, [babies.length, selectedBaby]);

  if (authLoading || babiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-baby-200 border-t-baby-500 animate-spin mx-auto mb-4" />
          <p className="text-baby-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-baby-50 pb-24 safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-baby-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-baby-900">
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}
                {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-sm text-baby-600">
                {babies.length} {babies.length === 1 ? "baby" : "babies"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedBaby && <ReminderDialog babyId={selectedBaby} />}
              <NotificationBell />
              <Link href="/babies/new">
                <Button size="icon" className="rounded-full">
                  <Plus className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Baby selector */}
          {babies.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar">
              {babies.map((baby) => (
                <button
                  key={baby.id}
                  onClick={() => setSelectedBaby(baby.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedBaby === baby.id
                      ? "bg-baby-500 text-white shadow-md"
                      : "bg-white text-baby-700 border border-baby-200"
                  }`}
                >
                  <Baby className="h-4 w-4" />
                  <span className="text-sm font-medium">{baby.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {babies.length === 0 ? (
          /* Empty state - no babies */
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-full bg-baby-100 flex items-center justify-center mx-auto mb-6">
              <Baby className="h-10 w-10 text-baby-500" />
            </div>
            <h2 className="text-2xl font-semibold text-baby-900 mb-2">
              Welcome to Dutch Babies Green Book
            </h2>
            <p className="text-baby-600 mb-6 max-w-sm mx-auto">
              Start by adding your baby&apos;s profile to begin tracking their growth and development.
            </p>
            <Link href="/babies/new">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Your Baby
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Today's Summary Card */}
            <Card className="mb-6 gradient-soft border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-baby-900">
                  Today&apos;s Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mx-auto mb-2">
                      <Droplets className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-baby-900">{todayStats.feedings}</p>
                    <p className="text-xs text-baby-600">Feedings</p>
                  </div>
                  <div className="text-center">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mx-auto mb-2">
                      <Moon className="h-5 w-5 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-baby-900">{todayStats.sleeps}</p>
                    <p className="text-xs text-baby-600">Sleeps</p>
                  </div>
                  <div className="text-center">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mx-auto mb-2">
                      <Droplets className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-baby-900">{todayStats.diapers}</p>
                    <p className="text-xs text-baby-600">Diapers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Link href={`/tracking?babyId=${selectedBaby}&type=feeding`} className="block">
                <Card className="card-hover cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Droplets className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-baby-900">Feeding</p>
                        <p className="text-xs text-baby-600">Log meal</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href={`/tracking?babyId=${selectedBaby}&type=sleep`} className="block">
                <Card className="card-hover cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Moon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-baby-900">Sleep</p>
                        <p className="text-xs text-baby-600">Track rest</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href={`/tracking?babyId=${selectedBaby}&type=diaper`} className="block">
                <Card className="card-hover cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Droplets className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-baby-900">Diaper</p>
                        <p className="text-xs text-baby-600">Log change</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href={`/tracking?babyId=${selectedBaby}&type=growth`} className="block">
                <Card className="card-hover cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <Thermometer className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-baby-900">Growth</p>
                        <p className="text-xs text-baby-600">Measure</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href={`/tracking?babyId=${selectedBaby}&type=temp`} className="block">
                <Card className="card-hover cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                        <Thermometer className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-baby-900">Temp</p>
                        <p className="text-xs text-baby-600">Log</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Baby Info Card */}
            {selectedBaby && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-baby-900">
                    Baby Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {babies.filter((b) => b.id === selectedBaby).map((baby) => (
                    <div key={baby.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-baby-600">Age</span>
                        <Badge>{calculateAge(baby.date_of_birth)}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-baby-600">Birthday</span>
                        <span className="text-baby-900 font-medium">
                          {formatDate(baby.date_of_birth)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-baby-600">Birth weight</span>
                        <span className="text-baby-900 font-medium">
                          {(baby.birth_weight / 1000).toFixed(2)} kg
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-baby-600">Birth length</span>
                        <span className="text-baby-900 font-medium">
                          {baby.birth_height} cm
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-baby-900">
                    Recent Activity
                  </CardTitle>
                  <Link href="/milestones">
                    <Button variant="ghost" size="sm">
                      <Milestone className="h-4 w-4 mr-1" />
                      Milestones
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-baby-600">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-baby-300" />
                    <p>No activity yet. Start tracking!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.slice(0, 10).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-baby-50">
                        <div className="h-8 w-8 rounded-full bg-baby-100 flex items-center justify-center flex-shrink-0">
                          <Activity className="h-4 w-4 text-baby-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-baby-900">{activity.summary}</p>
                          <p className="text-xs text-baby-500">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-baby-100 safe-bottom">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <Link href="/dashboard" className="flex flex-col items-center p-2 text-baby-600">
              <Baby className="h-6 w-6" />
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link
              href={selectedBaby ? `/tracking?babyId=${selectedBaby}` : "/tracking"}
              className="flex flex-col items-center p-2 text-baby-600"
            >
              <Plus className="h-6 w-6" />
              <span className="text-xs mt-1">Log</span>
            </Link>
            <Link href="/milestones" className="flex flex-col items-center p-2 text-baby-600">
              <Milestone className="h-6 w-6" />
              <span className="text-xs mt-1">Milestones</span>
            </Link>
            <Link href="/medical" className="flex flex-col items-center p-2 text-baby-600">
              <Thermometer className="h-6 w-6" />
              <span className="text-xs mt-1">Health</span>
            </Link>
            <Link href="/analytics" className="flex flex-col items-center p-2 text-baby-600">
              <Calendar className="h-6 w-6" />
              <span className="text-xs mt-1">Reports</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
