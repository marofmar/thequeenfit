"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Record = {
  wod_date: string;
  member_name: string;
  score_raw: string;
  level: string;
  remark: string;
};

export default function RecordsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [memberName, setMemberName] = useState("");
  const [scoreRaw, setScoreRaw] = useState("");
  const [level, setLevel] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lastLevel") || "Rxd";
    }
    return "Rxd";
  });
  const [remark, setRemark] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  // 관리자 권한 체크
  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/");
          return;
        }

        const { data: roleData, error } = await supabase
          .from("roles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error || roleData?.role !== "admin") {
          router.push("/");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Error checking admin role:", error);
        router.push("/");
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminRole();
  }, [router]);

  // 권한 체크가 완료되고 관리자가 아닌 경우에만 경고 메시지 표시
  useEffect(() => {
    if (!isChecking && !isAdmin) {
      alert("접근할 수 없는 페이지입니다");
    }
  }, [isChecking, isAdmin]);

  // 날짜를 YYMMDD 형식으로 변환하는 함수
  const formatDate = (date: Date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}${month}${day}`;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDateChange = (value: any) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = e.target.value;
    setLevel(newLevel);
    localStorage.setItem("lastLevel", newLevel);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from("records").insert({
        wod_date: formatDate(selectedDate),
        member_name: memberName,
        score_raw: scoreRaw,
        level: level,
        remark: remark,
      });

      if (error) throw error;

      // 입력 필드 초기화
      setMemberName("");
      setScoreRaw("");
      setLevel(localStorage.getItem("lastLevel") || "Rxd");
      setRemark("");
      alert("기록이 저장되었습니다!");
    } catch (error: any) {
      console.error("Error saving record:", error);
      alert("기록 저장 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  // 권한 체크 중이거나 관리자가 아닌 경우 로딩 표시
  if (isChecking || !isAdmin) {
    return (
      <main className="p-8">
        <div className="text-center">
          <p className="text-gray-500">권한을 확인하는 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">📝 운동 기록</h1>

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

        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                날짜
              </label>
              <input
                type="text"
                value={formatDate(selectedDate)}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                회원 이름
              </label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="회원 이름을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기록
              </label>
              <input
                type="text"
                value={scoreRaw}
                onChange={(e) => setScoreRaw(e.target.value)}
                placeholder="운동 기록을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                난이도
              </label>
              <select
                value={level}
                onChange={handleLevelChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="Rxd">Rxd</option>
                <option value="Scaled">Scaled</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메모
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="회원 기록에 대한 메모를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {isLoading ? "저장 중..." : "기록 저장"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
