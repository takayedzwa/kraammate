"use client";

import { useState, useEffect, useCallback } from "react";
import { createClientInstance } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { VisitStatus } from "@/types/database";

interface Visit {
  id: string;
  booking_id: string;
  kraamzorger_id: string;
  baby_id: string;
  visit_date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  travel_time_minutes: number | null;
  activities_performed: Array<{ type: string; description: string; duration?: number }> | null;
  notes: string | null;
  status: VisitStatus;
  parent_approved_at: string | null;
  parent_signature: string | null;
  dispute_reason: string | null;
  created_at: string;
  updated_at: string;
  baby_name?: string;
  parent_name?: string;
}

interface UseVisitsReturn {
  visits: Visit[];
  loading: boolean;
  startVisit: (bookingId: string, babyId: string) => Promise<Visit>;
  endVisit: (visitId: string, durationMinutes: number, notes?: string) => Promise<void>;
  submitForApproval: (visitId: string) => Promise<void>;
  approveVisit: (visitId: string, signature?: string) => Promise<void>;
  disputeVisit: (visitId: string, reason: string) => Promise<void>;
  refreshVisits: () => Promise<void>;
}

export function useVisits(userId?: string, role?: "parent" | "kraamzorger"): UseVisitsReturn {
  const { toast } = useToast();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const client = createClientInstance() as any;

      let query = client
        .from("kraamzorger_visits")
        .select(`
          *,
          booking:kraamzorger_bookings!inner (
            id,
            baby_id,
            parent_id,
            kraamzorger_id,
            baby:babies (
              id,
              name,
              owner_id
            ),
            parent:profiles!parent_id (
              id,
              full_name
            )
          )
        `);

      if (role === "kraamzorger") {
        query = query.eq("kraamzorger_id", userId);
      } else {
        // For parents, filter by babies they own
        query = query.filter("booking.baby.owner_id", "eq", userId);
      }

      const { data, error } = await query.order("visit_date", { ascending: false });

      if (error) throw error;

      const processedVisits: Visit[] = (data || []).map((v: any) => ({
        ...v,
        baby_name: v.booking?.baby?.name,
        parent_name: v.booking?.parent?.full_name,
      }));

      setVisits(processedVisits);
    } catch (error) {
      console.error("Error fetching visits:", error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const startVisit = async (bookingId: string, babyId: string): Promise<Visit> => {
    try {
      const client = createClientInstance() as any;
      const { data: { user } } = await client.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { data: visit, error } = await client
        .from("kraamzorger_visits")
        .insert({
          booking_id: bookingId,
          kraamzorger_id: user.id,
          baby_id: babyId,
          visit_date: new Date().toISOString().split("T")[0],
          start_time: new Date().toISOString(),
          status: "in_progress",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Visit started",
        description: "Timer is now running. Don't forget to end the visit when done.",
        variant: "success",
      });

      return visit as Visit;
    } catch (error) {
      toast({
        title: "Failed to start visit",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const endVisit = async (visitId: string, durationMinutes: number, notes?: string) => {
    try {
      const client = createClientInstance() as any;

      const { error } = await client
        .from("kraamzorger_visits")
        .update({
          end_time: new Date().toISOString(),
          duration_minutes: durationMinutes,
          notes: notes || null,
          status: "completed",
        })
        .eq("id", visitId);

      if (error) throw error;

      toast({
        title: "Visit ended",
        description: `Visit duration: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
        variant: "success",
      });

      await fetchVisits();
    } catch (error) {
      toast({
        title: "Failed to end visit",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const submitForApproval = async (visitId: string) => {
    try {
      const client = createClientInstance() as any;

      const { error } = await client
        .from("kraamzorger_visits")
        .update({
          status: "pending_approval",
        })
        .eq("id", visitId);

      if (error) throw error;

      toast({
        title: "Submitted for approval",
        description: "The parent will be notified to review and approve this visit.",
        variant: "success",
      });

      // Notify parent
      const visit = visits.find((v) => v.id === visitId);
      if (visit && visit.booking_id) {
        const { data: booking } = await client
          .from("kraamzorger_bookings")
          .select("parent_id")
          .eq("id", visit.booking_id)
          .single();

        if (booking) {
          await client.from("notifications").insert({
            user_id: booking.parent_id,
            title: "Visit Ready for Approval",
            message: `A visit needs your approval.`,
            type: "appointment_reminder",
          });
        }
      }

      await fetchVisits();
    } catch (error) {
      toast({
        title: "Failed to submit for approval",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const approveVisit = async (visitId: string, signature?: string) => {
    try {
      const client = createClientInstance() as any;

      const { error } = await client
        .from("kraamzorger_visits")
        .update({
          status: "approved",
          parent_approved_at: new Date().toISOString(),
          parent_signature: signature || null,
        })
        .eq("id", visitId);

      if (error) throw error;

      toast({
        title: "Visit approved",
        description: "The visit has been approved successfully.",
        variant: "success",
      });

      await fetchVisits();
    } catch (error) {
      toast({
        title: "Failed to approve visit",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const disputeVisit = async (visitId: string, reason: string) => {
    try {
      const client = createClientInstance() as any;

      const { error } = await client
        .from("kraamzorger_visits")
        .update({
          status: "disputed",
          dispute_reason: reason,
        })
        .eq("id", visitId);

      if (error) throw error;

      toast({
        title: "Visit disputed",
        description: "The visit has been marked as disputed.",
        variant: "default",
      });

      await fetchVisits();
    } catch (error) {
      toast({
        title: "Failed to dispute visit",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    visits,
    loading,
    startVisit,
    endVisit,
    submitForApproval,
    approveVisit,
    disputeVisit,
    refreshVisits: fetchVisits,
  };
}
