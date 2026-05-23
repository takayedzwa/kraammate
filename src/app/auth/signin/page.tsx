"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Baby, Mail, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function SignInPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, sendMagicLink } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(formData.email, formData.password);
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
        variant: "success",
      });
      window.location.href = "/dashboard";
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendMagicLink(formData.email);
      setMagicLinkSent(true);
      toast({
        title: "Check your email",
        description: "We've sent you a magic link to sign in.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Failed to send link",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Google sign in failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-baby-50 to-white px-4" suppressHydrationWarning>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-baby-500 flex items-center justify-center mb-4">
            <Baby className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue tracking your baby&apos;s journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" suppressHydrationWarning>
          {magicLinkSent ? (
            <div className="text-center p-4 bg-baby-50 rounded-xl">
              <Mail className="h-8 w-8 text-baby-500 mx-auto mb-2" />
              <p className="text-baby-700 font-medium">Check your email</p>
              <p className="text-sm text-baby-600">
                Click the link we sent to {formData.email}
              </p>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={handleGoogleSignIn}
              >
                <Globe className="h-5 w-5 mr-2" />
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-baby-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-baby-500">Or continue with</span>
                </div>
              </div>

              <form onSubmit={handlePasswordSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-baby-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-baby-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <Button
                variant="ghost"
                className="w-full"
                onClick={handleMagicLink}
                disabled={loading}
              >
                Send me a magic link instead
              </Button>
            </>
          )}

          <p className="text-center text-sm text-baby-600">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-baby-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
