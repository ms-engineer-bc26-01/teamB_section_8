"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

type Message = {
  role: "user" | "ai";
  text: string;
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "今日は軽めのコーデがおすすめです🌤️" },
      ]);
      setLoading(false);
    }, 800);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100">
      <div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl flex flex-col overflow-hidden">

        {/* ヘッダー */}
        <div className="h-[56px] flex items-center justify-center border-b border-gray-200 text-base font-semibold text-gray-700">
          💬 チャット
        </div>

        {/* メッセージ */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`px-3 py-2 rounded-xl text-sm ${m.role === "user" ? "bg-gradient-to-r from-sky-400 to-pink-400 text-white" : "bg-gray-100"}`}>
                {m.text}
              </div>
            </div>
          ))}

          {loading && <p className="text-xs text-gray-400">AIが考え中...</p>}

          <div ref={bottomRef} />
        </div>

        {/* 入力 */}
        <div className="p-3 border-t border-gray-200 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 rounded-xl bg-gray-100 text-sm"
          />
          <button
            onClick={handleSend}
            className="px-4 bg-gradient-to-r from-sky-400 to-pink-400 text-white rounded-xl text-sm hover:scale-105 active:scale-90 transition"
          >
            送信
          </button>
        </div>

        <BottomNav pathname={pathname} router={router} />
      </div>
    </main>
  );
}

/* ===== 共通ナビ ===== */
function BottomNav({ pathname, router }: any) {
  return (
    <div className="h-[64px] border-t border-gray-200 flex justify-around items-center">
      <NavBtn icon="🏠" label="ホーム" path="/" {...{ pathname, router }} />
      <NavBtn icon="👕" label="クローゼット" path="/closet" {...{ pathname, router }} />
      <NavBtn icon="💬" label="チャット" path="/chat" {...{ pathname, router }} />
    </div>
  );
}

function NavBtn({ icon, label, path, pathname, router }: any) {
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