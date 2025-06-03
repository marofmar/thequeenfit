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
        .select("id, member_name, score_value, level, wod_id, wod_date")
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

  // WOD별로 그룹화
  const wodGroups = Array.from(
    records.reduce((acc, rec) => {
      if (!acc.has(rec.wod_id)) acc.set(rec.wod_id, []);
      acc.get(rec.wod_id)!.push(rec);
      return acc;
    }, new Map<string, RecordRow[]>())
  );

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
      {isLoading ? (
        <p className="text-gray-500 text-center">로딩 중...</p>
      ) : wodGroups.length === 0 ? (
        <p className="text-gray-400 text-center">이 날짜의 기록이 없습니다.</p>
      ) : (
        <div className="space-y-12">
          {wodGroups.map(([wod_id, recs]) => {
            // 해당 WOD에서 실제로 존재하는 level만 추출 (우선순위대로)
            const levels = LEVEL_PRIORITY.filter((level) =>
              recs.some((r) => r.level === level)
            );
            return (
              <div key={wod_id} className="max-w-2xl mx-auto w-full">
                <h2 className="text-2xl font-semibold mb-4 text-[#3b2ff5] flex items-center gap-2">
                  <span className="inline-block w-2 h-6 bg-gradient-to-b from-[#a18fff] to-[#3b2ff5] rounded-full mr-2" />
                  {getWodTitle(wod_id)}
                </h2>
                {levels.map((level) => {
                  const group = recs
                    .filter((r) => r.level === level)
                    .sort((a, b) => b.score_value - a.score_value);
                  return (
                    <div key={level} className="mb-8">
                      <h3 className="text-lg font-bold mb-2 text-[#6c63ff]">
                        {level} 랭킹
                      </h3>
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
                              <th className="px-6 py-3 text-right text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff] rounded-tr-2xl">
                                점수
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.map((r, idx) => (
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
                                <td className="px-6 py-3 text-right rounded-r-2xl">
                                  {r.score_value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
