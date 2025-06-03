"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import WodCard from "@/components/WodCard";
import { supabase } from "@/lib/supabase";

type WodData = {
  title: string;
  type: ("cardio" | "gymnastics" | "strength")[];
  description: string;
  level: string;
};

type WodMap = {
  [key: string]: WodData;
};

// 랭킹 관련 상수 및 타입
const LEVEL_PRIORITY = ["Rxd", "Scaled", "A", "B", "C"];

type RecordRow = {
  id: string;
  member_name: string;
  score_value: number;
  score_raw: string;
  level: string;
  wod_id: string;
  wod_date: string;
  remark?: string;
};

export default function WodsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [wods, setWods] = useState<WodMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [isRankingLoading, setIsRankingLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("전체");

  // 날짜를 YYMMDD 형식으로 변환하는 함수
  const formatDate = (date: Date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}${month}${day}`;
  };

  // ISO 날짜를 YYMMDD 형식으로 변환하는 함수
  const formatISODate = (isoDate: string) => {
    const date = new Date(isoDate);
    return formatDate(date);
  };

  const dateString = formatDate(selectedDate);
  const selectedWod = wods[dateString];

  // 랭킹용: YYYY-MM-DD 포맷 필요
  const rankingDateString = (() => {
    // selectedDate는 Date 객체
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
    const day = selectedDate.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  // 랭킹 데이터 fetch
  useEffect(() => {
    const fetchRecords = async () => {
      setIsRankingLoading(true);
      const { data, error } = await supabase
        .from("records")
        .select(
          "id, member_name, score_value, score_raw, level, wod_id, wod_date, remark"
        )
        .eq("wod_date", rankingDateString)
        .not("score_value", "is", null);
      if (!error && data) {
        setRecords(data);
      }
      setIsRankingLoading(false);
    };
    fetchRecords();
  }, [rankingDateString]);

  // level 우선순위 정렬 함수
  const levelOrder = (level: string) => {
    const idx = LEVEL_PRIORITY.indexOf(level);
    return idx === -1 ? 999 : idx;
  };

  // 해당 날짜의 기록에 실제로 존재하는 level만 추출
  const levelsInRecords = LEVEL_PRIORITY.filter((level) =>
    records.some((r) => r.level === level)
  );

  // level 필터링
  const filtered =
    selectedLevel === "전체"
      ? records
      : records.filter((r) => r.level === selectedLevel);

  // level > score_value > member_name 순 정렬
  const sorted = [...filtered].sort((a, b) => {
    const levelDiff = levelOrder(a.level) - levelOrder(b.level);
    if (levelDiff !== 0) return levelDiff;
    if (b.score_value !== a.score_value) return b.score_value - a.score_value;
    return a.member_name.localeCompare(b.member_name);
  });

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
        console.log("Processing WOD for date:", wod.date);
        console.log("Raw WOD data:", wod);

        // type이 문자열인 경우 쉼표로 분리하여 배열로 변환
        const types = Array.isArray(wod.type)
          ? wod.type
          : typeof wod.type === "string"
          ? wod.type.startsWith("[")
            ? JSON.parse(wod.type)
            : wod.type
                .split(",")
                .map(
                  (t: string) =>
                    t.trim() as "cardio" | "gymnastics" | "strength"
                )
          : [wod.type];

        console.log("Processed types:", types);
        const formattedDate = formatISODate(wod.date);
        console.log("Date being used as key:", formattedDate);

        wodMap[formattedDate] = {
          title: wod.title,
          type: types,
          description: wod.description,
          level: wod.level,
        };
      });

      console.log("Final WOD map:", wodMap);
      console.log("Available dates in map:", Object.keys(wodMap));
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

      {/* 랭킹 테이블 */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4 text-[#3b2ff5]">🏆 랭킹</h2>
        <div className="max-w-4xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div />
          <div className="flex items-center gap-2">
            <label
              htmlFor="level-select"
              className="font-medium text-[#3b2ff5]"
            >
              레벨 필터:
            </label>
            <select
              id="level-select"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-[#a18fff]"
            >
              <option value="전체">전체</option>
              {levelsInRecords.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
        {isRankingLoading ? (
          <p className="text-gray-500 text-center">로딩 중...</p>
        ) : sorted.length === 0 ? (
          <p className="text-gray-400 text-center">
            이 날짜의 기록이 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white/80 shadow-lg rounded-2xl border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff] rounded-tl-2xl">
                    순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff]">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff]">
                    레벨
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff]">
                    메모
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff] rounded-tr-2xl">
                    기록
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={
                      idx === 0
                        ? "bg-gradient-to-r from-[#a18fff]/60 to-[#3b2ff5]/60 text-white font-bold"
                        : idx % 2 === 0
                        ? "bg-[#f8f7fd] hover:bg-[#ecebfa]"
                        : "bg-white hover:bg-[#f3f0ff]"
                    }
                  >
                    <td className="px-6 py-3 text-center rounded-l-2xl">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-3">{r.member_name}</td>
                    <td className="px-6 py-3">{r.level}</td>
                    <td className="px-6 py-3 text-gray-600 whitespace-pre-line text-sm">
                      {r.remark || ""}
                    </td>
                    <td className="px-6 py-3 text-right rounded-r-2xl">
                      {r.score_raw}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
