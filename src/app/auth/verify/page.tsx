import Link from "next/link";
import { Baby, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-baby-50 to-white px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-baby-500 flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a verification link to activate your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-baby-50 rounded-xl text-center">
            <p className="text-baby-700 text-sm">
              Didn&apos;t receive the email? Check your spam folder or try signing up again.
            </p>
          </div>
          <Link href="/auth/signin" className="block">
            <Button variant="outline" className="w-full h-12">
              Back to sign in
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="ghost" className="w-full">
              Return to home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
