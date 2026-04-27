"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [index, setIndex] = useState(0);

  const outfits = [
    {
      tops: "白Tシャツ",
      bottoms: "デニム",
      shoes: "スニーカー",
      comment: "朝晩は少し冷えるので軽いジャケットがおすすめです",
    },
    {
      tops: "薄手ニット",
      bottoms: "スカート",
      shoes: "ローファー",
      comment: "少し肌寒いのでニットスタイルがぴったりです",
    },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100">
      <div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl flex flex-col overflow-hidden">

        {/* ヘッダー */}
        <div className="h-[56px] flex items-center justify-center border-b border-gray-200 text-base font-semibold text-gray-700">
          ☀️ 今日のコーデ
        </div>

        {/* メイン */}
        <div className="flex-1 p-4">
          <div className="bg-sky-100 rounded-2xl p-4 text-center mb-4">
            <p className="text-2xl font-bold">22℃</p>
            <p className="text-sm text-gray-600">晴れ</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-4">
            <p className="text-sm font-semibold mb-2">コーデ {index + 1}</p>

            <ul className="text-sm text-gray-700 space-y-1">
              <li>👕 {outfits[index].tops}</li>
              <li>👖 {outfits[index].bottoms}</li>
              <li>👟 {outfits[index].shoes}</li>
            </ul>

            <div className="mt-3 bg-pink-50 rounded-xl p-2 text-xs text-pink-600">
              {outfits[index].comment}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIndex((index + 1) % outfits.length)}
              className="flex-1 bg-gradient-to-r from-sky-400 to-sky-500 text-white py-2 rounded-xl text-sm hover:scale-105 active:scale-90 transition"
            >
              別のコーデ
            </button>

            <button className="flex-1 bg-gray-100 py-2 rounded-xl text-sm hover:bg-gray-200 active:scale-90 transition">
              詳細
            </button>
          </div>
        </div>

        <BottomNav pathname={pathname} router={router} />
      </div>
    </main>
  );
}

/* ===== 共通ナビ ===== */
function BottomNav({ pathname, router }: any) {
  return (
    <div className="h-[64px] border-t border-gray-200 flex justify-around items-center">
      <NavBtn icon="🏠" label="ホーム" path="/" {...{ pathname, router }} />
      <NavBtn icon="👕" label="クローゼット" path="/closet" {...{ pathname, router }} />
      <NavBtn icon="💬" label="チャット" path="/chat" {...{ pathname, router }} />
    </div>
  );
}

function NavBtn({ icon, label, path, pathname, router }: any) {
  const active = pathname === path;

  return (
    <button
      onClick={() => router.push(path)}
      className={`flex flex-col items-center text-xs px-3 py-2 rounded-xl transition ${
        active ? "bg-sky-100 text-sky-600" : "text-gray-400"
      } hover:bg-gray-100 active:scale-90`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}