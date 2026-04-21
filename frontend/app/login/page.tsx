"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  //  状態管理
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  //  ログイン処理
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (error) {
      alert("ログインに失敗しました");
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100">
      
      {/* スマホ風コンテナ */}
      <div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl p-6 flex flex-col justify-center space-y-6">
        
        {/* タイトルエリア */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Climo ☁️</h1>
          <p className="text-sm text-gray-500">
            ログインしてください
          </p>
        </div>

        {/* 入力フォーム */}
        <div className="space-y-4">
          
          {/* メールアドレス入力 */}
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 transition"
          />

          {/* パスワード入力 */}
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
          />
        </div>

        {/* 🔘 ログインボタン */}
        <button
          onClick={handleLogin}
          className="
            w-full py-3 rounded-xl text-sm font-semibold text-white
            bg-gradient-to-r from-sky-400 to-pink-400
            shadow-md
            transition-all duration-200
            hover:scale-105 hover:shadow-lg
            active:scale-95
          "
        >
          ログイン
        </button>

      </div>
    </main>
  );
}