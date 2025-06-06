"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import WodCard from "@/components/WodCard";
import { supabase } from "@/lib/supabase";
import RankingTable from "@/components/RankingTable";

type WodData = {
  date: string;
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
  wod_title: string;
  rank: number;
};

export default function WodsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [wods, setWods] = useState<WodMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [isRankingLoading, setIsRankingLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("전체");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editWod, setEditWod] = useState<WodData | null>(null);

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

  if (!mounted || !selectedDate) {
    return null;
  }

  const dateString = formatDate(selectedDate);
  const selectedWod = wods[dateString];

  // 랭킹용: YYYY-MM-DD 포맷 필요
  const rankingDateString = (() => {
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
        .from("ranking_view")
        .select(
          "id, member_name, score_value, score_raw, level, wod_id, wod_date, remark, wod_title, rank"
        )
        .eq("wod_date", rankingDateString)
        .not("score_value", "is", null);
      if (!error && data) {
        setRecords(data.map((r: any) => ({ ...r, rank: r.rank ?? 0 })));
      }
      setIsRankingLoading(false);
    };
    fetchRecords();
  }, [rankingDateString]);

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setIsAdmin(false);
          return;
        }
        const { data: roleData, error } = await supabase
          .from("roles")
          .select("id")
          .eq("id", session.user.id)
          .single();
        setIsAdmin(!!roleData && !error);
      } catch (e) {
        setIsAdmin(false);
      }
    };
    checkAdminRole();
  }, []);

  useEffect(() => {
    setSelectedDate(new Date());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchWods();
    }
    // eslint-disable-next-line
  }, [selectedDate]);

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
          date: formattedDate,
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

  // WOD id -> title 매핑 함수
  const getWodTitle = (wod_id: string) => wods[wod_id]?.title || wod_id;

  // WOD 수정 모달 열기
  const handleEditClick = () => {
    if (selectedWod) {
      // date가 비어 있으면 현재 선택된 날짜(rankingDateString)로 세팅
      setEditWod({
        ...selectedWod,
        date: selectedWod.date || rankingDateString,
      });
      setShowEditModal(true);
    }
  };

  // WOD 수정 폼 제출 (예시: 콘솔 출력, 실제 저장 로직은 추가 구현 필요)
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제 저장 로직 구현 필요
    alert("WOD 수정 기능은 아직 구현되지 않았습니다.");
    setShowEditModal(false);
  };

  // type 체크박스 핸들러
  const handleEditTypeChange = (value: string, checked: boolean) => {
    if (!editWod) return;
    setEditWod({
      ...editWod,
      type: checked
        ? [...editWod.type, value as "cardio" | "gymnastics" | "strength"]
        : editWod.type.filter((t) => t !== value),
    });
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
            <>
              <WodCard
                date={dateString}
                title={selectedWod.title}
                type={selectedWod.type}
                description={selectedWod.description}
                level={selectedWod.level}
              />
              {/* WOD 수정 모달 */}
              {showEditModal && editWod && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
                    <button
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                      onClick={() => setShowEditModal(false)}
                      aria-label="닫기"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    <h2 className="text-xl font-bold mb-4">WOD 수정</h2>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          날짜
                        </label>
                        <input
                          type="date"
                          className="w-full border rounded px-3 py-2 text-base"
                          value={(() => {
                            // editWod.date: YYMMDD 또는 YYYY-MM-DD 등 다양한 포맷 대응
                            if (!editWod.date) return "";
                            if (
                              editWod.date.length === 8 &&
                              !editWod.date.includes("-")
                            ) {
                              // YYMMDD → YYYY-MM-DD
                              const y = "20" + editWod.date.slice(0, 2);
                              const m = editWod.date.slice(2, 4);
                              const d = editWod.date.slice(4, 6);
                              return `${y}-${m}-${d}`;
                            }
                            if (
                              editWod.date.length === 10 &&
                              editWod.date.includes("-")
                            ) {
                              return editWod.date;
                            }
                            return editWod.date;
                          })()}
                          onChange={(e) =>
                            setEditWod({ ...editWod, date: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          제목
                        </label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 text-xl font-bold mb-1"
                          value={editWod.title}
                          onChange={(e) =>
                            setEditWod({ ...editWod, title: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          타입
                        </label>
                        <div className="flex gap-2">
                          {(["cardio", "gymnastics", "strength"] as const).map(
                            (t) => (
                              <label
                                key={t}
                                className="inline-flex items-center gap-1"
                              >
                                <input
                                  type="checkbox"
                                  className="form-checkbox accent-[#3b2ff5]"
                                  value={t}
                                  checked={editWod.type.includes(t)}
                                  onChange={(e) =>
                                    handleEditTypeChange(t, e.target.checked)
                                  }
                                />
                                <span
                                  className={`px-2 py-1 rounded-full text-xs text-white ${
                                    t === "cardio"
                                      ? "bg-blue-500"
                                      : t === "gymnastics"
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                >
                                  {t}
                                </span>
                              </label>
                            )
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          설명
                        </label>
                        <textarea
                          className="w-full border rounded px-3 py-2 text-base mb-1 min-h-[80px]"
                          value={editWod.description}
                          onChange={(e) =>
                            setEditWod({
                              ...editWod,
                              description: e.target.value,
                            })
                          }
                          rows={4}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          난이도
                        </label>
                        <textarea
                          className="w-full border rounded px-3 py-2 text-base mb-1 min-h-[40px] whitespace-pre-line"
                          value={editWod.level}
                          onChange={(e) =>
                            setEditWod({ ...editWod, level: e.target.value })
                          }
                          rows={2}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-lg font-semibold"
                      >
                        저장
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
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
              {/* level 목록은 records에서 추출해서 표시 */}
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
          <p className="text-gray-400 text-center">
            이 날짜의 기록이 없습니다.
          </p>
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
