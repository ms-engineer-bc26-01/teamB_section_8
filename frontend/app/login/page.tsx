"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  // 状態管理
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ログイン処理
  const handleLogin = async () => {
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }

    try {
      setLoading(true);

      // 1. Firebase認証でログイン
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      /**
       * 2. 重要：FirebaseからIDトークンを取得
       */
      const token = await user.getIdToken();

      /**
       * 3. トークンとログイン状態を保存
       */
      localStorage.setItem("token", token);
      localStorage.setItem("login", "true");

      console.log("ログイン成功、トークンを保存しました");

      // 4. ダッシュボードへ遷移
      router.push("/");
    } catch (error: any) {
      alert("ログインに失敗しました。パスワードを確認してください。");
      console.error("Login Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100 font-japanese">
      <div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl p-6 flex flex-col justify-center space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-800">Climo ☁️</h1>
          <p className="text-sm text-gray-500">ログインしてください</p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 transition"
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
          />
        </div>

        {/* ボタンエリア */}
        <div className="space-y-3">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="
              w-full py-3 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-sky-400 to-pink-400 shadow-md
              transition-all hover:scale-105 active:scale-95 disabled:opacity-50
            "
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>

          {/* 新規登録への導線を追加 */}
          <button
            onClick={() => router.push("/signup")}
            className="w-full text-xs text-gray-400 hover:text-sky-500 transition"
          >
            アカウントをお持ちではありませんか？ 新規登録
          </button>
        </div>
      </div>
    </main>
  );
}