"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeedingForm } from "@/components/tracking/feeding-form";
import { SleepForm } from "@/components/tracking/sleep-form";
import { DiaperForm } from "@/components/tracking/diaper-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GrowthForm } from "@/components/tracking/growth-form";
import { TemperatureForm } from "@/components/tracking/temperature-form";

function TrackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const babyId = searchParams.get("babyId") || "";
  const defaultTab = searchParams.get("type") || "feeding";

  if (!babyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baby-50">
        <div className="text-center">
          <p className="text-baby-600 mb-4">No baby selected</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-baby-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-baby-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-baby-900">Quick Log</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="feeding">Feeding</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
            <TabsTrigger value="diaper">Diaper</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="temp">Temp</TabsTrigger>
          </TabsList>

          <TabsContent value="feeding">
            <FeedingForm babyId={babyId} onSuccess={() => router.push("/dashboard")} />
          </TabsContent>

          <TabsContent value="sleep">
            <SleepForm babyId={babyId} onSuccess={() => router.push("/dashboard")} />
          </TabsContent>

          <TabsContent value="diaper">
            <DiaperForm babyId={babyId} onSuccess={() => router.push("/dashboard")} />
          </TabsContent>

          <TabsContent value="growth">
            <GrowthForm babyId={babyId} onSuccess={() => router.push("/dashboard")} />
          </TabsContent>

          <TabsContent value="temp">
            <TemperatureForm babyId={babyId} onSuccess={() => router.push("/dashboard")} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-baby-50">Loading...</div>}>
      <TrackingContent />
    </Suspense>
  );
}
