"use client";

import { useState, useEffect, useCallback } from "react";
import { createClientInstance } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface Availability {
  id: string;
  kraamzorger_id: string;
  day_of_week: number | null; // 0-6 for recurring, null for specific date
  specific_date: string | null;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_vacation: boolean;
  notes: string | null;
  created_at: string;
}

export interface RecurringAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface UseAvailabilityReturn {
  availabilities: Availability[];
  recurringAvailabilities: RecurringAvailability[];
  loading: boolean;
  fetchAvailabilities: () => Promise<void>;
  addRecurringAvailability: (data: Omit<RecurringAvailability, "id">) => Promise<void>;
  updateRecurringAvailability: (id: string, data: Partial<RecurringAvailability>) => Promise<void>;
  deleteRecurringAvailability: (id: string) => Promise<void>;
  addSpecificDateAvailability: (data: Omit<Availability, "id" | "kraamzorger_id" | "created_at">) => Promise<void>;
  deleteSpecificDateAvailability: (id: string) => Promise<void>;
  setVacationPeriod: (startDate: string, endDate: string, notes?: string) => Promise<void>;
  setBookedPeriod: (startDate: string, endDate: string, notes?: string) => Promise<void>;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function useAvailability(kraamzorgerId?: string): UseAvailabilityReturn {
  const { toast } = useToast();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailabilities = useCallback(async () => {
    if (!kraamzorgerId) {
      setLoading(false);
      return;
    }

    try {
      const client = createClientInstance() as any;

      const { data, error } = await client
        .from("kraamzorger_availability")
        .select("*")
        .eq("kraamzorger_id", kraamzorgerId)
        .order("day_of_week", { ascending: true });

      if (error) throw error;

      setAvailabilities(data || []);
    } catch (error) {
      console.error("Error fetching availabilities:", error);
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  }, [kraamzorgerId]);

  useEffect(() => {
    fetchAvailabilities();
  }, [fetchAvailabilities]);

  const addRecurringAvailability = async (data: Omit<RecurringAvailability, "id">) => {
    if (!kraamzorgerId) return;

    try {
      const client = createClientInstance() as any;

      const { error } = await client
        .from("kraamzorger_availability")
        .insert({
          kraamzorger_id: kraamzorgerId,
          day_of_week: data.day_of_week,
          specific_date: null,
          start_time: data.start_time,
          end_time: data.end_time,
          is_available: data.is_available,
          is_vacation: false,
        });

      if (error) throw error;

      toast({
        title: "Availability added",
        description: `Your ${dayNames[data.day_of_week]} availability has been set.`,
        variant: "success",
      });

      await fetchAvailabilities();
    } catch (error) {
      toast({
        title: "Failed to add availability",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateRecurringAvailability = async (id: string, data: Partial<RecurringAvailability>) => {
    try {
      const client = createClientInstance() as any;

      const updateData: Record<string, unknown> = {};
      if (data.day_of_week !== undefined) updateData.day_of_week = data.day_of_week;
      if (data.start_time !== undefined) updateData.start_time = data.start_time;
      if (data.end_time !== undefined) updateData.end_time = data.end_time;
      if (data.is_available !== undefined) updateData.is_available = data.is_available;

      const { error } = await client
        .from("kraamzorger_availability")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Availability updated",
        description: "Your availability has been updated.",
        variant: "success",
      });

      await fetchAvailabilities();
    } catch (error) {
      toast({
        title: "Failed to update availability",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteRecurringAvailability = async (id: string) => {
    try {
      const client = createClientInstance() as any;

      const { error } = await client
        .from("kraamzorger_availability")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Availability removed",
        description: "Your availability has been removed.",
        variant: "success",
      });

      await fetchAvailabilities();
    } catch (error) {
      toast({
        title: "Failed to remove availability",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addSpecificDateAvailability = async (data: Omit<Availability, "id" | "kraamzorger_id" | "created_at">) => {
    if (!kraamzorgerId) return;

    try {
      const client = createClientInstance() as any;

      const { error } = await client
        .from("kraamzorger_availability")
        .insert({
          kraamzorger_id: kraamzorgerId,
          day_of_week: null,
          specific_date: data.specific_date,
          start_time: data.start_time,
          end_time: data.end_time,
          is_available: data.is_available,
          is_vacation: data.is_vacation,
          notes: data.notes,
        });

      if (error) throw error;

      toast({
        title: "Date availability added",
        description: "Your custom date availability has been set.",
        variant: "success",
      });

      await fetchAvailabilities();
    } catch (error) {
      toast({
        title: "Failed to add date availability",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSpecificDateAvailability = async (id: string) => {
    try {
      const client = createClientInstance() as any;

      const { error } = await client
        .from("kraamzorger_availability")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Date availability removed",
        description: "The date availability has been removed.",
        variant: "success",
      });

      await fetchAvailabilities();
    } catch (error) {
      toast({
        title: "Failed to remove date availability",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const setVacationPeriod = async (startDate: string, endDate: string, notes?: string) => {
    if (!kraamzorgerId) return;

    try {
      const client = createClientInstance() as any;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const vacationEntries = [];

      for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        vacationEntries.push({
          kraamzorger_id: kraamzorgerId,
          day_of_week: null,
          specific_date: d.toISOString().split("T")[0],
          start_time: "00:00",
          end_time: "23:59",
          is_available: false,
          is_vacation: true,
          notes: notes || "Vacation",
        });
      }

      const { error } = await client
        .from("kraamzorger_availability")
        .insert(vacationEntries);

      if (error) throw error;

      toast({
        title: "Vacation period set",
        description: `Vacation from ${startDate} to ${endDate}.`,
        variant: "success",
      });

      await fetchAvailabilities();
    } catch (error) {
      toast({
        title: "Failed to set vacation period",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const setBookedPeriod = async (startDate: string, endDate: string, notes?: string) => {
    if (!kraamzorgerId) return;

    try {
      const client = createClientInstance() as any;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const bookedEntries = [];

      for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        bookedEntries.push({
          kraamzorger_id: kraamzorgerId,
          day_of_week: null,
          specific_date: d.toISOString().split("T")[0],
          start_time: "00:00",
          end_time: "23:59",
          is_available: false,
          is_vacation: false,
          notes: notes || "Booked",
        });
      }

      const { error } = await client
        .from("kraamzorger_availability")
        .insert(bookedEntries);

      if (error) throw error;

      toast({
        title: "Booked period set",
        description: `Already booked from ${startDate} to ${endDate}.`,
        variant: "success",
      });

      await fetchAvailabilities();
    } catch (error) {
      toast({
        title: "Failed to set booked period",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const recurringAvailabilities = availabilities
    .filter((a) => a.day_of_week !== null && !a.is_vacation)
    .map((a) => ({
      day_of_week: a.day_of_week as number,
      start_time: a.start_time,
      end_time: a.end_time,
      is_available: a.is_available,
    }));

  return {
    availabilities,
    recurringAvailabilities,
    loading,
    fetchAvailabilities,
    addRecurringAvailability,
    updateRecurringAvailability,
    deleteRecurringAvailability,
    addSpecificDateAvailability,
    deleteSpecificDateAvailability,
    setVacationPeriod,
    setBookedPeriod,
  };
}
