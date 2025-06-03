"use client";

import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "@/lib/supabase";

const LEVEL_PRIORITY = ["Rxd", "Scaled", "A", "B", "C"];

type RecordRow = {
  id: string;
  member_name: string;
  score_value: number;
  level: string;
  wod_id: string;
  wod_date: string;
  remark?: string;
};

type WodInfo = {
  id: string;
  title: string;
};

export default function RankingsPage() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [wods, setWods] = useState<WodInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLevel, setSelectedLevel] = useState<string>("전체");

  // 날짜를 YYYY-MM-DD로 변환
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const dateString = formatDate(selectedDate);

  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("records")
        .select("id, member_name, score_value, level, wod_id, wod_date, remark")
        .eq("wod_date", dateString)
        .not("score_value", "is", null);
      if (!error && data) {
        setRecords(data);
      }
      setIsLoading(false);
    };
    fetchRecords();
  }, [dateString]);

  useEffect(() => {
    const fetchWods = async () => {
      const { data, error } = await supabase.from("wods").select("id, title");
      if (!error && data) {
        setWods(data);
      }
    };
    fetchWods();
  }, []);

  const getWodTitle = (wod_id: string) =>
    wods.find((w) => w.id === wod_id)?.title || wod_id;

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

  // level > score_value > wod_title > member_name 순 정렬
  const sorted = [...filtered].sort((a, b) => {
    const levelDiff = levelOrder(a.level) - levelOrder(b.level);
    if (levelDiff !== 0) return levelDiff;
    if (b.score_value !== a.score_value) return b.score_value - a.score_value;
    const titleA = getWodTitle(a.wod_id);
    const titleB = getWodTitle(b.wod_id);
    if (titleA !== titleB) return titleA.localeCompare(titleB);
    return a.member_name.localeCompare(b.member_name);
  });

  return (
    <main className="p-4 md:p-8 bg-gradient-to-br from-[#f8fafc] to-[#e9e7fd] min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-[#3b2ff5] tracking-tight">
        🏆 날짜별 랭킹
      </h1>
      <div className="mb-10 flex flex-col items-center">
        <Calendar
          onChange={(value) => value instanceof Date && setSelectedDate(value)}
          value={selectedDate}
          className="rounded-2xl shadow-xl border-0"
          locale="ko-KR"
          formatMonthYear={(locale, date) => {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            return `${year}년 ${month}월`;
          }}
        />
      </div>
      <div className="max-w-4xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div />
        <div className="flex items-center gap-2">
          <label htmlFor="level-select" className="font-medium text-[#3b2ff5]">
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
      {isLoading ? (
        <p className="text-gray-500 text-center">로딩 중...</p>
      ) : sorted.length === 0 ? (
        <p className="text-gray-400 text-center">이 날짜의 기록이 없습니다.</p>
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
                  WOD
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff]">
                  레벨
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff]">
                  메모
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff] rounded-tr-2xl">
                  점수
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
                  <td className="px-6 py-3">{getWodTitle(r.wod_id)}</td>
                  <td className="px-6 py-3">{r.level}</td>
                  <td className="px-6 py-3 text-gray-600 whitespace-pre-line text-sm">
                    {r.remark || ""}
                  </td>
                  <td className="px-6 py-3 text-right rounded-r-2xl">
                    {r.score_value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
