"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// 服データ型定義
type Cloth = {
  id: number;
  name: string;
  category: string;
  image?: string; // Base64画像
};

export default function ClosetPage() {
  const router = useRouter();
  const pathname = usePathname();

  // 服一覧状態
  const [clothes, setClothes] = useState<Cloth[]>([]);

  // 初期ロード：localStorageから取得
  useEffect(() => {
    const stored = localStorage.getItem("clothes");
    if (stored) {
      setClothes(JSON.parse(stored));
    }
  }, []);

  // 削除処理
  const handleDelete = (id: number) => {
    if (!confirm("削除してもよろしいですか？")) return;

    const updated = clothes.filter((item) => item.id !== id);
    setClothes(updated);
    localStorage.setItem("clothes", JSON.stringify(updated));
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100">
      
      {/* スマホ風コンテナ */}
      <div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl p-4 flex flex-col justify-between">

        {/* 上部 */}
        <div>

          {/* タイトル */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold">👕 クローゼット</h1>
            <p className="text-sm text-gray-500">
              手持ちの服一覧
            </p>
          </div>

          {/* グリッド */}
          <div className="grid grid-cols-2 gap-3">

            {/* データなし */}
            {clothes.length === 0 && (
              <p className="text-center col-span-2 text-gray-400 text-sm">
                まだ服が登録されていません
              </p>
            )}

            {/* カード */}
            {clothes.map((item) => (
              <div
                key={item.id}
                className="
                  relative bg-white rounded-2xl shadow-md p-3 border border-gray-100
                  transition-all duration-200 ease-out
                  hover:shadow-lg hover:-translate-y-1
                "
              >

                {/* 削除ボタン */}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="
                    absolute top-2 right-2
                    w-6 h-6 rounded-full
                    flex items-center justify-center
                    text-xs
                    bg-gray-200 text-gray-600
                    transition-all duration-200 ease-out
                    hover:bg-red-400 hover:text-white hover:scale-110
                    active:scale-90
                  "
                >
                  ✕
                </button>

                {/* 画像 */}
                <div className="w-full h-20 flex items-center justify-center mb-2 bg-gray-50 rounded-xl shadow-inner overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt="服"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-3xl">👕</span>
                  )}
                </div>

                {/* 名前 */}
                <p className="text-sm font-semibold text-center">
                  {item.name}
                </p>

                {/* カテゴリ */}
                <div className="mt-2 text-center">
                  <span className="text-xs bg-sky-100 text-sky-600 px-2 py-1 rounded-full">
                    {item.category}
                  </span>
                </div>

              </div>
            ))}

          </div>

        </div>

        {/* 下部 */}
        <div>

          {/* ＋ボタン */}
          <div className="flex justify-center mb-3">
            <button
              onClick={() => router.push("/closet/add")}
              className="
                bg-gradient-to-r from-pink-400 to-pink-500 text-white
                w-12 h-12 rounded-full shadow-lg text-xl
                flex items-center justify-center
                transition-all duration-200 ease-out
                hover:scale-110 hover:shadow-xl
                active:scale-90
              "
            >
              ＋
            </button>
          </div>

          {/* ナビゲーション */}
          <div className="border-t pt-3 flex justify-around">

            {/* ホーム */}
            <button
              onClick={() => router.push("/")}
              className={`
                flex flex-col items-center px-4 py-2 rounded-xl
                transition-all duration-200 ease-out
                active:scale-90 hover:bg-gray-200
                ${pathname === "/" 
                  ? "bg-sky-100 text-sky-600" 
                  : "bg-gray-100 text-gray-600"}
              `}
            >
              🏠
              <span className="text-xs">ホーム</span>
            </button>

            {/* クローゼット */}
            <button
              onClick={() => router.push("/closet")}
              className={`
                flex flex-col items-center px-4 py-2 rounded-xl
                transition-all duration-200 ease-out
                active:scale-90 hover:bg-gray-200
                ${pathname === "/closet" 
                  ? "bg-sky-100 text-sky-600" 
                  : "bg-gray-100 text-gray-600"}
              `}
            >
              👕
              <span className="text-xs">クローゼット</span>
            </button>

            {/* チャット */}
            <button
              onClick={() => router.push("/chat")}
              className={`
                flex flex-col items-center px-4 py-2 rounded-xl
                transition-all duration-200 ease-out
                active:scale-90 hover:bg-gray-200
                ${pathname === "/chat" 
                  ? "bg-sky-100 text-sky-600" 
                  : "bg-gray-100 text-gray-600"}
              `}
            >
              💬
              <span className="text-xs">チャット</span>
            </button>

          </div>

        </div>

      </div>
    </main>
  );
}