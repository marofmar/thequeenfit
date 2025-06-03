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
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">🏆 날짜별 랭킹</h1>
      <div className="mb-8">
        <Calendar
          onChange={(value) => value instanceof Date && setSelectedDate(value)}
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
      {isLoading ? (
        <p className="text-gray-600">로딩 중...</p>
      ) : wodGroups.length === 0 ? (
        <p className="text-gray-600">이 날짜의 기록이 없습니다.</p>
      ) : (
        wodGroups.map(([wod_id, recs]) => {
          // 해당 WOD에서 실제로 존재하는 level만 추출 (우선순위대로)
          const levels = LEVEL_PRIORITY.filter((level) =>
            recs.some((r) => r.level === level)
          );
          return (
            <div key={wod_id} className="mb-12">
              <h2 className="text-xl font-semibold mb-2">
                {getWodTitle(wod_id)}
              </h2>
              {levels.map((level) => {
                const group = recs
                  .filter((r) => r.level === level)
                  .sort((a, b) => b.score_value - a.score_value);
                return (
                  <div key={level} className="mb-6">
                    <h3 className="text-lg font-bold mb-1">{level} 랭킹</h3>
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 border-b">순위</th>
                          <th className="px-4 py-2 border-b">이름</th>
                          <th className="px-4 py-2 border-b">점수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((r, idx) => (
                          <tr
                            key={r.id}
                            className={idx === 0 ? "bg-yellow-100" : ""}
                          >
                            <td className="px-4 py-2 border-b text-center">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-2 border-b">
                              {r.member_name}
                            </td>
                            <td className="px-4 py-2 border-b text-right">
                              {r.score_value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </main>
  );
}
