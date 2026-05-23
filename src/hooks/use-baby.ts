import { useEffect, useState, useCallback } from "react";
import { createClientInstance } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Baby = Database["public"]["Tables"]["babies"]["Row"];
type BabyInsert = Database["public"]["Tables"]["babies"]["Insert"];
type BabyUpdate = Database["public"]["Tables"]["babies"]["Update"];

export function useBaby(babyId?: string) {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!babyId) {
      setBaby(null);
      setLoading(false);
      return;
    }

    const fetchBaby = async () => {
      try {
        const { data, error } = await createClientInstance()
          .from("babies")
          .select("*")
          .eq("id", babyId)
          .single();

        if (error) throw error;
        setBaby(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchBaby();
  }, [babyId]);

  const updateBaby = async (updates: BabyUpdate) => {
    if (!babyId) throw new Error("No baby ID");
    const { data, error } = await (createClientInstance() as any)
      .from("babies")
      .update(updates)
      .eq("id", babyId)
      .select()
      .single();
    if (error) throw error;
    setBaby(data);
    return data;
  };

  return { baby, loading, error, updateBaby };
}

export function useBabies(userId: string) {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBabies = useCallback(async () => {
    console.log("useBabies: fetching babies for userId:", userId);
    try {
      // Get babies owned by user (simple query, no joins)
      const { data: ownedBabies, error: ownedError } = await createClientInstance()
        .from("babies")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (ownedError) {
        console.error("useBabies: ownedBabies error:", ownedError);
        throw ownedError;
      }

      console.log("useBabies: fetched", ownedBabies?.length || 0, "owned babies");
      setBabies(ownedBabies || []);
    } catch (err) {
      console.error("useBabies: error fetching babies:", JSON.stringify(err, null, 2));
      setError(err as Error);
      setBabies([]);
    } finally {
      console.log("useBabies: setting loading=false");
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchBabies();
    }
  }, [userId, fetchBabies]);

  const createBaby = async (babyData: Omit<BabyInsert, "owner_id">) => {
    console.log("createBaby: called with userId:", userId, "babyData:", babyData);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const client = createClientInstance();

    // 1. Create the baby record
    const { data: baby, error: babyError } = await client
      .from("babies")
      .insert({ ...babyData, owner_id: userId })
      .select()
      .single();

    if (babyError) {
      console.error("createBaby: Failed to create baby:", babyError);
      throw babyError;
    }

    // 2. Create default vaccination schedule (was done by trigger, now in code)
    const { error: vaxError } = await client
      .from("vaccination_schedule")
      .insert([
        { baby_id: baby.id, name: "DKTP-Hib-HepB (1)", description: "Diphtheria, Tetanus, Pertussis, Polio, Hib, Hepatitis B", recommended_age_weeks: 6, due_date: new Date(new Date(babyData.date_of_birth).getTime() + 6 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'scheduled' },
        { baby_id: baby.id, name: "DKTP-Hib-HepB (2)", description: "Diphtheria, Tetanus, Pertussis, Polio, Hib, Hepatitis B", recommended_age_weeks: 11, due_date: new Date(new Date(babyData.date_of_birth).getTime() + 11 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'scheduled' },
        { baby_id: baby.id, name: "Pneumococcal (1)", description: "Pneumococcal disease", recommended_age_weeks: 12, due_date: new Date(new Date(babyData.date_of_birth).getTime() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'scheduled' },
        { baby_id: baby.id, name: "DKTP-Hib-HepB (3)", description: "Diphtheria, Tetanus, Pertussis, Polio, Hib, Hepatitis B", recommended_age_weeks: 14, due_date: new Date(new Date(babyData.date_of_birth).getTime() + 14 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'scheduled' },
        { baby_id: baby.id, name: "Pneumococcal (2)", description: "Pneumococcal disease", recommended_age_weeks: 16, due_date: new Date(new Date(babyData.date_of_birth).getTime() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'scheduled' },
        { baby_id: baby.id, name: "BMR (1)", description: "Mumps, Measles, Rubella", recommended_age_weeks: 47, due_date: new Date(new Date(babyData.date_of_birth).getTime() + 47 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'scheduled' },
        { baby_id: baby.id, name: "DKTP (2)", description: "Diphtheria, Tetanus, Pertussis, Polio", recommended_age_weeks: 62, due_date: new Date(new Date(babyData.date_of_birth).getTime() + 62 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'scheduled' },
        { baby_id: baby.id, name: "DKTP (3)", description: "Diphtheria, Tetanus, Pertussis, Polio", recommended_age_weeks: 312, due_date: new Date(new Date(babyData.date_of_birth).getTime() + 312 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'scheduled' },
        { baby_id: baby.id, name: "BMR (2)", description: "Mumps, Measles, Rubella", recommended_age_weeks: 468, due_date: new Date(new Date(babyData.date_of_birth).getTime() + 468 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'scheduled' },
        { baby_id: baby.id, name: "DKTP (4)", description: "Diphtheria, Tetanus, Pertussis, Polio", recommended_age_weeks: 676, due_date: new Date(new Date(babyData.date_of_birth).getTime() + 676 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'scheduled' },
        { baby_id: baby.id, name: "MenACWY", description: "Meningococcal disease", recommended_age_weeks: 676, due_date: new Date(new Date(babyData.date_of_birth).getTime() + 676 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'scheduled' },
      ]);

    if (vaxError) {
      console.warn("createBaby: Failed to create vaccination schedule:", vaxError);
      // Don't throw - baby was created successfully, vaccination schedule can be added later
    }

    console.log("createBaby: Baby created successfully:", baby.id);
    setBabies((prev) => [...prev, baby]);
    return baby;
  };

  const deleteBaby = async (id: string) => {
    const { error } = await (createClientInstance() as any).from("babies").delete().eq("id", id);
    if (error) throw error;
    setBabies((prev) => prev.filter((b) => b.id !== id));
  };

  return { babies, loading, error, createBaby, deleteBaby, refetch: fetchBabies };
}
