"use client";

import { useState, useEffect } from "react";
import { Thermometer, Syringe, FileText, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClientInstance } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

export default function MedicalPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("vaccinations");
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [temperatureLogs, setTemperatureLogs] = useState<any[]>([]);
  const [babyId, setBabyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    };

    fetchBaby();
  }, []);

  useEffect(() => {
    if (babyId) {
      fetchVaccinations();
    }
  }, [babyId]);

  useEffect(() => {
    if (babyId && activeTab === "temperature") {
      fetchTemperatureLogs();
    }
  }, [babyId, activeTab]);

  const fetchVaccinations = async () => {
    if (!babyId) return;

    const { data } = await createClientInstance()
      .from("vaccination_schedule")
      .select("*")
      .eq("baby_id", babyId)
      .order("due_date", { ascending: true });

    if (data) {
      setVaccinations(data);
    }
  };

  const fetchTemperatureLogs = async () => {
    if (!babyId) return;

    setLoading(true);
    const { data } = await createClientInstance()
      .from("temperature_logs")
      .select("*")
      .eq("baby_id", babyId)
      .order("logged_at", { ascending: false })
      .limit(50);

    if (data) {
      setTemperatureLogs(data);
    }
    setLoading(false);
  };

  const getTemperatureStatus = (temp: number) => {
    if (temp < 36) return { label: "Low", color: "bg-blue-100 text-blue-700" };
    if (temp > 37.5) return { label: "Fever", color: "bg-red-100 text-red-700" };
    return { label: "Normal", color: "bg-green-100 text-green-700" };
  };

  const markVaccinationComplete = async (id: string) => {
    const { error } = await (createClientInstance() as any)
      .from("vaccination_schedule")
      .update({
        status: "completed",
        administered_date: new Date().toISOString().slice(0, 10),
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Failed to update",
        description: "Please try again",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Vaccination recorded!",
        description: "The vaccination has been marked as complete.",
        variant: "success",
      });
      fetchVaccinations();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge variant="success">Completed</Badge>;
      case "scheduled": return <Badge variant="info">Scheduled</Badge>;
      case "cancelled": return <Badge variant="secondary">Cancelled</Badge>;
      case "missed": return <Badge variant="destructive">Missed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const upcomingVaccinations = vaccinations.filter((v) => v.status === "scheduled");
  const completedVaccinations = vaccinations.filter((v) => v.status === "completed");

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
            <h1 className="text-xl font-semibold text-baby-900">Health Records</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vaccinations">
              <Syringe className="h-4 w-4 mr-1" />
              Vaccinations
            </TabsTrigger>
            <TabsTrigger value="visits">
              <FileText className="h-4 w-4 mr-1" />
              Visits
            </TabsTrigger>
            <TabsTrigger value="temperature">
              <Thermometer className="h-4 w-4 mr-1" />
              Temp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vaccinations" className="space-y-4">
            {/* Upcoming */}
            {upcomingVaccinations.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-baby-900 mb-3">Upcoming</h2>
                <div className="space-y-3">
                  {upcomingVaccinations.map((vax) => (
                    <Card key={vax.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                              <Syringe className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-baby-900">{vax.name}</p>
                              <p className="text-sm text-baby-600">Due: {formatDate(vax.due_date)}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => markVaccinationComplete(vax.id)}
                          >
                            Mark Done
                          </Button>
                        </div>
                        {vax.description && (
                          <p className="text-sm text-baby-500 mt-3">{vax.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completedVaccinations.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-baby-900 mb-3">Completed</h2>
                <div className="space-y-3">
                  {completedVaccinations.map((vax) => (
                    <Card key={vax.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                              <Syringe className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-baby-900">{vax.name}</p>
                              <p className="text-sm text-baby-600">
                                Given: {vax.administered_date ? formatDate(vax.administered_date) : "N/A"}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(vax.status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {vaccinations.length === 0 && (
              <div className="text-center py-16">
                <div className="h-20 w-20 rounded-full bg-baby-100 flex items-center justify-center mx-auto mb-6">
                  <Syringe className="h-10 w-10 text-baby-400" />
                </div>
                <h2 className="text-xl font-semibold text-baby-900 mb-2">No vaccinations yet</h2>
                <p className="text-baby-600">Vaccinations from the Rijksvaccinatieprogramma will appear here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="visits">
            <Card>
              <CardHeader>
                <CardTitle>Doctor Visits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-baby-600">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-baby-300" />
                  <p>No doctor visits recorded yet.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="temperature">
            {loading ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 rounded-full border-4 border-baby-200 border-t-baby-500 animate-spin mx-auto mb-4" />
                <p className="text-baby-600">Loading...</p>
              </div>
            ) : temperatureLogs.length > 0 ? (
              <div className="space-y-3">
                {temperatureLogs.map((log) => {
                  const status = getTemperatureStatus(log.temperature);
                  return (
                    <Card key={log.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${status.color.replace('text-', 'bg-').replace('700', '100')}`}>
                              <Thermometer className={`h-5 w-5 ${status.color.split(' ')[1]}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-baby-900">{log.temperature}°C</p>
                              <p className="text-sm text-baby-600">
                                {log.measurement_method} • {formatDate(log.logged_at)}
                              </p>
                            </div>
                          </div>
                          <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        {log.notes && (
                          <p className="text-sm text-baby-500 mt-3">{log.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Temperature Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-baby-600">
                    <Thermometer className="h-12 w-12 mx-auto mb-3 text-baby-300" />
                    <p>No temperature readings yet.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
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
            <Link href="/analytics" className="flex flex-col items-center p-2 text-baby-600">
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
