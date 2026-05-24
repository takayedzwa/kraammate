"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Bell,
  CheckCircle,
  AlertCircle,
  Plus,
  Stethoscope,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useKraamzorger } from "@/hooks/use-kraamzorger";
import { useBookings } from "@/hooks/use-bookings";
import { useVisits } from "@/hooks/use-visits";
import Link from "next/link";
import { createClientInstance } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

interface DashboardStats {
  upcomingVisits: number;
  activeBookings: number;
  totalHoursThisWeek: number;
  pendingApprovals: number;
  totalFamilies: number;
  averageRating: number | null;
}

export default function KraamzorgerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, profile } = useAuth();
  const { profile: kProfile } = useKraamzorger(user?.id);
  const [stats, setStats] = useState<DashboardStats>({
    upcomingVisits: 0,
    activeBookings: 0,
    totalHoursThisWeek: 0,
    pendingApprovals: 0,
    totalFamilies: 0,
    averageRating: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      const client = createClientInstance();
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Fetch upcoming visits (next 7 days)
      const { data: visits, error: visitsError } = await client
        .from("kraamzorger_visits")
        .select("*")
        .eq("kraamzorger_id", user.id)
        .gte("visit_date", new Date().toISOString().split("T")[0])
        .lte("visit_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

      // Fetch active bookings
      const { data: bookings, error: bookingsError } = await client
        .from("kraamzorger_bookings")
        .select("*")
        .eq("kraamzorger_id", user.id)
        .in("status", ["pending", "accepted"]);

      // Fetch visits this week for hours calculation
      const { data: weekVisits } = await client
        .from("kraamzorger_visits")
        .select("duration_minutes")
        .eq("kraamzorger_id", user.id)
        .gte("visit_date", weekStart.toISOString().split("T")[0])
        .lte("visit_date", weekEnd.toISOString().split("T")[0]);

      // Fetch pending approvals
      const { data: pendingVisits } = await client
        .from("kraamzorger_visits")
        .select("*")
        .eq("kraamzorger_id", user.id)
        .eq("status", "pending_approval");

      // Fetch total unique families
      const { data: allBookings } = await client
        .from("kraamzorger_bookings")
        .select("baby_id")
        .eq("kraamzorger_id", user.id)
        .eq("status", "completed");

      // Fetch reviews for average rating
      const { data: reviews } = await client
        .from("kraamzorger_reviews")
        .select("rating")
        .eq("kraamzorger_id", user.id);

      const uniqueFamilies = new Set((allBookings as any[])?.map((b) => b.baby_id)).size;
      const totalMinutes = (weekVisits as any[])?.reduce((sum, v) => sum + (v.duration_minutes || 0), 0) || 0;
      const avgRating = reviews && reviews.length > 0
        ? (reviews as any[]).reduce((sum, r) => sum + r.rating, 0) / (reviews as any[]).length
        : null;

      setStats({
        upcomingVisits: visits?.length || 0,
        activeBookings: bookings?.length || 0,
        totalHoursThisWeek: Math.round((totalMinutes / 60) * 10) / 10,
        pendingApprovals: pendingVisits?.length || 0,
        totalFamilies: uniqueFamilies,
        averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baby-50">
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

  if (!kProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baby-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              Your kraamzorger profile could not be loaded. This may be because:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-baby-600 space-y-2">
              <li>• The database migration hasn't been run yet</li>
              <li>• There was an error creating your profile during signup</li>
            </ul>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => router.push("/dashboard")}>
                Go to Parent Dashboard
              </Button>
              <Button className="flex-1" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={kProfile.verification_status === "verified" ? "success" : "info"}>
                  {kProfile.verification_status === "verified" ? "Verified" : "Pending Verification"}
                </Badge>
                {kProfile.verification_status === "pending" && (
                  <span className="text-xs text-baby-500">Profile under review</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {stats.pendingApprovals > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {stats.pendingApprovals}
                  </span>
                )}
              </Button>
              <Link href="/kraamzorger/profile">
                <Button size="icon" className="rounded-full">
                  <Stethoscope className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-baby-900">{stats.upcomingVisits}</p>
                  <p className="text-xs text-baby-600">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-baby-900">{stats.activeBookings}</p>
                  <p className="text-xs text-baby-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-baby-900">{stats.totalHoursThisWeek}</p>
                  <p className="text-xs text-baby-600">Hours/week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-baby-900">{stats.pendingApprovals}</p>
                  <p className="text-xs text-baby-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-baby-900">{stats.totalFamilies}</p>
                  <p className="text-xs text-baby-600">Families</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-pink-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-baby-900">
                    {stats.averageRating || "-"}
                  </p>
                  <p className="text-xs text-baby-600">Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Link href="/kraamzorger/availability">
            <Card className="card-hover cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-baby-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-baby-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-baby-900">Availability</p>
                    <p className="text-xs text-baby-600">Manage schedule</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/kraamzorger/bookings">
            <Card className="card-hover cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-baby-900">Bookings</p>
                    <p className="text-xs text-baby-600">View requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/kraamzorger/visits">
            <Card className="card-hover cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-baby-900">Visits</p>
                    <p className="text-xs text-baby-600">Track time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/kraamzorger/profile">
            <Card className="card-hover cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Stethoscope className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-baby-900">Profile</p>
                    <p className="text-xs text-baby-600">Edit details</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Upcoming Visits */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-baby-900">
                Upcoming Visits
              </CardTitle>
              <Link href="/kraamzorger/visits">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-baby-600">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-baby-300" />
              <p>No upcoming visits scheduled</p>
              <p className="text-sm text-baby-500 mt-1">Visits will appear here once bookings are confirmed</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-baby-900">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-baby-600">
              <Clock className="h-12 w-12 mx-auto mb-3 text-baby-300" />
              <p>No recent activity</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-baby-100 safe-bottom">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <Link href="/kraamzorger/dashboard" className="flex flex-col items-center p-2 text-baby-600">
              <Calendar className="h-6 w-6" />
              <span className="text-xs mt-1">Dashboard</span>
            </Link>
            <Link href="/kraamzorger/visits" className="flex flex-col items-center p-2 text-baby-600">
              <Clock className="h-6 w-6" />
              <span className="text-xs mt-1">Visits</span>
            </Link>
            <Link href="/kraamzorger/bookings" className="flex flex-col items-center p-2 text-baby-600">
              <CheckCircle className="h-6 w-6" />
              <span className="text-xs mt-1">Bookings</span>
            </Link>
            <Link href="/kraamzorger/availability" className="flex flex-col items-center p-2 text-baby-600">
              <Calendar className="h-6 w-6" />
              <span className="text-xs mt-1">Schedule</span>
            </Link>
            <Link href="/kraamzorger/profile" className="flex flex-col items-center p-2 text-baby-600">
              <Stethoscope className="h-6 w-6" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
