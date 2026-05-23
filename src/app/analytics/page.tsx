"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, Activity, Moon, Droplets, Weight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClientInstance } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Database } from "@/types/database";

type SleepLog = Database["public"]["Tables"]["sleep_logs"]["Row"];
type GrowthLog = Database["public"]["Tables"]["growth_logs"]["Row"];

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [babyId, setBabyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFeedings: 0,
    totalSleeps: 0,
    totalDiapers: 0,
    avgSleepDuration: 0,
    lastWeight: null as number | null,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchBaby = async () => {
      const { data: { user } } = await createClientInstance().auth.getUser();
      if (!user) return;

      const { data } = await createClientInstance()
        .from("babies")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);

      if (data && data.length > 0) {
        const baby = data[0] as { id: string };
        setBabyId(baby.id);
      }
      setLoading(false);
    };

    fetchBaby();
  }, []);

  useEffect(() => {
    if (babyId) {
      fetchAnalytics();
    }
  }, [babyId]);

  const fetchAnalytics = async () => {
    if (!babyId) return;

    // Fetch feeding logs (last 7 days)
    const { data: feedings } = await createClientInstance()
      .from("feeding_logs")
      .select("*")
      .eq("baby_id", babyId)
      .gte("start_time", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("start_time", { ascending: true });

    // Fetch sleep logs
    const { data: sleeps } = await createClientInstance()
      .from("sleep_logs")
      .select("*")
      .eq("baby_id", babyId)
      .gte("start_time", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("start_time", { ascending: true });

    // Fetch diaper logs
    const { data: diapers } = await createClientInstance()
      .from("diaper_logs")
      .select("*")
      .eq("baby_id", babyId)
      .gte("logged_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("logged_at", { ascending: true });

    // Fetch growth logs
    const { data: growth } = await createClientInstance()
      .from("growth_logs")
      .select("*")
      .eq("baby_id", babyId)
      .order("logged_at", { ascending: true });

    // Calculate stats
    const totalFeedings = feedings?.length || 0;
    const totalSleeps = sleeps?.length || 0;
    const totalDiapers = diapers?.length || 0;
    const avgSleepDuration = (sleeps && sleeps.length > 0)
      ? sleeps.reduce((acc: number, s: SleepLog) => acc + (s.duration_minutes || 0), 0) / sleeps.length
      : 0;
    const lastWeight = growth && growth.length > 0 ? (growth[growth.length - 1] as GrowthLog).weight : null;

    setStats({
      totalFeedings,
      totalSleeps,
      totalDiapers,
      avgSleepDuration: Math.round(avgSleepDuration),
      lastWeight,
    });

    // Prepare chart data (daily aggregation)
    const dailyData: Record<string, any> = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      dailyData[dateStr] = {
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        feedings: 0,
        sleeps: 0,
        diapers: 0,
      };
    }

    (feedings as any[])?.forEach((f: any) => {
      const dateStr = f.start_time.slice(0, 10);
      if (dailyData[dateStr]) dailyData[dateStr].feedings++;
    });

    (sleeps as any[])?.forEach((s: any) => {
      const dateStr = s.start_time.slice(0, 10);
      if (dailyData[dateStr]) dailyData[dateStr].sleeps++;
    });

    (diapers as any[])?.forEach((d: any) => {
      const dateStr = d.logged_at.slice(0, 10);
      if (dailyData[dateStr]) dailyData[dateStr].diapers++;
    });

    setChartData(Object.values(dailyData));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baby-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-baby-200 border-t-baby-500 animate-spin mx-auto mb-4" />
          <p className="text-baby-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-baby-50 pb-24 safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-baby-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-baby-900">Analytics & Reports</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-baby-900">{stats.totalFeedings}</p>
                  <p className="text-xs text-baby-600">Feedings (7d)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Moon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-baby-900">{stats.totalSleeps}</p>
                  <p className="text-xs text-baby-600">Sleeps (7d)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-baby-900">{stats.totalDiapers}</p>
                  <p className="text-xs text-baby-600">Diapers (7d)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Weight className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-baby-900">
                    {stats.lastWeight ? (stats.lastWeight / 1000).toFixed(2) : "--"}
                  </p>
                  <p className="text-xs text-baby-600">Last weight (kg)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feeding Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Daily Activity (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="feedings" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Feedings" />
                  <Bar dataKey="sleeps" fill="#a855f7" radius={[4, 4, 0, 0]} name="Sleeps" />
                  <Bar dataKey="diapers" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Diapers" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-baby-600">
                <Activity className="h-12 w-12 mx-auto mb-3 text-baby-300" />
                <p>No data yet. Start tracking to see analytics!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sleep Duration Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-purple-500" />
              Sleep Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-baby-600">Avg. sleep duration</span>
                <Badge>{stats.avgSleepDuration} min</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-baby-600">Total sleep sessions</span>
                <Badge variant="secondary">{stats.totalSleeps}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Export Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Health Summary (PDF)
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export All Data (CSV)
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-baby-100 safe-bottom">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <Link href="/dashboard" className="flex flex-col items-center p-2 text-baby-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link href="/tracking" className="flex flex-col items-center p-2 text-baby-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs mt-1">Log</span>
            </Link>
            <Link href="/milestones" className="flex flex-col items-center p-2 text-baby-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-xs mt-1">Milestones</span>
            </Link>
            <Link href="/medical" className="flex flex-col items-center p-2 text-baby-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs mt-1">Health</span>
            </Link>
            <Link href="/analytics" className="flex flex-col items-center p-2 text-baby-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs mt-1">Reports</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
