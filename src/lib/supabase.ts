import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

// Singleton client for browser - only created once per session
let browserClient: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase credentials not configured");
  }

  if (typeof window !== "undefined") {
    if (!browserClient) {
      console.log("Creating new Supabase client (singleton)", { url: supabaseUrl });
      browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: {
            getItem: (key) => {
              const item = localStorage.getItem(key);
              console.log("auth storage getItem:", key, item ? "found" : "null");
              return item;
            },
            setItem: (key, value) => {
              console.log("auth storage setItem:", key);
              localStorage.setItem(key, value);
            },
            removeItem: (key) => {
              console.log("auth storage removeItem:", key);
              localStorage.removeItem(key);
            },
          },
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } else {
      console.log("Reusing existing Supabase client (singleton)");
    }
    return browserClient;
  }
  // Server-side: create new instance (safe in server components)
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
};

export const createClientInstance = getSupabaseClient;

export const createBrowserClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};
