"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import WodCard from "@/components/WodCard";
import { supabase } from "@/lib/supabase";
import RankingTable from "@/components/RankingTable";

const LEVEL_PRIORITY = ["Rxd", "Scaled", "A", "B", "C"];

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [wod, setWod] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [isRankingLoading, setIsRankingLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("전체");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSelectedDate(new Date());
    setMounted(true);

    // 오늘 날짜 설정 (클라이언트에서만)
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    setToday(`${y}-${m}-${day}`);
  }, []);

  // 오늘의 WOD fetch
  useEffect(() => {
    if (!today) return;

    const fetchWod = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("wods")
        .select("date, title, type, description, level")
        .eq("date", today)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (!error && data) {
        // type 파싱
        let typeArr = Array.isArray(data.type)
          ? data.type
          : typeof data.type === "string"
          ? data.type.startsWith("[")
            ? JSON.parse(data.type)
            : data.type.split(",").map((t: string) => t.trim())
          : [];
        setWod({ ...data, type: typeArr });
      } else {
        setWod(null);
      }
      setIsLoading(false);
    };
    fetchWod();
  }, [today]);

  // 오늘 랭킹 fetch
  useEffect(() => {
    if (!today) return;

    const fetchRecords = async () => {
      setIsRankingLoading(true);
      const { data, error } = await supabase
        .from("ranking_view")
        .select(
          "id, member_name, score_value, score_raw, level, wod_id, wod_date, remark, wod_title, rank"
        )
        .eq("wod_date", today)
        .not("score_value", "is", null);
      if (!error && data) {
        setRecords(data.map((r: any) => ({ ...r, rank: r.rank ?? 0 })));
      } else {
        setRecords([]);
      }
      setIsRankingLoading(false);
    };
    fetchRecords();
  }, [today]);

  if (!mounted || !selectedDate || !today) return null;

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-green-600 mb-6">👑 CFQ WOD 👑</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <Calendar
            onChange={(value) =>
              value instanceof Date && setSelectedDate(value)
            }
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
              <p className="text-gray-500">오늘의 WOD를 불러오는 중...</p>
            </div>
          ) : wod ? (
            <WodCard
              date={wod.date}
              title={wod.title}
              type={wod.type}
              description={wod.description}
              level={wod.level}
            />
          ) : (
            <div className="bg-white shadow-md rounded-lg p-6">
              <p className="text-gray-500">오늘의 WOD가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-[#3b2ff5]">
          🏆 오늘의 랭킹
        </h2>
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
              {[...new Set(records.map((r) => r.level))]
                .filter((level) => level)
                .map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
            </select>
          </div>
        </div>
        {isRankingLoading ? (
          <p className="text-gray-500 text-center">로딩 중...</p>
        ) : records.length === 0 ? (
          <p className="text-gray-400 text-center">오늘의 기록이 없습니다.</p>
        ) : (
          <RankingTable
            records={records}
            selectedLevel={selectedLevel}
            levelPriority={LEVEL_PRIORITY}
          />
        )}
      </div>
    </main>
  );
}
