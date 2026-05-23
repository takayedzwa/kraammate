"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Baby, Users, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClientInstance } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/types/database";

type ShareToken = Database["public"]["Tables"]["share_tokens"]["Row"];
type Baby = Database["public"]["Tables"]["babies"]["Row"];

export default function ShareAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [shareToken, setShareToken] = useState<ShareToken | null>(null);
  const [baby, setBaby] = useState<Baby | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const fetchShareToken = async () => {
      try {
        const { data, error } = await (createClientInstance() as any)
          .from("share_tokens")
          .select("*, babies(*)")
          .eq("token", params.token)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Invalid share token");

        setShareToken(data);
        setBaby(data.babies);

        // Check if already used
        if (data.used_at) {
          toast({
            title: "Link already used",
            description: "This invite link has already been redeemed.",
            variant: "destructive",
          });
        }

        // Check expiration
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
          toast({
            title: "Link expired",
            description: "This invite link has expired.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Invalid invite",
          description: "This share link is invalid or has expired.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShareToken();
  }, [params.token, toast]);

  const handleAccept = async () => {
    if (!user || !shareToken) return;

    setAccepting(true);
    try {
      // Check if caregiver relationship already exists
      const { data: existing } = await (createClientInstance() as any)
        .from("caregivers")
        .select("*")
        .eq("baby_id", shareToken.baby_id)
        .eq("user_id", user.id)
        .single();

      if (existing && existing.status === "active") {
        toast({
          title: "Already connected",
          description: "You already have access to this baby.",
        });
        router.push("/dashboard");
        return;
      }

      // Create or update caregiver relationship
      const { error } = await (createClientInstance() as any).from("caregivers").upsert({
        baby_id: shareToken.baby_id,
        user_id: user.id,
        name: user.email?.split("@")[0] || "Caregiver",
        permission: shareToken.permission,
        status: "active",
        accepted_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Mark token as used
      await (createClientInstance() as any)
        .from("share_tokens")
        .update({
          used_at: new Date().toISOString(),
          used_by: user.id,
          uses_count: (shareToken.uses_count || 0) + 1,
        })
        .eq("id", shareToken.id);

      toast({
        title: "Welcome to the team!",
        description: `You now have access to ${baby?.name}'s progress.`,
        variant: "success",
      });

      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Failed to accept invite",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
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

  if (!shareToken || !baby) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baby-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>
              This share link is invalid or has expired. Please ask the parent to send you a new invite.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(shareToken.expires_at) < new Date();
  const isUsed = shareToken.used_at !== null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-baby-50 to-white px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-baby-500 flex items-center justify-center mb-4">
            <Baby className="h-8 w-8 text-white" />
          </div>
          <CardTitle>Join {baby.name}&apos;s Care Team</CardTitle>
          <CardDescription>
            You&apos;ve been invited to track {baby.name}&apos;s progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Baby Info */}
          <div className="p-4 bg-baby-50 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-baby-600">Baby</span>
              <span className="font-medium text-baby-900">{baby.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-baby-600">Permission</span>
              <Badge variant={shareToken.permission === "view_and_edit" ? "success" : "info"}>
                {shareToken.permission === "view_and_edit" ? "View & Edit" : "View Only"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-baby-600">Expires</span>
              <span className={`font-medium ${isExpired ? "text-red-500" : "text-baby-900"}`}>
                {new Date(shareToken.expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Permissions Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-baby-700">
              <Users className="h-4 w-4" />
              <span>Access to growth charts, milestones, and daily logs</span>
            </div>
            {shareToken.permission === "view_and_edit" && (
              <div className="flex items-center gap-2 text-sm text-baby-700">
                <Check className="h-4 w-4" />
                <span>Can add feeding, sleep, and diaper logs</span>
              </div>
            )}
          </div>

          {isExpired || isUsed ? (
            <div className="p-4 bg-red-50 rounded-xl text-center">
              <p className="text-red-700 font-medium">
                {isExpired ? "This invite has expired" : "This invite has already been used"}
              </p>
              <p className="text-sm text-red-600 mt-1">
                Please request a new invite from the parent.
              </p>
            </div>
          ) : user ? (
            <Button
              className="w-full h-12"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? "Accepting..." : "Accept Invite"}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-sm text-baby-600">
                Sign in or create an account to accept this invite
              </p>
              <Button className="w-full h-12" onClick={() => router.push("/auth/signin")}>
                Sign In
              </Button>
              <Button variant="outline" className="w-full h-12" onClick={() => router.push("/auth/signup")}>
                Create Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
