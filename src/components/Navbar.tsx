"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 초기 로그인 상태 확인
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      // admin 권한 확인
      if (session) {
        console.log("Current user ID:", session.user.id);
        const { data: roleData, error } = await supabase
          .from("roles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        console.log("Role data:", roleData, "Error:", error);
        const isAdminUser = !error && roleData?.role === "admin";
        console.log("Is admin:", isAdminUser);
        setIsAdmin(isAdminUser);
      }
    };

    checkUser();

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoggedIn(!!session);

      // 로그인/로그아웃 시 admin 권한 재확인
      if (session) {
        console.log("Auth state changed - User ID:", session.user.id);
        const { data: roleData, error } = await supabase
          .from("roles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        console.log("Role data:", roleData, "Error:", error);
        const isAdminUser = !error && roleData?.role === "admin";
        console.log("Is admin:", isAdminUser);
        setIsAdmin(isAdminUser);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return; // 중복 클릭 방지

    console.log("Logout button clicked");
    setIsLoggingOut(true);

    try {
      console.log("Attempting to sign out from Supabase...");

      // 타임아웃 설정 (5초)
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Logout timeout")), 5000)
      );

      const { error } = (await Promise.race([
        signOutPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.error("Supabase sign out error:", error);
        throw error;
      }

      console.log("Successfully signed out from Supabase");

      // 강제로 로컬 상태 초기화
      setIsLoggedIn(false);
      setIsAdmin(false);

      console.log("Redirecting to home page...");
      window.location.href = "/"; // router.push 대신 강제 리로드
    } catch (error: any) {
      console.error("Error logging out:", error);

      // 에러가 발생해도 강제로 로그아웃 처리
      if (error.message === "Logout timeout") {
        console.log("Timeout occurred, forcing logout...");
        setIsLoggedIn(false);
        setIsAdmin(false);
        window.location.href = "/";
      } else {
        alert("로그아웃 중 오류가 발생했습니다: " + error.message);
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-gray-100 shadow-md px-8 py-4">
      <nav className="flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold text-green-600">
          👑 CFQ WOD 👑
        </Link>
        <div className="space-x-12">
          {isAdmin && (
            <>
              <Link
                href="/admin"
                className="text-gray-700 hover:text-green-600"
              >
                WOD입력
              </Link>
              <Link
                href="/records"
                className="text-gray-700 hover:text-green-600"
              >
                회원기록입력
              </Link>
            </>
          )}
          <Link href="/my" className="text-gray-700 hover:text-green-600">
            마이페이지
          </Link>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`text-gray-700 hover:text-green-600 ${
                isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
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
