"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Baby, Camera } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBabies } from "@/hooks/use-baby";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function NewBabyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createBaby } = useBabies(user?.id || "");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    surname: "",
    date_of_birth: "",
    birth_time: "",
    birth_weight: "",
    birth_height: "",
    head_circumference: "",
    gender: "",
    gestational_age_weeks: "40",
    place_of_birth: "",
    midwife_info: "",
    gp_info: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullName = `${formData.first_name} ${formData.surname}`.trim();

      await createBaby({
        name: fullName,
        date_of_birth: new Date(formData.date_of_birth).toISOString(),
        birth_weight: parseFloat(formData.birth_weight), // Store as kg (schema uses DECIMAL)
        birth_height: parseFloat(formData.birth_height),
        head_circumference_at_birth: formData.head_circumference ? parseFloat(formData.head_circumference) : null,
        gender: formData.gender as "male" | "female" | "other",
        gestational_age_weeks: parseInt(formData.gestational_age_weeks),
        place_of_birth: formData.place_of_birth || null,
        midwife_info: formData.midwife_info || null,
        gp_info: formData.gp_info || null,
      });

      toast({
        title: "Baby profile created!",
        description: `${fullName}'s profile has been added.`,
        variant: "success",
      });

      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Failed to create profile",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-baby-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-baby-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-baby-900">Add Baby Profile</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Photo Placeholder */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-baby-100 flex items-center justify-center">
                    <Baby className="h-12 w-12 text-baby-400" />
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-baby-500 flex items-center justify-center text-white"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="e.g., Emma"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname *</Label>
                  <Input
                    id="surname"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    placeholder="e.g., Smith"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of birth *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_time">Time of birth</Label>
                  <Input
                    id="birth_time"
                    type="time"
                    value={formData.birth_time}
                    onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  className="flex h-12 w-full rounded-xl border-2 border-baby-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-baby-400"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Select gender</option>
                  <option value="male">Boy</option>
                  <option value="female">Girl</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gestational_age_weeks">Gestational age (weeks)</Label>
                <Input
                  id="gestational_age_weeks"
                  type="number"
                  value={formData.gestational_age_weeks}
                  onChange={(e) => setFormData({ ...formData, gestational_age_weeks: e.target.value })}
                  min="22"
                  max="44"
                />
              </div>

              <div className="border-t border-baby-100 pt-4 mt-6">
                <h3 className="text-lg font-semibold text-baby-900 mb-4">Birth Measurements</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_weight">Birth weight (kg) *</Label>
                    <Input
                      id="birth_weight"
                      type="number"
                      step="0.01"
                      placeholder="3.50"
                      value={formData.birth_weight}
                      onChange={(e) => setFormData({ ...formData, birth_weight: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_height">Length (cm) *</Label>
                    <Input
                      id="birth_height"
                      type="number"
                      step="0.1"
                      placeholder="50"
                      value={formData.birth_height}
                      onChange={(e) => setFormData({ ...formData, birth_height: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="head_circumference">Head (cm)</Label>
                    <Input
                      id="head_circumference"
                      type="number"
                      step="0.1"
                      placeholder="35"
                      value={formData.head_circumference}
                      onChange={(e) => setFormData({ ...formData, head_circumference: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-baby-100 pt-4 mt-6">
                <h3 className="text-lg font-semibold text-baby-900 mb-4">Medical Information</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="place_of_birth">Place of birth</Label>
                    <Input
                      id="place_of_birth"
                      value={formData.place_of_birth}
                      onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                      placeholder="e.g., Thuis, Ziekenhuis"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="midwife_info">Midwife / Kraamzorg</Label>
                    <Input
                      id="midwife_info"
                      value={formData.midwife_info}
                      onChange={(e) => setFormData({ ...formData, midwife_info: e.target.value })}
                      placeholder="Name and contact"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gp_info">General Practitioner (Huisarts)</Label>
                    <Input
                      id="gp_info"
                      value={formData.gp_info}
                      onChange={(e) => setFormData({ ...formData, gp_info: e.target.value })}
                      placeholder="Name and contact"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 mt-6" disabled={loading}>
                {loading ? "Creating profile..." : "Create Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
