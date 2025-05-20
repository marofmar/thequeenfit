"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type WodFormData = {
  date: string;
  title: string;
  type: string[];
  description: string;
  level: string;
};

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<WodFormData>({
    date: "",
    title: "",
    type: [],
    description: "",
    level: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      type: checked
        ? [...prev.type, value]
        : prev.type.filter((t) => t !== value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 날짜 형식을 YYMMDD로 변환
      const dateObj = new Date(formData.date);
      const year = dateObj.getFullYear().toString().slice(-2);
      const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
      const day = dateObj.getDate().toString().padStart(2, "0");
      const formattedDate = `${year}${month}${day}`;

      const { error } = await supabase.from("wods").insert([
        {
          date: formattedDate,
          title: formData.title,
          type: formData.type,
          description: formData.description,
          level: formData.level,
        },
      ]);

      if (error) throw error;

      // 성공 시 폼 초기화
      setFormData({
        date: "",
        title: "",
        type: [],
        description: "",
        level: "",
      });

      alert("WOD가 성공적으로 저장되었습니다!");
    } catch (error: any) {
      console.error("Error saving WOD:", error);
      alert("WOD 저장 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">관리자 페이지</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">WOD 관리</h2>

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
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  value="cardio"
                  checked={formData.type.includes("cardio")}
                  onChange={handleTypeChange}
                />
                <span className="ml-2">Cardio</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  value="gymnastics"
                  checked={formData.type.includes("gymnastics")}
                  onChange={handleTypeChange}
                />
                <span className="ml-2">Gymnastics</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  value="strength"
                  checked={formData.type.includes("strength")}
                  onChange={handleTypeChange}
                />
                <span className="ml-2">Strength</span>
              </label>
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
            {isLoading ? "저장 중..." : "저장하기"}
          </button>
        </form>
      </div>
    </main>
  );
}
