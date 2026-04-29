"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function SignUpPage() {
  const router = useRouter();

  // 状態管理（ユーザー名を削除）
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // サインアップ処理
  const handleSignUp = async () => {
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }

    try {
      setLoading(true);

      // 1. Firebase認証で新規ユーザー作成
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      /**
       * 2. トークンの取得と保存
       * ログイン後と同様にトークンを保存して、API接続を可能にします
       */
      const token = await user.getIdToken();
      localStorage.setItem("token", token);
      localStorage.setItem("login", "true");

      alert("アカウントが作成されました！");
      console.log("サインアップ成功、トークンを保存しました");

      // 3. ダッシュボード（ホーム）へ遷移
      router.push("/");
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        alert("このメールアドレスは既に登録されています。");
      } else if (error.code === 'auth/weak-password') {
        alert("パスワードが短すぎます（6文字以上必要です）。");
      } else {
        alert("アカウント作成に失敗しました。");
      }
      console.error("SignUp Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100">
      <div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl p-6 flex flex-col justify-center space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold font-japanese text-gray-800">Climo ☁️</h1>
          <p className="text-sm text-gray-500 font-japanese">新規アカウント作成</p>
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
            {loading ? "作成中..." : "アカウントを作成"}
          </button>

          <button
            onClick={() => router.push("/login")}
            className="w-full text-xs text-gray-400 hover:text-sky-500 transition font-japanese"
          >
            すでにアカウントをお持ちですか？ ログイン
          </button>
        </div>

      </div>
    </main>
  );
}