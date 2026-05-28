"use client";

import { useState } from "react";
import { CalendarX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Vacation {
  id: string;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  is_vacation: boolean;
  notes: string | null;
}

interface VacationSelectorProps {
  vacations: Vacation[];
  onSetVacation: (startDate: string, endDate: string, notes?: string) => Promise<void>;
  onDeleteVacation: (id: string) => Promise<void>;
  isBookedMode?: boolean;
  onSetBooked?: (startDate: string, endDate: string, notes?: string) => Promise<void>;
  onDeleteBooked?: (id: string) => Promise<void>;
}

export function VacationSelector({
  vacations,
  onSetVacation,
  onDeleteVacation,
  isBookedMode = false,
  onSetBooked,
  onDeleteBooked
}: VacationSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSetVacation = async () => {
    if (!startDate || !endDate) return;
    if (isBookedMode && onSetBooked) {
      await onSetBooked(startDate, endDate, notes || "Booked");
    } else {
      await onSetVacation(startDate, endDate, notes || "Vacation");
    }
    setIsAdding(false);
    setStartDate("");
    setEndDate("");
    setNotes("");
  };

  const handleCancel = () => {
    setIsAdding(false);
    setStartDate("");
    setEndDate("");
    setNotes("");
  };

  // Group vacation/booked entries by date range
  const vacationDates = vacations
    .filter((v) => v.specific_date && (isBookedMode ? !v.is_vacation : v.is_vacation))
    .map((v) => v.specific_date!)
    .sort();

  const vacationRanges = [];
  if (vacationDates.length > 0) {
    let rangeStart = vacationDates[0];
    let rangeEnd = vacationDates[0];

    for (let i = 1; i < vacationDates.length; i++) {
      const currentDate = vacationDates[i];
      const expectedDate = new Date(rangeEnd);
      expectedDate.setDate(expectedDate.getDate() + 1);

      if (currentDate === expectedDate.toISOString().split("T")[0]) {
        rangeEnd = currentDate;
      } else {
        vacationRanges.push({ start: rangeStart, end: rangeEnd });
        rangeStart = currentDate;
        rangeEnd = currentDate;
      }
    }
    vacationRanges.push({ start: rangeStart, end: rangeEnd });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarX className="h-5 w-5" />
          {isBookedMode ? "Booked Periods" : "Vacation Periods"}
        </CardTitle>
        <CardDescription>
          {isBookedMode
            ? "Mark dates when you're already committed to another family"
            : "Mark dates when you're unavailable due to vacation"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding ? (
          <div className="space-y-4 p-4 bg-baby-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                type="text"
                placeholder="Vacation"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSetVacation} size="sm">
                Set Vacation
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="w-full"
          >
            <CalendarX className="h-4 w-4 mr-2" />
            {isBookedMode ? "Add Booked Period" : "Add Vacation Period"}
          </Button>
        )}

        {vacationRanges.length > 0 && (
          <div className="space-y-2">
            <Label>{isBookedMode ? "Upcoming Booked Periods" : "Upcoming Vacations"}</Label>
            <div className="space-y-2">
              {vacationRanges.map((range, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isBookedMode
                      ? "bg-purple-50 border-purple-100"
                      : "bg-amber-50 border-amber-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarX className={`h-4 w-4 ${isBookedMode ? "text-purple-600" : "text-amber-600"}`} />
                    <div>
                      <p className={`text-sm font-medium ${isBookedMode ? "text-purple-900" : "text-amber-900"}`}>
                        {new Date(range.start).toLocaleDateString()} - {new Date(range.end).toLocaleDateString()}
                      </p>
                      <p className={`text-xs ${isBookedMode ? "text-purple-600" : "text-amber-600"}`}>
                        {Math.ceil((new Date(range.end).getTime() - new Date(range.start).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const start = new Date(range.start);
                      const end = new Date(range.end);
                      const deleteFn = isBookedMode ? onDeleteBooked : onDeleteVacation;
                      for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split("T")[0];
                        const vacation = vacations.find((v) => v.specific_date === dateStr);
                        if (vacation && deleteFn) deleteFn(vacation.id);
                      }
                    }}
                  >
                    <X className={`h-4 w-4 ${isBookedMode ? "text-purple-600" : "text-amber-600"}`} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {vacationRanges.length === 0 && !isAdding && (
          <p className="text-sm text-baby-500 text-center py-4">
            No vacation periods set
          </p>
        )}
      </CardContent>
    </Card>
  );
}
