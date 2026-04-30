"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";

type Constitution = "hot" | "normal" | "cold";

type ProfileForm = {
  email: string;
  user_name: string;
  temperature_sensitivity: Constitution;
  zip_code_1: string;
  zip_code_2: string;
};

const DEFAULT_FORM: ProfileForm = {
  email: "",
  user_name: "",
  temperature_sensitivity: "normal",
  zip_code_1: "",
  zip_code_2: "",
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>(DEFAULT_FORM);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/users/me");
        const data = res.data;
        setForm({
          email: String(data?.email || ""),
          user_name: String(data?.user_name || ""),
          temperature_sensitivity:
            data?.temperature_sensitivity === "hot" ||
            data?.temperature_sensitivity === "cold"
              ? data.temperature_sensitivity
              : "normal",
          zip_code_1: String(data?.zip_code_1 || ""),
          zip_code_2: String(data?.zip_code_2 || ""),
        });
      } catch (error) {
        console.error("プロフィール取得エラー:", error);
        alert("プロフィールの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const isZip1Valid = useMemo(
    () => form.zip_code_1.length === 7,
    [form.zip_code_1],
  );

  const handleZipChange = (value: string, key: "zip_code_1" | "zip_code_2") => {
    const formatted = value.replace(/\D/g, "").slice(0, 7);
    setForm((prev) => ({ ...prev, [key]: formatted }));
  };

  const handleSave = async () => {
    if (!form.user_name.trim()) {
      alert("ニックネームを入力してください。");
      return;
    }

    if (!isZip1Valid) {
      alert("郵便番号（地点1）は7桁の数字で入力してください。");
      return;
    }

    try {
      setSaving(true);
      await apiClient.patch("/users/me", {
        user_name: form.user_name.trim(),
        temperature_sensitivity: form.temperature_sensitivity,
        zip_code_1: form.zip_code_1,
        zip_code_2: form.zip_code_2 || null,
      });

      localStorage.setItem("userName", form.user_name.trim());
      localStorage.setItem("userZip1", form.zip_code_1);
      localStorage.setItem("userZip2", form.zip_code_2);
      localStorage.setItem("constitution", form.temperature_sensitivity);

      alert("プロフィールを更新しました。");
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
      alert("プロフィール更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100 font-japanese">
      <div className="w-[360px] min-h-[640px] bg-white rounded-[40px] shadow-xl p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push("/")}
            className="text-xs text-gray-400 hover:text-sky-500"
          >
            ホームへ戻る
          </button>
          <h1 className="text-base font-semibold text-gray-700">
            プロフィール設定
          </h1>
          <div className="w-16" />
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            読み込み中...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">メールアドレス</p>
              <input
                value={form.email}
                readOnly
                className="w-full p-3 rounded-xl bg-gray-100 text-sm text-gray-500"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500">ニックネーム</p>
              <input
                value={form.user_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, user_name: e.target.value }))
                }
                className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500">体質</p>
              <div className="flex gap-2">
                {(["hot", "normal", "cold"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        temperature_sensitivity: type,
                      }))
                    }
                    className={`flex-1 py-2 rounded-xl text-xs border transition ${
                      form.temperature_sensitivity === type
                        ? "bg-sky-400 text-white border-sky-400"
                        : "bg-gray-50 text-gray-400 border-gray-100"
                    }`}
                  >
                    {type === "hot"
                      ? "🥵 暑がり"
                      : type === "normal"
                        ? "😐 普通"
                        : "🥶 寒がり"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500">郵便番号（地点1は必須）</p>
              <div className="flex gap-2">
                <input
                  inputMode="numeric"
                  placeholder="地点1 (7桁)"
                  value={form.zip_code_1}
                  onChange={(e) =>
                    handleZipChange(e.target.value, "zip_code_1")
                  }
                  className="w-1/2 p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm text-center"
                />
                <input
                  inputMode="numeric"
                  placeholder="地点2 (任意)"
                  value={form.zip_code_2}
                  onChange={(e) =>
                    handleZipChange(e.target.value, "zip_code_2")
                  }
                  className="w-1/2 p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm text-center"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-400 to-pink-400 shadow-md active:scale-95 disabled:opacity-50 transition"
            >
              {saving ? "保存中..." : "プロフィールを保存"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
