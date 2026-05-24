"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Baby, Mail, Lock, User, Globe, Heart, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"parent" | "kraamzorger">("parent");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signUp(formData.email, formData.password, formData.name, selectedRole);

      // Check if user is already confirmed (email confirmations disabled)
      if (result.user?.email_confirmed_at) {
        // User is already confirmed - sign them in and redirect
        toast({
          title: "Account created!",
          description: "Redirecting to your dashboard...",
          variant: "success",
        });
        // The auth callback will handle profile creation since user is confirmed
        router.push(selectedRole === "kraamzorger" ? "/kraamzorger/dashboard" : "/dashboard");
      } else {
        // Email confirmation required
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account before signing in.",
          variant: "success",
        });
        router.push("/auth/verify?email=" + encodeURIComponent(formData.email));
      }
    } catch (error) {
      toast({
        title: "Sign up failed",
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
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Start tracking your baby&apos;s journey today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" suppressHydrationWarning>
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

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>I am a</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole("parent")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  selectedRole === "parent"
                    ? "border-baby-500 bg-baby-50 text-baby-700"
                    : "border-baby-200 hover:border-baby-300"
                }`}
              >
                <Heart className={`h-6 w-6 ${selectedRole === "parent" ? "text-baby-500" : "text-baby-400"}`} />
                <span className="font-medium text-sm">Parent</span>
                <span className="text-xs text-baby-500 text-center">Track my baby&apos;s growth</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("kraamzorger")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  selectedRole === "kraamzorger"
                    ? "border-baby-500 bg-baby-50 text-baby-700"
                    : "border-baby-200 hover:border-baby-300"
                }`}
              >
                <Stethoscope className={`h-6 w-6 ${selectedRole === "kraamzorger" ? "text-baby-500" : "text-baby-400"}`} />
                <span className="font-medium text-sm">Kraamzorger</span>
                <span className="text-xs text-baby-500 text-center">Provide professional care</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-baby-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

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
                  placeholder="At least 8 characters"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={8}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-baby-600">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-baby-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
