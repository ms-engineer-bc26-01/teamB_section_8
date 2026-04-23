"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  // コーデ切り替え用インデックス
  const [index, setIndex] = useState(0);

  // ダミーデータ（後でAPIに置き換え）
  const outfits = [
    {
      tops: "白Tシャツ",
      bottoms: "デニム",
      shoes: "スニーカー",
      comment: "朝晩は少し冷えるので軽いジャケットがおすすめです"
    },
    {
      tops: "薄手ニット",
      bottoms: "スカート",
      shoes: "ローファー",
      comment: "少し肌寒いのでニットスタイルがぴったりです"
    }
  ];

  const data = {
    temp: 22,
    weather: "晴れ"
  };

  // ログイン状態チェック（未ログインならログイン画面へ遷移）
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("login");

    if (!isLoggedIn) {
      router.push("/login");
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100">
      
      {/* スマホ風コンテナ */}
      <div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl p-4 flex flex-col justify-between">
        
        {/* 上部エリア */}
        <div>

          {/* 天気カード */}
          <div className="bg-sky-100 rounded-2xl p-4 text-center mb-4">
            <h1 className="text-2xl font-bold">
              ☀️ {data.temp}℃
            </h1>
            <p className="text-sm text-gray-600">{data.weather}</p>
          </div>

          {/* コーデカード */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 mb-5">
            <h2 className="font-bold text-lg mb-2">
              おすすめコーデ {index + 1}
            </h2>

            {/* アイテム一覧 */}
            <ul className="text-gray-700 space-y-1">
              <li>👕 {outfits[index].tops}</li>
              <li>👖 {outfits[index].bottoms}</li>
              <li>👟 {outfits[index].shoes}</li>
            </ul>

            {/* AIコメント */}
            <div className="mt-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl p-3 text-sm">
              <p className="text-pink-600 font-semibold mb-1">
                AIコメント
              </p>
              <p>{outfits[index].comment}</p>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setIndex((index + 1) % outfits.length)}
              className="flex-1 bg-gradient-to-r from-sky-400 to-sky-500 text-white py-2 rounded-xl shadow-md active:scale-95 transition"
            >
              別のコーデ
            </button>

            <button className="flex-1 bg-gray-100 py-2 rounded-xl active:scale-95 transition">
              詳細
            </button>
          </div>

        </div>

        {/* 下部ナビゲーション（ボタン風UI + 現在ページのハイライト） */}
        <div className="border-t pt-3 flex justify-around">

          {/* ホーム */}
          <button
            onClick={() => router.push("/")}
            className={`
              flex flex-col items-center justify-center
              px-4 py-2 rounded-xl shadow-sm
              active:scale-95 transition
              ${pathname === "/" 
                ? "bg-sky-100 text-sky-600" 
                : "bg-gray-100 text-gray-600"}
            `}
          >
            <span className="text-lg">🏠</span>
            <span className="text-xs">ホーム</span>
          </button>

          {/* クローゼット */}
          <button
            onClick={() => router.push("/closet")}
            className={`
              flex flex-col items-center justify-center
              px-4 py-2 rounded-xl shadow-sm
              active:scale-95 transition
              ${pathname === "/closet" 
                ? "bg-sky-100 text-sky-600" 
                : "bg-gray-100 text-gray-600"}
            `}
          >
            <span className="text-lg">👕</span>
            <span className="text-xs">クローゼット</span>
          </button>

          {/* チャット */}
          <button
            onClick={() => router.push("/chat")}
            className={`
              flex flex-col items-center justify-center
              px-4 py-2 rounded-xl shadow-sm
              active:scale-95 transition
              ${pathname === "/chat" 
                ? "bg-sky-100 text-sky-600" 
                : "bg-gray-100 text-gray-600"}
            `}
          >
            <span className="text-lg">💬</span>
            <span className="text-xs">チャット</span>
          </button>

        </div>

      </div>
    </main>
  );
}