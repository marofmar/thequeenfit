"use client";

import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import WodCard from "@/components/WodCard";

type WodData = {
  title: string;
  type: "cardio" | "gymnastics" | "strength";
  description: string;
  level: string;
};

type WodMap = {
  [key: string]: WodData;
};

// 샘플 데이터
const sampleWods: WodMap = {
  "2025-05-18": {
    title: "오늘의 WOD",
    type: "cardio",
    description: "20분 AMRAP\n- 400m 런\n- 20 Burpees\n- 20 Box Jumps",
    level: "Intermediate",
  },
  "2025-05-19": {
    title: "Strength WOD",
    type: "strength",
    description: "5 Rounds\n- 5 Deadlifts\n- 5 Front Squats\n- 5 Push Press",
    level: "Advanced",
  },
};

export default function WodsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateString = selectedDate.toISOString().split("T")[0];
  const selectedWod = sampleWods[dateString];

  const handleDateChange = (value: any) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">🏋️ WOD 캘린더</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            className="rounded-lg shadow-md"
          />
        </div>

        <div>
          {selectedWod ? (
            <WodCard
              date={dateString}
              title={selectedWod.title}
              type={selectedWod.type}
              description={selectedWod.description}
              level={selectedWod.level}
            />
          ) : (
            <div className="bg-white shadow-md rounded-lg p-6">
              <p className="text-gray-500">선택한 날짜의 WOD가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
