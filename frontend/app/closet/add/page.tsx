"use client";

import { AxiosError } from "axios";
import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import {
  itemService,
  type ItemCategory,
  type ItemSeason,
} from "@/lib/itemService";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const categoryOptions: Array<{ value: ItemCategory; label: string }> = [
  { value: "tops", label: "トップス" },
  { value: "bottoms", label: "ボトムス" },
  { value: "outerwear", label: "アウター" },
  { value: "shoes", label: "シューズ" },
  { value: "accessories", label: "アクセサリー" },
  { value: "other", label: "その他" },
];

const seasonOptions: Array<{ value: ItemSeason; label: string }> = [
  { value: "spring", label: "春" },
  { value: "summer", label: "夏" },
  { value: "autumn", label: "秋" },
  { value: "winter", label: "冬" },
  { value: "all_season", label: "オールシーズン" },
];

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
  }

  return "保存に失敗しました";
}

export default function AddClothesPage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const libraryInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("tops");
  const [color, setColor] = useState("");
  const [season, setSeason] = useState<ItemSeason>("all_season");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert("画像は10MB以下にしてください");
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setImageFile(file);
    setImagePreviewUrl(nextPreviewUrl);
  };

  const clearSelectedImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !color.trim() || loading) {
      return;
    }

    setLoading(true);

    try {
      await itemService.createItem({
        name: name.trim(),
        category,
        color: color.trim(),
        season,
        image: imageFile,
      });

      router.push("/closet");
    } catch (error) {
      alert(getErrorMessage(error));
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100 p-4">
      <div className="w-[360px] min-h-[640px] bg-white rounded-[40px] shadow-xl p-6 flex flex-col justify-between gap-6">
        <div>
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">➕ 服を追加</h1>
            <p className="text-sm text-gray-500">新しいアイテムを登録</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="w-full h-36 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
                {imagePreviewUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={imagePreviewUrl}
                      alt="選択した画像のプレビュー"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">
                    📷 画像はまだ選択されていません
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-sky-100 text-sky-700 py-3 rounded-xl hover:bg-sky-200 active:scale-95 transition"
                >
                  カメラで撮影
                </button>
                <button
                  type="button"
                  onClick={() => libraryInputRef.current?.click()}
                  className="bg-pink-100 text-pink-700 py-3 rounded-xl hover:bg-pink-200 active:scale-95 transition"
                >
                  ファイルを選択
                </button>
              </div>

              {imageFile && (
                <button
                  type="button"
                  onClick={clearSelectedImage}
                  className="w-full bg-gray-100 text-gray-600 py-2 rounded-xl hover:bg-gray-200 active:scale-95 transition"
                >
                  選択した画像を削除
                </button>
              )}

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageSelect}
              />
              <input
                ref={libraryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            <input
              type="text"
              placeholder="例：白Tシャツ"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300"
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as ItemCategory)
              }
              className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="例：白、ネイビー"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300"
            />

            <select
              value={season}
              onChange={(event) => setSeason(event.target.value as ItemSeason)}
              className="w-full p-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              {seasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-100 py-3 rounded-xl hover:bg-gray-200 active:scale-95"
          >
            戻る
          </button>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={loading || !name.trim() || !color.trim()}
            className="flex-1 bg-gradient-to-r from-sky-400 to-pink-400 text-white py-3 rounded-xl shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </main>
  );
}
