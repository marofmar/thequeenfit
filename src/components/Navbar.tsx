"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 초기 로그인 상태 확인
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkUser();

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch (error: any) {
      console.error("Error logging out:", error);
      alert("로그아웃 중 오류가 발생했습니다: " + error.message);
    }
  };

  return (
    <header className="bg-gray-100 shadow-md px-8 py-4">
      <nav className="flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold text-green-600">
          👑 CFQ WOD 👑
        </Link>
        <div className="space-x-12">
          <Link href="/admin" className="text-gray-700 hover:text-green-600">
            WOD입력
          </Link>
          <Link href="/records" className="text-gray-700 hover:text-green-600">
            회원기록입력
          </Link>
          <Link href="/my" className="text-gray-700 hover:text-green-600">
            마이페이지
          </Link>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-green-600"
            >
              로그아웃
            </button>
          ) : (
            <Link href="/login" className="text-gray-700 hover:text-green-600">
              로그인
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
