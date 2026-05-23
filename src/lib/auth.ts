import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The server was likely hit from middleware - ignore
          }
        },
      },
    }
  );
};

export const requireAuth = async () => {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    redirect("/auth/signin");
  }

  return { session, supabase };
};

export const getSession = async () => {
  const supabase = await createClient();
  return supabase.auth.getSession();
};

export const getUser = async () => {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
};
