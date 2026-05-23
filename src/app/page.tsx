import Link from "next/link";
import { ArrowRight, Baby, Heart, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-baby-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-baby-500 flex items-center justify-center">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-baby-900">
              Dutch Babies Green Book
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4">
        <section className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-baby-900 mb-6">
              Your Baby&apos;s Journey,{" "}
              <span className="text-baby-500">Beautifully Tracked</span>
            </h1>
            <p className="text-xl text-baby-600 mb-8 leading-relaxed">
              Inspired by the Dutch Groene Boekje. A modern, shared baby health
              and development tracker for parents and kraamzorgers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Tracking Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16">
          <h2 className="text-3xl font-bold text-center text-baby-900 mb-12">
            Everything You Need to Track Baby&apos;s Progress
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-baby-100 flex items-center justify-center mb-4">
                  <Baby className="h-6 w-6 text-baby-600" />
                </div>
                <h3 className="text-lg font-semibold text-baby-900 mb-2">
                  Growth Tracking
                </h3>
                <p className="text-baby-600">
                  Track weight, height, and head circumference with WHO growth
                  charts.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-baby-100 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-baby-600" />
                </div>
                <h3 className="text-lg font-semibold text-baby-900 mb-2">
                  Daily Logs
                </h3>
                <p className="text-baby-600">
                  Easy tracking for feeding, sleep, diapers, and health metrics.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-baby-100 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-baby-600" />
                </div>
                <h3 className="text-lg font-semibold text-baby-900 mb-2">
                  Share with Kraamzorger
                </h3>
                <p className="text-baby-600">
                  Secure sharing so your maternity nurse can follow progress
                  remotely.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-baby-100 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-baby-600" />
                </div>
                <h3 className="text-lg font-semibold text-baby-900 mb-2">
                  Vaccination Schedule
                </h3>
                <p className="text-baby-600">
                  Dutch Rijksvaccinatieprogramma schedule with reminders.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-baby-100 flex items-center justify-center mb-4">
                  <Baby className="h-6 w-6 text-baby-600" />
                </div>
                <h3 className="text-lg font-semibold text-baby-900 mb-2">
                  Milestones
                </h3>
                <p className="text-baby-600">
                  Capture and share precious first moments with photos.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-baby-100 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-baby-600" />
                </div>
                <h3 className="text-lg font-semibold text-baby-900 mb-2">
                  Health Summary
                </h3>
                <p className="text-baby-600">
                  Export comprehensive reports for doctor visits.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-baby-900 mb-4">
              Ready to Start?
            </h2>
            <p className="text-xl text-baby-600 mb-8">
              Join hundreds of Dutch parents tracking their baby&apos;s journey.
            </p>
            <Link href="/auth/signup">
              <Button size="lg">
                Create Your Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-baby-100 mt-16">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-baby-600 text-sm">
            Dutch Babies Green Book - Inspired by the Groene Boekje
          </p>
        </div>
      </footer>
    </div>
  );
}
