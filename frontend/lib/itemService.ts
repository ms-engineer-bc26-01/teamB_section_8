import apiClient from "./apiClient";

/**
 * クローゼット関連のAPIリクエスト
 */
export type ItemCategory =
  | "tops"
  | "bottoms"
  | "outerwear"
  | "shoes"
  | "accessories"
  | "other";

export type ItemSeason =
  | "spring"
  | "summer"
  | "autumn"
  | "winter"
  | "all_season";

export type ClosetItem = {
  id: string;
  user_id: string;
  name: string;
  category: ItemCategory;
  color: string;
  season: ItemSeason;
  image_url: string | null;
  created_at: string;
};

export const itemService = {
  // 1. 服の一覧取得 (GET /items)
  getAllItems: async () => {
    const response = await apiClient.get("/items");
    return response.data as ClosetItem[];
  },

  // 2. 新しい服の登録 (POST /items)
  createItem: async (itemData: {
    name: string;
    category: ItemCategory;
    color: string;
    season: ItemSeason;
    image?: File | null;
  }) => {
    const formData = new FormData();
    formData.append("name", itemData.name);
    formData.append("category", itemData.category);
    formData.append("color", itemData.color);
    formData.append("season", itemData.season);

    if (itemData.image) {
      formData.append("image", itemData.image);
    }

    const response = await apiClient.post("/items", formData);
    return response.data as ClosetItem;
  },

  // 3. 特定の服の取得 (GET /items/{item_id})
  getItemById: async (itemId: string) => {
    const response = await apiClient.get(`/items/${itemId}`);
    return response.data as ClosetItem;
  },

  // 4. 衣服情報の更新 (PUT /items/{item_id})
  updateItem: async (
    itemId: string,
    updateData: Partial<
      Pick<ClosetItem, "name" | "category" | "color" | "season" | "image_url">
    >,
  ) => {
    const response = await apiClient.put(`/items/${itemId}`, updateData);
    return response.data as ClosetItem;
  },

  updateItemImage: async (itemId: string, image: File) => {
    const formData = new FormData();
    formData.append("image", image);

    const response = await apiClient.put(`/items/${itemId}/image`, formData);
    return response.data as ClosetItem;
  },

  deleteItemImage: async (itemId: string) => {
    const response = await apiClient.delete(`/items/${itemId}/image`);
    return response.data as { message: string };
  },

  getItemImageBlobUrl: async (itemId: string) => {
    const response = await apiClient.get(`/items/${itemId}/image`, {
      responseType: "blob",
    });
    return URL.createObjectURL(response.data as Blob);
  },

  // 5. 服の削除 (DELETE /items/{item_id})
  deleteItem: async (itemId: string) => {
    const response = await apiClient.delete(`/items/${itemId}`);
    return response.data as { message: string };
  },
};
