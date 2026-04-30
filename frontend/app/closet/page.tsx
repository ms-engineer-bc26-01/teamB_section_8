"use client";

import { AxiosError } from "axios";
import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  itemService,
  type ClosetItem,
  type ItemCategory,
} from "@/lib/itemService";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const categoryLabels: Record<ItemCategory, string> = {
  tops: "トップス",
  bottoms: "ボトムス",
  outerwear: "アウター",
  shoes: "シューズ",
  accessories: "アクセサリー",
  other: "その他",
};

type RouterType = ReturnType<typeof useRouter>;

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}

export default function ClosetPage() {
  const router = useRouter();
  const pathname = usePathname();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const libraryInputRef = useRef<HTMLInputElement | null>(null);

  const [clothes, setClothes] = useState<ClosetItem[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadItems = async () => {
      try {
        const items = await itemService.getAllItems();
        const sortedItems = [...items].sort(
          (left, right) =>
            Date.parse(right.created_at) - Date.parse(left.created_at),
        );

        if (cancelled) {
          return;
        }

        setClothes(sortedItems);

        const nextImageUrls: Record<string, string> = {};

        await Promise.all(
          sortedItems.map(async (item) => {
            if (!item.image_url) {
              return;
            }

            try {
              const blobUrl = await itemService.getItemImageBlobUrl(item.id);
              nextImageUrls[item.id] = blobUrl;
            } catch {
              nextImageUrls[item.id] = "";
            }
          }),
        );

        if (cancelled) {
          Object.values(nextImageUrls).forEach((url) => {
            if (url) {
              URL.revokeObjectURL(url);
            }
          });
          return;
        }

        setImageUrls((current) => {
          Object.values(current).forEach((url) => {
            URL.revokeObjectURL(url);
          });
          return nextImageUrls;
        });
      } catch (error) {
        alert(getErrorMessage(error, "アイテム一覧の取得に失敗しました"));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadItems();

    return () => {
      cancelled = true;
      setImageUrls((current) => {
        Object.values(current).forEach((url) => {
          URL.revokeObjectURL(url);
        });
        return {};
      });
    };
  }, []);

  const replaceItemImage = async (itemId: string, file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      alert("画像は10MB以下にしてください");
      return;
    }

    setBusyItemId(itemId);

    try {
      const updatedItem = await itemService.updateItemImage(itemId, file);
      const nextUrl = await itemService.getItemImageBlobUrl(itemId);

      setClothes((current) =>
        current.map((item) => (item.id === itemId ? updatedItem : item)),
      );
      setImageUrls((current) => {
        const existingUrl = current[itemId];
        if (existingUrl) {
          URL.revokeObjectURL(existingUrl);
        }
        return { ...current, [itemId]: nextUrl };
      });
    } catch (error) {
      alert(getErrorMessage(error, "画像の更新に失敗しました"));
    } finally {
      setBusyItemId(null);
      setPickerTarget(null);
    }
  };

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file || !pickerTarget) {
      return;
    }

    await replaceItemImage(pickerTarget, file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除してもよろしいですか？")) {
      return;
    }

    setBusyItemId(id);

    try {
      await itemService.deleteItem(id);
      setClothes((current) => current.filter((item) => item.id !== id));
      setImageUrls((current) => {
        const next = { ...current };
        if (next[id]) {
          URL.revokeObjectURL(next[id]);
          delete next[id];
        }
        return next;
      });
    } catch (error) {
      alert(getErrorMessage(error, "アイテムの削除に失敗しました"));
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm("画像を削除してもよろしいですか？")) {
      return;
    }

    setBusyItemId(id);

    try {
      await itemService.deleteItemImage(id);
      setClothes((current) =>
        current.map((item) =>
          item.id === id ? { ...item, image_url: null } : item,
        ),
      );
      setImageUrls((current) => {
        const next = { ...current };
        if (next[id]) {
          URL.revokeObjectURL(next[id]);
          delete next[id];
        }
        return next;
      });
    } catch (error) {
      alert(getErrorMessage(error, "画像の削除に失敗しました"));
    } finally {
      setBusyItemId(null);
    }
  };

  const openPicker = (itemId: string, mode: "camera" | "library") => {
    setPickerTarget(itemId);

    if (mode === "camera") {
      cameraInputRef.current?.click();
      return;
    }

    libraryInputRef.current?.click();
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100 p-4">
      <div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl flex flex-col overflow-hidden">
        <div className="h-[56px] flex items-center justify-center border-b border-gray-200 text-base font-semibold text-gray-700">
          👕 クローゼット
        </div>

        <div className="flex-1 p-3 overflow-y-auto">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handleImageSelected(event)}
          />
          <input
            ref={libraryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleImageSelected(event)}
          />

          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              読み込み中...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {clothes.length === 0 && (
                <div className="col-span-2 text-center text-gray-400 text-sm mt-6">
                  🧺 まだ服がありません
                </div>
              )}

              {clothes.map((item) => {
                const hasImage = Boolean(imageUrls[item.id]);
                const isBusy = busyItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className="relative bg-white rounded-2xl shadow-md p-3 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition"
                  >
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      disabled={isBusy}
                      className="absolute top-2 right-2 text-xs bg-gray-200 w-6 h-6 rounded-full hover:bg-red-400 hover:text-white active:scale-90 transition disabled:opacity-50"
                    >
                      ✕
                    </button>

                    <div className="relative w-full h-20 bg-gray-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
                      {hasImage ? (
                        <Image
                          src={imageUrls[item.id]}
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        "👕"
                      )}
                    </div>

                    <p className="text-sm text-center font-semibold">
                      {item.name}
                    </p>

                    <div className="text-center mt-1 mb-2">
                      <span className="text-xs bg-sky-100 text-sky-600 px-2 py-1 rounded-full">
                        {categoryLabels[item.category]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => openPicker(item.id, "camera")}
                        disabled={isBusy}
                        className="bg-sky-100 text-sky-700 py-2 rounded-lg hover:bg-sky-200 active:scale-95 transition disabled:opacity-50"
                      >
                        撮影
                      </button>
                      <button
                        type="button"
                        onClick={() => openPicker(item.id, "library")}
                        disabled={isBusy}
                        className="bg-pink-100 text-pink-700 py-2 rounded-lg hover:bg-pink-200 active:scale-95 transition disabled:opacity-50"
                      >
                        画像選択
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteImage(item.id)}
                        disabled={isBusy || !item.image_url}
                        className="col-span-2 bg-gray-100 text-gray-600 py-2 rounded-lg hover:bg-gray-200 active:scale-95 transition disabled:opacity-50"
                      >
                        画像を削除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-center mb-2">
          <button
            type="button"
            onClick={() => router.push("/closet/add")}
            className="w-12 h-12 bg-pink-400 text-white rounded-full text-xl hover:scale-110 active:scale-90 transition"
          >
            ＋
          </button>
        </div>

        <BottomNav pathname={pathname} router={router} />
      </div>
    </main>
  );
}

function BottomNav({
  pathname,
  router,
}: {
  pathname: string;
  router: RouterType;
}) {
  return (
    <div className="h-[64px] border-t border-gray-200 flex justify-around items-center">
      <NavBtn
        icon="🏠"
        label="ホーム"
        path="/"
        pathname={pathname}
        router={router}
      />
      <NavBtn
        icon="👕"
        label="クローゼット"
        path="/closet"
        pathname={pathname}
        router={router}
      />
      <NavBtn
        icon="💬"
        label="チャット"
        path="/chat"
        pathname={pathname}
        router={router}
      />
    </div>
  );
}

function NavBtn({
  icon,
  label,
  path,
  pathname,
  router,
}: {
  icon: string;
  label: string;
  path: string;
  pathname: string;
  router: RouterType;
}) {
  const active = pathname === path;

  return (
    <button
      type="button"
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
