"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import apiClient from "@/lib/apiClient";

export default function SignUpPage() {
  const router = useRouter();

  // --- ステート管理 (ユーザー入力情報) ---
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [constitution, setConstitution] = useState("normal");
  const [zipCode1, setZipCode1] = useState("");
  const [zipCode2, setZipCode2] = useState("");
  const [loading, setLoading] = useState(false);

  // 郵便番号のバリデーション：数字のみ7桁に制限
  const handleZipChange = (value: string, setter: (val: string) => void) => {
    const formatted = value.replace(/\D/g, "").slice(0, 7);
    setter(formatted);
  };

  // --- サインアップ実行メインロジック ---
  const handleSignUp = async () => {
    // 必須項目のチェック
    if (!email || !password || !username || !zipCode1) {
      alert("必須項目をすべて入力してください");
      return;
    }

    try {
      setLoading(true);

      // 1. Firebase Auth でアカウント作成 (最も重要な認証ステップ)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Firebase 上のユーザープロフィール（表示名）を更新
      await updateProfile(user, { displayName: username });

      // 3. バックエンド API 呼び出し
      // 後端の不具合（400エラーなど）で全体の処理が止まらないよう、独自のtry-catchで囲む
      try {
        await apiClient.post("/auth/signup", {
          email: email,
          password: password
        });
      } catch (apiErr: any) {
        // APIエラーが発生しても、Firebase登録が成功していれば続行する
        console.warn("バックエンドAPIエラー（デモ用に無視して続行）:", apiErr.response?.data || apiErr.message);
      }

      // 4. Firebase トークンの取得と保存
      const token = await user.getIdToken();
      localStorage.setItem("token", token);
      localStorage.setItem("login", "true");

      // 5. 【バックアップ用】後端APIが未対応の項目をローカルストレージに保存
      // これにより、ダッシュボードですぐに情報を表示できる
      localStorage.setItem("userName", username);
      localStorage.setItem("userZip1", zipCode1);
      localStorage.setItem("userZip2", zipCode2);
      localStorage.setItem("constitution", constitution);

      alert("アカウント登録が完了しました！");
      router.push("/"); // 登録成功後、ダッシュボードへ遷移

    } catch (error: any) {
      console.error("SignUp Error:", error.message);
      
      // Firebase の主要なエラーメッセージを日本語化
      if (error.message.includes("email-already-in-use")) {
        alert("このメールアドレスは既に登録されています。別のメールアドレスを試すかログインしてください。");
      } else if (error.message.includes("weak-password")) {
        alert("パスワードが短すぎます。6文字以上で設定してください。");
      } else {
        alert("登録中にエラーが発生しました。入力内容を確認してください。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100 font-japanese">
      <div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl p-6 flex flex-col justify-center space-y-5">
        
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-800">Climo ☁️</h1>
          <p className="text-sm text-gray-500">新規アカウント作成</p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="表示名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
          />
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
          />
          <input
            type="password"
            placeholder="パスワード (6文字以上)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
          />

          <div className="space-y-1 text-left">
            <p className="text-[10px] text-gray-400 ml-2">体質</p>
            <div className="flex gap-2">
              {['hot', 'normal', 'cold'].map((type) => (
                <button
                  key={type}
                  onClick={() => setConstitution(type)}
                  className={`flex-1 py-2 rounded-xl text-[10px] border transition ${
                    constitution === type ? "bg-sky-400 text-white border-sky-400 shadow-sm" : "bg-gray-50 text-gray-400 border-gray-100"
                  }`}
                >
                  {type === 'hot' ? '🥵 暑がり' : type === 'normal' ? '😐 普通' : '🥶 寒がり'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-left">
            <p className="text-[10px] text-gray-400 ml-2">郵便番号（7桁数字・地点1は必須）</p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="地点1"
                value={zipCode1}
                onChange={(e) => handleZipChange(e.target.value, setZipCode1)}
                className="w-1/2 p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm text-center"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="地点2"
                value={zipCode2}
                onChange={(e) => handleZipChange(e.target.value, setZipCode2)}
                className="w-1/2 p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm text-center"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-400 to-pink-400 shadow-md active:scale-95 disabled:opacity-50 transition"
          >
            {loading ? "登録中..." : "登録して始める"}
          </button>
          <button onClick={() => router.push("/login")} className="w-full text-xs text-gray-400 text-center hover:text-sky-500">
            戻る
          </button>
        </div>
      </div>
    </main>
  );
}