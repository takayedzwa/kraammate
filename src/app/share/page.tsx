"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Share2, Link as LinkIcon, Copy, Check, Mail, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createClientInstance } from "@/lib/supabase";
import { useBabies } from "@/hooks/use-baby";
import { useAuth } from "@/hooks/use-auth";

export default function SharePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { babies } = useBabies(user?.id || "");
  const { toast } = useToast();
  const [selectedBaby, setSelectedBaby] = useState("");
  const [permission, setPermission] = useState<"view_only" | "view_and_edit">("view_only");
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (babies.length > 0 && !selectedBaby) {
      setSelectedBaby(babies[0].id);
    }
  }, [babies, selectedBaby]);

  const generateShareLink = async () => {
    if (!selectedBaby) return;

    setGenerating(true);
    try {
      const { data: { user: currentUser } } = await createClientInstance().auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      // Create share token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const { data, error } = await (createClientInstance() as any)
        .from("share_tokens")
        .insert({
          baby_id: selectedBaby,
          permission,
          expires_at: expiresAt.toISOString(),
          created_by: currentUser.id,
          max_uses: 5,
        })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/share/${data.token}`;
      setShareLink(link);

      toast({
        title: "Share link created!",
        description: "Link expires in 7 days.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Failed to generate link",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
      variant: "success",
    });
  };

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Baby's Care Team",
          text: "I've invited you to track our baby's progress using Dutch Babies Green Book!",
          url: shareLink,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className="min-h-screen bg-baby-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-baby-100">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-baby-900">Share Access</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Select Baby */}
        <Card>
          <CardHeader>
            <CardTitle>Select Baby</CardTitle>
            <CardDescription>
              Choose which baby to share access for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {babies.map((baby) => (
                <button
                  key={baby.id}
                  onClick={() => setSelectedBaby(baby.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedBaby === baby.id
                      ? "bg-baby-500 text-white"
                      : "bg-white text-baby-700 border border-baby-200"
                  }`}
                >
                  {baby.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permission Level */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Level</CardTitle>
            <CardDescription>
              What can the kraamzorger do?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <button
                onClick={() => setPermission("view_only")}
                className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                  permission === "view_only"
                    ? "border-baby-500 bg-baby-50"
                    : "border-baby-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info">View Only</Badge>
                </div>
                <p className="text-sm text-baby-700">
                  Can view all data but cannot add or edit entries.
                </p>
              </button>
              <button
                onClick={() => setPermission("view_and_edit")}
                className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                  permission === "view_and_edit"
                    ? "border-baby-500 bg-baby-50"
                    : "border-baby-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success">View & Edit</Badge>
                </div>
                <p className="text-sm text-baby-700">
                  Can view and add feeding, sleep, and diaper logs.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Generate Link */}
        {!shareLink ? (
          <Button
            className="w-full h-12"
            onClick={generateShareLink}
            disabled={generating || !selectedBaby}
          >
            {generating ? "Generating..." : "Generate Share Link"}
          </Button>
        ) : (
          <>
            {/* Share Link Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-baby-500" />
                  Your Share Link
                </CardTitle>
                <CardDescription>
                  Send this link to the kraamzorger
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-baby-50 rounded-xl break-all text-sm text-baby-700">
                  {shareLink}
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyLink} variant="outline" className="flex-1">
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button onClick={shareViaNative} className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* QR Code Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-baby-500" />
                  QR Code
                </CardTitle>
                <CardDescription>
                  Scan to join quickly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-baby-100 rounded-xl flex items-center justify-center">
                  <p className="text-baby-500 text-sm">QR Code would render here</p>
                </div>
              </CardContent>
            </Card>

            {/* Email Invite */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-baby-500" />
                  Email Invite
                </CardTitle>
                <CardDescription>
                  Send directly via email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  type="email"
                  placeholder="kraamzorger@example.com"
                  className="flex h-12 w-full rounded-xl border-2 border-baby-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-baby-400"
                />
                <Button variant="outline" className="w-full">
                  Send Email Invite
                </Button>
              </CardContent>
            </Card>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShareLink("");
                setCopied(false);
              }}
            >
              Generate Another Link
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
