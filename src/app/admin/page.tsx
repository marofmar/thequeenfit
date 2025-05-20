"use client";

import { useState } from "react";

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">관리자 페이지</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">WOD 관리</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              날짜
            </label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제목
            </label>
            <input
              type="text"
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
                />
                <span className="ml-2">Cardio</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  value="gymnastics"
                />
                <span className="ml-2">Gymnastics</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  value="strength"
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
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="난이도 정보를 입력하세요"
            />
          </div>

          <button
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </main>
  );
}
