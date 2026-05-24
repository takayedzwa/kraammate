"use client";

import { useState, useEffect, useCallback } from "react";
import { createClientInstance } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { BookingStatus } from "@/types/database";

interface Booking {
  id: string;
  kraamzorger_id: string;
  parent_id: string;
  baby_id: string;
  start_date: string;
  end_date: string;
  total_hours_estimated: number | null;
  hourly_rate: number | null;
  status: BookingStatus;
  parent_notes: string | null;
  kraamzorger_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  parent_name?: string;
  baby_name?: string;
}

interface UseBookingsReturn {
  bookings: Booking[];
  loading: boolean;
  acceptBooking: (bookingId: string) => Promise<void>;
  rejectBooking: (bookingId: string, reason: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  completeBooking: (bookingId: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
}

export function useBookings(userId?: string, role?: "parent" | "kraamzorger"): UseBookingsReturn {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const client = createClientInstance();

      let query = client
        .from("kraamzorger_bookings")
        .select(`
          *,
          baby:babies!inner (
            id,
            name,
            owner_id
          ),
          parent:profiles!parent_id (
            id,
            full_name,
            email
          )
        `);

      if (role === "kraamzorger") {
        query = query.eq("kraamzorger_id", userId);
      } else {
        query = query.eq("parent_id", userId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      const processedBookings: Booking[] = (data || []).map((b: any) => ({
        ...b,
        parent_name: b.parent?.full_name,
        baby_name: b.baby?.name,
      }));

      setBookings(processedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const acceptBooking = async (bookingId: string) => {
    try {
      const client = createClientInstance();

      const { error } = await (client as any)
        .from("kraamzorger_bookings")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking accepted",
        description: "The booking has been accepted successfully.",
        variant: "success",
      });

      // Create notification for parent
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        await (client as any).from("notifications").insert({
          user_id: booking.parent_id,
          title: "Booking Accepted",
          message: `Your booking request has been accepted.`,
          type: "appointment_reminder",
        });
      }

      await fetchBookings();
    } catch (error) {
      toast({
        title: "Failed to accept booking",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const rejectBooking = async (bookingId: string, reason: string) => {
    try {
      const client = createClientInstance();

      const { error } = await (client as any)
        .from("kraamzorger_bookings")
        .update({
          status: "rejected",
          rejection_reason: reason,
        })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking rejected",
        description: "The booking has been rejected.",
        variant: "default",
      });

      // Create notification for parent
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        await (client as any).from("notifications").insert({
          user_id: booking.parent_id,
          title: "Booking Update",
          message: `Your booking request was updated.`,
          type: "appointment_reminder",
        });
      }

      await fetchBookings();
    } catch (error) {
      toast({
        title: "Failed to reject booking",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const client = createClientInstance();

      const { error } = await (client as any)
        .from("kraamzorger_bookings")
        .update({
          status: "cancelled",
        })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking cancelled",
        description: "The booking has been cancelled.",
        variant: "default",
      });

      await fetchBookings();
    } catch (error) {
      toast({
        title: "Failed to cancel booking",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const completeBooking = async (bookingId: string) => {
    try {
      const client = createClientInstance();

      const { error } = await (client as any)
        .from("kraamzorger_bookings")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking completed",
        description: "The booking has been marked as completed.",
        variant: "success",
      });

      await fetchBookings();
    } catch (error) {
      toast({
        title: "Failed to complete booking",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    bookings,
    loading,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    completeBooking,
    refreshBookings: fetchBookings,
  };
}

export async function createBooking(data: {
  kraamzorger_id: string;
  baby_id: string;
  start_date: string;
  end_date: string;
  total_hours_estimated?: number;
  hourly_rate?: number;
  parent_notes?: string;
}) {
  const client = createClientInstance();
  const { data: { user } } = await client.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Check for booking conflicts
  const { data: hasConflict } = await (client as any).rpc("check_booking_conflict", {
    p_kraamzorger_id: data.kraamzorger_id,
    p_start_date: data.start_date,
    p_end_date: data.end_date,
  });

  if (hasConflict) {
    throw new Error("This kraamzorger is not available for the selected dates");
  }

  const { data: booking, error } = await (client as any)
    .from("kraamzorger_bookings")
    .insert({
      kraamzorger_id: data.kraamzorger_id,
      parent_id: user.id,
      baby_id: data.baby_id,
      start_date: data.start_date,
      end_date: data.end_date,
      total_hours_estimated: data.total_hours_estimated,
      hourly_rate: data.hourly_rate,
      parent_notes: data.parent_notes,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  // Create notification for kraamzorger
  await (client as any).from("notifications").insert({
    user_id: data.kraamzorger_id,
    title: "New Booking Request",
    message: `You have a new booking request.`,
    type: "appointment_reminder",
  });

  return booking;
}
