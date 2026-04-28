import apiClient from "./apiClient";

/**
 * クローゼット関連のAPIリクエスト
 */
export const itemService = {
  // 1. 服の一覧取得 (GET /items)
  getAllItems: async () => {
    const response = await apiClient.get("/items");
    return response.data;
  },

  // 2. 新しい服の登録 (POST /items)
  createItem: async (itemData: {
    name: string;
    category: string;
    color: string;
    season: string;
    image_url?: string;
  }) => {
    const response = await apiClient.post("/items", itemData);
    return response.data;
  },

  // 3. 特定の服の取得 (GET /items/{item_id})
  getItemById: async (itemId: string) => {
    const response = await apiClient.get(`/items/${itemId}`);
    return response.data;
  },

  // 4. 衣服情報の更新 (PUT /items/{item_id})
  updateItem: async (itemId: string, updateData: any) => {
    const response = await apiClient.put(`/items/${itemId}`, updateData);
    return response.data;
  },

  // 5. 服の削除 (DELETE /items/{item_id})
  deleteItem: async (itemId: string) => {
    const response = await apiClient.delete(`/items/${itemId}`);
    return response.data;
  },
};