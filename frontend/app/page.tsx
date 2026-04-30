"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";

type AppRouter = ReturnType<typeof useRouter>;

type BottomNavProps = {
  pathname: string;
  router: AppRouter;
};

type NavBtnProps = {
  icon: string;
  label: string;
  path: string;
  pathname: string;
  router: AppRouter;
};

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  // --- 状態管理 (State) ---
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [weather, setWeather] = useState({
    temp: "--",
    condition: "--",
    city: "--",
    zip: "",
  });

  // --- コーデのマスターデータ ---
  const outfitSuggestions = [
    {
      tops: "半袖Tシャツ",
      bottoms: "ショートパンツ",
      shoes: "サンダル",
      comment: "暑い一日になりそうです。通気性の良い服装を選びましょう。",
    },
    {
      tops: "長袖シャツ",
      bottoms: "チノパン",
      shoes: "スニーカー",
      comment: "過ごしやすい気温です。軽い羽織ものがあると安心です。",
    },
    {
      tops: "厚手コート",
      bottoms: "ウールパンツ",
      shoes: "ブーツ",
      comment: "かなり冷え込みます。しっかり防寒対策をして出かけましょう。",
    },
  ];

  // --- APIデータ取得とロジック同期 ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const meRes = await apiClient.get("/users/me");
        let savedZip = String(
          meRes.data?.zip_code_1 || meRes.data?.zip_code_2 || "",
        )
          .replace("-", "")
          .trim();

        // 既存ユーザーでDB郵便番号が未設定の場合は、ローカル値で一度だけ補完する
        if (!savedZip) {
          const localZip1 = String(localStorage.getItem("userZip1") || "")
            .replace("-", "")
            .trim();
          const localZip2 = String(localStorage.getItem("userZip2") || "")
            .replace("-", "")
            .trim();

          if (localZip1) {
            await apiClient.patch("/users/me", {
              zip_code_1: localZip1,
              zip_code_2: localZip2 || null,
            });
            savedZip = localZip1;
          }
        }

        if (!savedZip) {
          setWeather({
            temp: "--",
            condition: "郵便番号が未設定です",
            city: "--",
            zip: "未設定",
          });
          return;
        }

        const weatherRes = await apiClient.get("/weather", {
          params: { zip_code: savedZip },
        });

        const locationName = weatherRes.data.location?.name || "--";
        const currentData = weatherRes.data.weather.current;
        const currentTemp = parseFloat(currentData.temp);

        let autoIndex = 0;
        if (currentTemp >= 25) autoIndex = 0;
        else if (currentTemp >= 15) autoIndex = 1;
        else autoIndex = 2;

        setIndex(autoIndex);
        setWeather({
          temp: currentData.temp,
          condition: currentData.weather,
          city: locationName,
          zip: savedZip,
        });
      } catch (error) {
        console.error("API接続エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- ログアウト処理 ---
  const handleLogout = () => {
    if (confirm("ログアウトしますか？")) {
      localStorage.clear();
      router.push("/login");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100 font-japanese">
      <div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl flex flex-col overflow-hidden">
        {/* ヘッダー：左側にログアウトボタンを配置 */}
        <div className="h-[56px] flex items-center px-4 border-b border-gray-200 relative">
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors absolute left-4"
          >
            ログアウト
          </button>
          <button
            onClick={() => router.push("/settings")}
            className="text-xs text-gray-400 hover:text-sky-500 transition-colors absolute right-4"
          >
            プロフィール
          </button>
          <div className="flex-1 text-center text-base font-semibold text-gray-700">
            ☀️ 今日のコーデ
          </div>
        </div>

        {/* メイン内容 */}
        <div className="flex-1 p-4">
          <div className="bg-sky-100 rounded-2xl p-4 text-center mb-4">
            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : (
              <>
                <p className="text-xs text-sky-600 font-medium mb-1">
                  📍 {weather.city} (〒{weather.zip})
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {weather.temp}℃
                </p>
                <p className="text-sm text-gray-600">{weather.condition}</p>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-4">
            <p className="text-sm font-semibold mb-2">
              おすすめコーデ {index + 1}
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>👕 {outfitSuggestions[index].tops}</li>
              <li>👖 {outfitSuggestions[index].bottoms}</li>
              <li>👟 {outfitSuggestions[index].shoes}</li>
            </ul>
            <div className="mt-3 bg-pink-50 rounded-xl p-2 text-xs text-pink-600 font-medium">
              {outfitSuggestions[index].comment}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIndex((index + 1) % outfitSuggestions.length)}
              className="flex-1 bg-gradient-to-r from-sky-400 to-sky-500 text-white py-2 rounded-xl text-sm hover:scale-105 active:scale-90 transition"
            >
              別のコーデ
            </button>
            <button className="flex-1 bg-gray-100 py-2 rounded-xl text-sm hover:bg-gray-200 active:scale-90 transition">
              詳細
            </button>
          </div>
        </div>

        {/* 下部ナビゲーション (元のBottomNavに戻す) */}
        <BottomNav pathname={pathname} router={router} />
      </div>
    </main>
  );
}

/* ===== サブコンポーネント ===== */

function BottomNav({ pathname, router }: BottomNavProps) {
  return (
    <div className="h-[64px] border-t border-gray-200 flex justify-around items-center">
      <NavBtn icon="🏠" label="ホーム" path="/" {...{ pathname, router }} />
      <NavBtn
        icon="👕"
        label="クローゼット"
        path="/closet"
        {...{ pathname, router }}
      />
      <NavBtn
        icon="💬"
        label="チャット"
        path="/chat"
        {...{ pathname, router }}
      />
    </div>
  );
}

function NavBtn({ icon, label, path, pathname, router }: NavBtnProps) {
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
