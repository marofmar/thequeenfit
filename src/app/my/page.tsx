"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const NRM_TYPES = ["1RM", "3RM", "5RM"] as const;
const LIFTS = [
  "Deadlift",
  "Back Squat",
  "Front Squat",
  "Overhead Squat",
  "Shorder Press",
  "Clean and Jerk",
  "Clean",
  "Snatch",
  "Push Press",
  "Push Jerk",
];

type NrmRecord = {
  [lift: string]: number | "";
};

type NrmData = {
  [nrmType: string]: {
    values: NrmRecord;
    updatedAt: string | null;
  };
};

export default function MyPage() {
  // 달력 관련
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  // nRM 관련
  const [activeTab, setActiveTab] = useState<(typeof NRM_TYPES)[number]>("1RM");
  const [nrmData, setNrmData] = useState<NrmData>(() => {
    const initial: NrmData = {};
    NRM_TYPES.forEach((type) => {
      initial[type] = {
        values: Object.fromEntries(LIFTS.map((l) => [l, ""])) as NrmRecord,
        updatedAt: null,
      };
    });
    return initial;
  });

  useEffect(() => {
    setMounted(true);
    setSelectedDate(new Date());
    // TODO: fetch 내 WOD, nRM 기록 불러오기(supabase)
  }, []);

  // nRM 입력 핸들러
  const handleNrmChange = (lift: string, value: string) => {
    setNrmData((prev) => ({
      ...prev,
      [activeTab]: {
        values: {
          ...prev[activeTab].values,
          [lift]: value === "" ? "" : Number(value),
        },
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  if (!mounted || !selectedDate) return null;

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-[#3b2ff5]">마이페이지</h1>
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-2">내가 참여한 WOD</h2>
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
        {/* TODO: 달력 타일에 참여한 WOD 표시, 날짜 클릭 시 상세 표시 */}
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">nRM 기록</h2>
        <div className="flex gap-2 mb-4">
          {NRM_TYPES.map((type) => (
            <button
              key={type}
              className={`px-4 py-2 rounded-t-lg font-bold border-b-2 transition-colors ${
                activeTab === type
                  ? "bg-blue-100 border-blue-500 text-blue-700"
                  : "bg-gray-100 border-transparent text-gray-500"
              }`}
              onClick={() => setActiveTab(type)}
            >
              {type}
            </button>
          ))}
        </div>
        <form className="bg-white shadow-md rounded-b-lg p-6 grid grid-cols-1 gap-4">
          {LIFTS.map((lift) => (
            <div key={lift} className="flex items-center gap-4">
              <label className="w-40 font-medium text-gray-700">{lift}</label>
              <input
                type="number"
                min={0}
                step={1}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md text-right"
                value={nrmData[activeTab].values[lift]}
                onChange={(e) => handleNrmChange(lift, e.target.value)}
                placeholder="???"
              />
              <span className="text-gray-400">lb</span>
            </div>
          ))}
          <div className="text-right text-xs text-gray-500 mt-2">
            최근 업데이트:{" "}
            {nrmData[activeTab].updatedAt
              ? new Date(nrmData[activeTab].updatedAt).toLocaleString()
              : "-"}
          </div>
        </form>
        {/* TODO: 저장 버튼, supabase 연동 */}
      </section>
    </main>
  );
}
