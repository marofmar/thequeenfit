"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import WodCard from "@/components/WodCard";
import { supabase } from "@/lib/supabase";

type WodData = {
  title: string;
  type: "cardio" | "gymnastics" | "strength";
  description: string;
  level: string;
};

type WodMap = {
  [key: string]: WodData;
};

export default function WodsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [wods, setWods] = useState<WodMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // 날짜를 YYMMDD 형식으로 변환하는 함수
  const formatDate = (date: Date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}${month}${day}`;
  };

  const dateString = formatDate(selectedDate);
  const selectedWod = wods[dateString];

  useEffect(() => {
    setMounted(true);
    fetchWods();
  }, []);

  const fetchWods = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching WODs from Supabase...");
      console.log("Current date format:", dateString);

      // 먼저 테이블의 모든 데이터를 확인
      const { data: allData, error: allError } = await supabase
        .from("wods")
        .select("*");

      if (allError) {
        console.error("Error fetching all data:", allError);
        throw allError;
      }

      console.log("All data in table:", allData);

      if (!allData || allData.length === 0) {
        console.log("No data found in the table");
        return;
      }

      const wodMap: WodMap = {};
      allData.forEach((wod: any) => {
        console.log("Processing WOD:", wod);
        wodMap[wod.date] = {
          title: wod.title,
          type: wod.type,
          description: wod.description,
          level: wod.level,
        };
      });

      console.log("Final WOD map:", wodMap);
      setWods(wodMap);
    } catch (error: any) {
      console.error("Error fetching WODs:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (value: any) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">🏋️ WOD 캘린더</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            className="rounded-lg shadow-md"
            locale="ko-KR"
            formatMonthYear={(locale, date) => {
              const year = date.getFullYear();
              const month = date.getMonth() + 1;
              return `${year}년 ${month}월`;
            }}
          />
        </div>

        <div>
          {isLoading ? (
            <div className="bg-white shadow-md rounded-lg p-6">
              <p className="text-gray-500">로딩 중...</p>
            </div>
          ) : selectedWod ? (
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
