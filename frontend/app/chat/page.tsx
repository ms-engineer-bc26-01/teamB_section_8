"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

// メッセージ型
type Message = {
  role: "user" | "ai";
  text: string;
};

export default function ChatPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "こんにちは！今日のコーデを一緒に考えましょう👕✨",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 仮AI（あとでAPIに置き換え）
  const generateReply = () => {
    try {
      const clothes = JSON.parse(localStorage.getItem("clothes") || "[]");

      const top = clothes.find((c: any) => c.category === "トップス");
      const bottom = clothes.find((c: any) => c.category === "ボトムス");

      if (top && bottom) {
        return `今日は暖かいので「${top.name}」と「${bottom.name}」の組み合わせがおすすめです！🌤️`;
      }

      if (top) {
        return `「${top.name}」を中心に軽めのコーデがおすすめです！✨`;
      }

      return "今日は気温に合わせて軽めの服装がおすすめです！👕";
    } catch {
      return "コーデを考え中です…🤔";
    }
  };

  // 送信処理
  const handleSend = () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const aiMessage: Message = {
        role: "ai",
        text: generateReply(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
    }, 800);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100">
      
      {/* スマホ風コンテナ */}
      <div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl flex flex-col overflow-hidden">

        {/* ヘッダー */}
        <div className="p-4 border-b text-center font-bold text-gray-700">
          💬 コーデ相談
        </div>

        {/* チャットエリア */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`
                  max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm
                  transition-all duration-200
                  ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-sky-400 to-pink-400 text-white"
                      : "bg-gray-100 text-gray-800"
                  }
                `}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* AIタイピング */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm text-gray-500 animate-pulse">
                AIが考え中...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 入力エリア */}
        <div className="p-3 border-t flex gap-2">

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="今日は何を着ればいい？"
            className="
              flex-1 p-2 rounded-xl bg-gray-100 text-sm
              focus:outline-none focus:ring-2 focus:ring-sky-300
              transition-all duration-200
            "
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="
              px-4 rounded-xl text-white text-sm font-semibold
              bg-gradient-to-r from-sky-400 to-pink-400
              shadow-md
              transition-all duration-200 ease-out
              hover:scale-105 hover:shadow-lg
              active:scale-90
              disabled:opacity-50
            "
          >
            送信
          </button>

        </div>

        {/* ナビゲーション */}
        <div className="border-t p-2 flex justify-around">

          <button
            onClick={() => router.push("/")}
            className={`
              flex flex-col items-center px-3 py-2 rounded-xl
              transition-all duration-200
              hover:bg-gray-100 active:scale-90
              ${pathname === "/" ? "bg-sky-100 text-sky-600" : "text-gray-500"}
            `}
          >
            🏠
            <span className="text-xs">ホーム</span>
          </button>

          <button
            onClick={() => router.push("/closet")}
            className={`
              flex flex-col items-center px-3 py-2 rounded-xl
              transition-all duration-200
              hover:bg-gray-100 active:scale-90
              ${pathname === "/closet" ? "bg-sky-100 text-sky-600" : "text-gray-500"}
            `}
          >
            👕
            <span className="text-xs">クローゼット</span>
          </button>

          <button
            onClick={() => router.push("/chat")}
            className={`
              flex flex-col items-center px-3 py-2 rounded-xl
              transition-all duration-200
              hover:bg-gray-100 active:scale-90
              ${pathname === "/chat" ? "bg-sky-100 text-sky-600" : "text-gray-500"}
            `}
          >
            💬
            <span className="text-xs">チャット</span>
          </button>

        </div>

      </div>
    </main>
  );
}