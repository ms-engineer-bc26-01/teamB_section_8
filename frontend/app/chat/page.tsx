"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import apiClient from "@/lib/apiClient"; // カスタムAxiosインスタンス

type Message = {
  role: "user" | "ai";
  text: string;
};

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

export default function ChatPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "こんにちは！コーデ相談しよう👕✨" },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // メッセージ更新時に自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 送信処理（バックエンドAPI連携）
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // ユーザーのメッセージを画面に追加
    const userMsg: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      // バックエンドの /chat エンドポイントへPOSTリクエスト
      const response = await apiClient.post("/chat", {
        message: currentInput,
      });

      // AIからの返信を画面に追加
      const aiMsg: Message = { role: "ai", text: response.data.reply };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat API Error:", error);
      // エラー時のフォールバックメッセージ
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "すみません、エラーが発生しました。接続を確認してください。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * キーボードイベントハンドラ
   * IME（入力法）による変換中のEnterキー入力を無視するための制御
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enterキーが押され、かつ【変換中ではない】場合のみ送信
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleSend();
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100 font-japanese">
      <div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="h-[56px] flex items-center justify-center border-b border-gray-200 text-base font-semibold text-gray-700 bg-white">
          💬 チャット
        </div>

        {/* メッセージ表示エリア */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-3 py-2 rounded-xl text-sm ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-sky-400 to-pink-400 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 px-3 py-2 rounded-xl text-xs text-gray-400 animate-pulse">
                AIが考え中...
              </div>
            </div>
          )}

          {/* 自動スクロール用のアンカー */}
          <div ref={bottomRef} />
        </div>

        {/* 入力エリア（UIを元に戻しました） */}
        <div className="p-3 border-t border-gray-200 flex gap-2 bg-white">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} // 输入法修正逻辑
            className="flex-1 p-2 rounded-xl bg-gray-100 text-sm outline-none focus:ring-1 focus:ring-sky-200 transition"
            placeholder="相談内容を入力..."
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="
              px-4 bg-gradient-to-r from-sky-400 to-pink-400 text-white 
              rounded-xl text-sm hover:scale-105 active:scale-90 transition 
              disabled:opacity-50 disabled:cursor-not-allowed font-semibold
            "
          >
            {loading ? "..." : "送信"}
          </button>
        </div>

        <BottomNav pathname={pathname} router={router} />
      </div>
    </main>
  );
}

/* ===== 共通ナビゲーション（ BottomNav / NavBtn） ===== */
function BottomNav({ pathname, router }: BottomNavProps) {
  return (
    <div className="h-[64px] border-t border-gray-200 flex justify-around items-center bg-white">
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
        active ? "bg-sky-100 text-sky-600 font-semibold" : "text-gray-400"
      } hover:bg-gray-100 active:scale-90`}
    >
      <span className="text-lg mb-0.5">{icon}</span>
      {label}
    </button>
  );
}
