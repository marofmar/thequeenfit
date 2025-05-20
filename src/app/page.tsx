import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-green-600">👑 CFQ WOD 👑</h1>
      <p className="mt-2 text-gray-700">오늘의 WOD와 랭킹 정보를 확인하세요.</p>
      <div className="mt-6 space-x-4">
        <Link href="/wods" className="text-pink-400 font-bold hover:underline">
          📆 오늘의 WOD
        </Link>
        <Link
          href="/rankings"
          className="text-pink-400 font-bold hover:underline"
        >
          🏋️‍♀️ 랭킹
        </Link>
        <Link href="/admin" className="text-pink-400 font-bold hover:underline">
          🔑 관리자 페이지
        </Link>
      </div>
    </main>
  );
}
