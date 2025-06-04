"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import WodCard from "@/components/WodCard";

type WodFormData = {
  id?: string;
  date: string;
  title: string;
  type: ("cardio" | "gymnastics" | "strength")[];
  description: string;
  level: string;
};

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const [formData, setFormData] = useState<WodFormData>({
    date: "",
    title: "",
    type: [],
    description: "",
    level: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [wodMap, setWodMap] = useState<Record<string, WodFormData>>({});
  const [editMode, setEditMode] = useState(false);

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
          .select("id")
          .eq("id", session.user.id)
          .single();

        if (error || !roleData) {
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

  useEffect(() => {
    setMounted(true);
    setSelectedDate(new Date());
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      id: prev.id,
    }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      type: checked
        ? [...prev.type, value as "cardio" | "gymnastics" | "strength"]
        : prev.type.filter((t) => t !== value),
      id: prev.id,
    }));
  };

  // 날짜 YYYY-MM-DD 포맷
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // WOD 배열을 날짜별 최신 WOD map으로 변환
  function mapWodsByDate(data: any[]): Record<string, WodFormData> {
    const map: Record<string, WodFormData> = {};
    data
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .forEach((w: any) => {
        let typeArr = Array.isArray(w.type)
          ? w.type
          : typeof w.type === "string"
          ? w.type.startsWith("[")
            ? JSON.parse(w.type)
            : w.type.split(",").map((t: string) => t.trim())
          : [];
        if (!map[w.date]) {
          map[w.date] = {
            id: w.id,
            date: w.date,
            title: w.title,
            type: typeArr,
            description: w.description,
            level: w.level,
          };
        }
      });
    return map;
  }

  // 빈 폼 데이터 생성
  function getEmptyFormData(date: string): WodFormData {
    return {
      id: undefined,
      date,
      title: "",
      type: [],
      description: "",
      level: "",
    };
  }

  // 날짜별로 폼 데이터 세팅
  function setFormDataForDate(
    date: string,
    map: Record<string, WodFormData>,
    setFormData: any,
    setEditMode: any
  ) {
    if (map[date]) {
      setFormData({ ...map[date] });
      setEditMode(true);
    } else {
      setFormData(getEmptyFormData(date));
      setEditMode(false);
    }
  }

  // 달력에서 날짜 클릭 시
  const handleDateChange = (value: any) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  // WOD 전체 불러오기 (달력 타일 표시용)
  const fetchWods = async (dateKey: string) => {
    const { data, error } = await supabase
      .from("wods")
      .select("id, date, title, type, description, level, created_at");
    if (!error && data) {
      const map = mapWodsByDate(data);
      setWodMap(map);
      setFormDataForDate(dateKey, map, setFormData, setEditMode);
    }
  };

  // WOD 전체 fetch (최초/날짜 변경 시)
  useEffect(() => {
    if (!isAdmin || !selectedDate) return;
    const key = formatDate(selectedDate);
    fetchWods(key);
    // eslint-disable-next-line
  }, [isAdmin, selectedDate]);

  // 날짜 변경 시 폼 자동 채우기 (wodMap이 갱신될 때)
  useEffect(() => {
    if (!selectedDate) return;
    const key = formatDate(selectedDate);
    setFormDataForDate(key, wodMap, setFormData, setEditMode);
    // eslint-disable-next-line
  }, [selectedDate, wodMap]);

  // 달력 타일에 WOD 등록 여부 표시
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const key = formatDate(date);
      if (wodMap[key]) {
        return (
          <div className="flex justify-center">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mt-1" />
          </div>
        );
      }
    }
    return null;
  };

  // 저장 (수정/신규 입력 분기)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (formData.type.length === 0) {
        throw new Error("최소 하나 이상의 타입을 선택해주세요.");
      }
      if (editMode && formData.id) {
        // update by id
        const { error } = await supabase
          .from("wods")
          .update({
            title: formData.title,
            type: formData.type,
            description: formData.description,
            level: formData.level,
          })
          .eq("id", formData.id);
        if (error) throw error;
        alert("WOD가 성공적으로 수정되었습니다!");
      } else {
        // insert
        const { error } = await supabase.from("wods").insert([
          {
            date: formData.date,
            title: formData.title,
            type: formData.type,
            description: formData.description,
            level: formData.level,
          },
        ]);
        if (error) throw error;
        alert("WOD가 성공적으로 저장되었습니다!");
      }
      // 저장 후 WOD 목록 갱신
      fetchWods(formData.date);
    } catch (error: any) {
      console.error("Error saving WOD:", error);
      alert("WOD 저장/수정 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking || !mounted || !selectedDate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">로딩 중...</h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }
  if (!isAdmin) return null;

  const key = formatDate(selectedDate);
  const selectedWod = wodMap[key];

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">관리자 페이지</h1>
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
            tileContent={tileContent}
          />
          {/* WOD 미리보기 */}
          {selectedWod && (
            <div className="mt-4">
              <WodCard
                date={selectedWod.date}
                title={selectedWod.title}
                type={selectedWod.type}
                description={selectedWod.description}
                level={selectedWod.level}
              />
            </div>
          )}
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            WOD {editMode ? "수정" : "입력"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                날짜
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="WOD 제목을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                타입
              </label>
              <div className="flex gap-2">
                {(["cardio", "gymnastics", "strength"] as const).map((t) => (
                  <label key={t} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      value={t}
                      checked={formData.type.includes(t)}
                      onChange={handleTypeChange}
                    />
                    <span className="ml-2">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="WOD 설명을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                난이도
              </label>
              <textarea
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="난이도 정보를 입력하세요"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "저장 중..." : editMode ? "수정하기" : "저장하기"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
