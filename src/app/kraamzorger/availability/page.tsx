"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useKraamzorger } from "@/hooks/use-kraamzorger";
import { useAvailability, type RecurringAvailability } from "@/hooks/use-availability";
import { AvailabilityCalendar } from "@/components/kraamzorger/availability-calendar";
import { VacationSelector } from "@/components/kraamzorger/vacation-selector";

export default function KraamzorgerAvailabilityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile: kProfile } = useKraamzorger(user?.id);
  const {
    availabilities,
    recurringAvailabilities,
    loading,
    addRecurringAvailability,
    updateRecurringAvailability,
    deleteRecurringAvailability,
    addSpecificDateAvailability,
    deleteSpecificDateAvailability,
    setVacationPeriod,
    setBookedPeriod,
  } = useAvailability(user?.id);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAvailability = async (data: Omit<RecurringAvailability, "id">) => {
    setIsSubmitting(true);
    try {
      await addRecurringAvailability(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteRecurringAvailability(id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetVacation = async (startDate: string, endDate: string, notes?: string) => {
    setIsSubmitting(true);
    try {
      await setVacationPeriod(startDate, endDate, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVacation = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteSpecificDateAvailability(id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetBooked = async (startDate: string, endDate: string, notes?: string) => {
    setIsSubmitting(true);
    try {
      await setBookedPeriod(startDate, endDate, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBooked = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteSpecificDateAvailability(id);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !kProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baby-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              Please complete your kraamzorger profile registration first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/kraamzorger/profile">
              <Button className="w-full">Go to Profile</Button>
            </Link>
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
            <div className="flex items-center gap-3">
              <Link href="/kraamzorger/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-baby-900">Availability</h1>
                <p className="text-sm text-baby-500">Manage your schedule and vacation periods</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Availability Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-baby-50 rounded-xl">
                <Clock className="h-6 w-6 mx-auto mb-2 text-baby-600" />
                <p className="text-2xl font-bold text-baby-900">
                  {recurringAvailabilities.length}
                </p>
                <p className="text-xs text-baby-600">Days/week</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-900">
                  {recurringAvailabilities.filter((a) => a.is_available).length}
                </p>
                <p className="text-xs text-green-600">Available</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-xl">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                <p className="text-2xl font-bold text-amber-900">
                  {availabilities.filter((a) => a.is_vacation && a.specific_date !== null).length}
                </p>
                <p className="text-xs text-amber-600">Vacation days</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold text-purple-900">
                  {availabilities.filter((a) => !a.is_vacation && a.specific_date !== null).length}
                </p>
                <p className="text-xs text-purple-600">Booked days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Availability */}
        <AvailabilityCalendar
          availabilities={recurringAvailabilities}
          onAdd={handleAddAvailability}
          onUpdate={updateRecurringAvailability}
          onDelete={handleDeleteAvailability}
        />

        {/* Vacation Periods */}
        <VacationSelector
          vacations={availabilities.filter((a) => a.is_vacation)}
          onSetVacation={handleSetVacation}
          onDeleteVacation={handleDeleteVacation}
        />

        {/* Booked Periods */}
        <VacationSelector
          vacations={availabilities.filter((a) => !a.is_vacation && a.specific_date !== null)}
          onSetVacation={handleSetVacation}
          onDeleteVacation={handleDeleteVacation}
          isBookedMode={true}
          onSetBooked={handleSetBooked}
          onDeleteBooked={handleDeleteBooked}
        />

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tips for Managing Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-baby-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-baby-700">1</span>
              </div>
              <p className="text-sm text-baby-600">
                Set your regular weekly schedule first. This helps parents know when you're typically available.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-baby-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-baby-700">2</span>
              </div>
              <p className="text-sm text-baby-600">
                Mark vacation periods well in advance so parents can plan alternative care.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-baby-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-baby-700">3</span>
              </div>
              <p className="text-sm text-baby-600">
                Add booked periods as soon as you accept a booking. This prevents double-booking and helps parents searching for your availability.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-baby-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-baby-700">4</span>
              </div>
              <p className="text-sm text-baby-600">
                Use specific date overrides for holidays or special circumstances that differ from your regular schedule.
              </p>
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
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs mt-1">Bookings</span>
            </Link>
            <Link href="/kraamzorger/availability" className="flex flex-col items-center p-2 text-baby-500 bg-baby-50 rounded-lg">
              <Calendar className="h-6 w-6" />
              <span className="text-xs mt-1">Schedule</span>
            </Link>
            <Link href="/kraamzorger/profile" className="flex flex-col items-center p-2 text-baby-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
