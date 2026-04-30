"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import apiClient from "@/lib/apiClient";

/**
 * サインアップページコンポーネント
 * Firebase AuthとバックエンドDBのユーザー登録を同期させます。
 */
export default function SignUpPage() {
  const router = useRouter();

  // --- ステート管理 (ユーザー入力情報) ---
  const [username, setUsername] = useState(""); // 表示名（Firebase用）
  const [email, setEmail] = useState(""); // メールアドレス
  const [password, setPassword] = useState(""); // パスワード
  const [constitution, setConstitution] = useState("normal"); // 体質（hot/normal/cold）
  const [zipCode1, setZipCode1] = useState(""); // 郵便番号1（必須）
  const [zipCode2, setZipCode2] = useState(""); // 郵便番号2（任意）
  const [loading, setLoading] = useState(false); // ローディング状態

  /**
   * 郵便番号のバリデーション
   * 数字のみを許可し、最大7桁に制限します。
   */
  const handleZipChange = (value: string, setter: (val: string) => void) => {
    const formatted = value.replace(/\D/g, "").slice(0, 7);
    setter(formatted);
  };

  /**
   * サインアップ処理
   * 1. Firebase Authでアカウント作成
   * 2. Firebaseプロフィールの更新
   * 3. バックエンドDBへのユーザーデータ保存
   */
  const handleSignUp = async () => {
    // 必須項目の入力チェック
    if (!email || !password || !username || !zipCode1) {
      alert("必須項目をすべて入力してください。");
      return;
    }

    // 日本の郵便番号形式（7桁）のチェック
    if (zipCode1.length !== 7) {
      alert("郵便番号は7桁の数字で入力してください。");
      return;
    }

    try {
      setLoading(true);

      // --- ステップ1: Firebase Auth でユーザー作成 ---
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // --- ステップ2: Firebaseの表示名を更新 ---
      await updateProfile(user, { displayName: username });

      // --- ステップ3: Firebase IDトークンの取得と保存 ---
      const token = await user.getIdToken(true);
      localStorage.setItem("token", token);

      // --- ステップ4: バックエンドAPIとの同期 ---
      // Firebase認証済みユーザーをDBに作成し、プロフィールを更新する
      await apiClient.post("/auth/sync");
      await apiClient.patch("/users/me", {
        user_name: username,
        temperature_sensitivity: constitution,
        zip_code_1: zipCode1,
        zip_code_2: zipCode2 || null,
      });

      // --- ステップ5: signup直後は自動ログイン扱いにせず、明示ログインへ誘導 ---
      await signOut(auth);
      localStorage.removeItem("token");
      localStorage.removeItem("login");

      alert("登録が完了しました。ログインしてください。");
      router.push("/login");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("SignUp Error:", errorMessage);

      // Firebaseエラーの日本語化
      if (errorMessage.includes("email-already-in-use")) {
        alert("このメールアドレスは既に登録されています。");
      } else if (errorMessage.includes("weak-password")) {
        alert("パスワードは6文字以上で入力してください。");
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
        {/* ヘッダー部分 */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-800">Climo ☁️</h1>
          <p className="text-sm text-gray-500">新規登録</p>
        </div>

        {/* 入力フォーム */}
        <div className="space-y-3">
          {/* ニックネーム */}
          <input
            type="text"
            placeholder="ニックネーム"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
          />
          {/* メールアドレス */}
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
          />
          {/* パスワード */}
          <input
            type="password"
            placeholder="パスワード（6文字以上）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
          />

          {/* 体質選択（暑がり・寒がり） */}
          <div className="space-y-1 text-left">
            <p className="text-[10px] text-gray-400 ml-2">体質について</p>
            <div className="flex gap-2">
              {(["hot", "normal", "cold"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setConstitution(type)}
                  className={`flex-1 py-2 rounded-xl text-[10px] border transition ${
                    constitution === type
                      ? "bg-sky-400 text-white border-sky-400 shadow-sm"
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

          {/* 郵便番号入力 */}
          <div className="space-y-1 text-left">
            <p className="text-[10px] text-gray-400 ml-2">
              郵便番号（地点1は必須）
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="7桁の数字"
                value={zipCode1}
                onChange={(e) => handleZipChange(e.target.value, setZipCode1)}
                className="w-1/2 p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm text-center"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="地点2（任意）"
                value={zipCode2}
                onChange={(e) => handleZipChange(e.target.value, setZipCode2)}
                className="w-1/2 p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm text-center"
              />
            </div>
          </div>
        </div>

        {/* ボタン部分 */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-400 to-pink-400 shadow-md active:scale-95 disabled:opacity-50 transition"
          >
            {loading ? "登録中..." : "アカウントを作成する"}
          </button>
          <button
            onClick={() => router.push("/login")}
            className="w-full text-xs text-gray-400 text-center hover:text-sky-500"
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    </main>
  );
}
