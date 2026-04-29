"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import apiClient from "@/lib/apiClient";

export default function SignUpPage() {
  const router = useRouter();

  // --- 状態管理 ---
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [constitution, setConstitution] = useState("normal"); // hot / normal / cold
  const [zipCode1, setZipCode1] = useState(""); 
  const [zipCode2, setZipCode2] = useState(""); 
  const [loading, setLoading] = useState(false);

  // --- 郵便番号のフォーマット制限（数字のみ、最大7桁） ---
  const handleZipChange = (value: string, setter: (val: string) => void) => {
    const formatted = value.replace(/\D/g, "").slice(0, 7);
    setter(formatted);
  };

  // --- サインアップ処理 ---
  const handleSignUp = async () => {
    // バリデーション
    if (!email || !password || !username || !zipCode1) {
      alert("必須項目をすべて入力してください");
      return;
    }
    if (zipCode1.length !== 7 || (zipCode2 && zipCode2.length !== 7)) {
      alert("郵便番号は7桁の数字で入力してください");
      return;
    }

    try {
      setLoading(true);

      // 1. Firebase Authで作成
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. 表示名の設定
      await updateProfile(user, { displayName: username });

      // 3. トークン保存
      const token = await user.getIdToken();
      localStorage.setItem("token", token);
      localStorage.setItem("login", "true");

      // 4. バックエンドへの追加データ送信
      // エンドポイントや構造はバックエンド担当者と適宜調整してください
      await apiClient.post("/auth/signup_extra", {
        uid: user.uid,
        username: username,
        constitution: constitution,
        zip_code_1: zipCode1,
        zip_code_2: zipCode2,
      });

      alert("アカウントが作成されました！");
      router.push("/");
    } catch (error: any) {
      console.error("SignUp Error:", error.message);
      alert("登録に失敗しました。内容を確認してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100 font-japanese">
      {/* ログイン画面と完全に一致するサイズとレイアウト */}
      <div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl p-6 flex flex-col justify-center space-y-5">
        
        {/* ヘッダー部分 */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-800">Climo ☁️</h1>
          <p className="text-sm text-gray-500">新規アカウント作成</p>
        </div>

        {/* 入力フォーム部分 */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="表示名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm transition"
          />

          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm transition"
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm transition"
          />

          {/* 体質選択ボタン */}
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 ml-2">体質</p>
            <div className="flex gap-2">
              {[
                { id: "hot", label: "暑がり" },
                { id: "normal", label: "普通" },
                { id: "cold", label: "寒がり" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setConstitution(item.id)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-semibold transition border ${
                    constitution === item.id 
                    ? "bg-sky-400 text-white border-sky-400 shadow-sm" 
                    : "bg-gray-50 text-gray-400 border-gray-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 郵便番号入力（横並び） */}
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 ml-2">郵便番号（7桁・数字のみ）</p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="地点1"
                value={zipCode1}
                onChange={(e) => handleZipChange(e.target.value, setZipCode1)}
                className="w-1/2 p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm text-center transition"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="地点2"
                value={zipCode2}
                onChange={(e) => handleZipChange(e.target.value, setZipCode2)}
                className="w-1/2 p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm text-center transition"
              />
            </div>
          </div>
        </div>

        {/* ボタン部分 */}
        <div className="space-y-3">
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="
              w-full py-3 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-sky-400 to-pink-400 shadow-md
              transition-all hover:scale-105 active:scale-95 disabled:opacity-50
            "
          >
            {loading ? "登録中..." : "登録して始める"}
          </button>

          <button
            onClick={() => router.push("/login")}
            className="w-full text-xs text-gray-400 hover:text-sky-500 transition text-center"
          >
            戻る
          </button>
        </div>

      </div>
    </main>
  );
}