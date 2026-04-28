import axios from 'axios';

/**
 * API通信用の共通クライアント設定
 * バックエンド（FastAPI）との接続を管理します
 */
const apiClient = axios.create({
  // 環境変数からAPIのベースURLを取得、未設定の場合はローカルの8000番を使用
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * リクエストインターセプター
 * 送信前にローカルストレージからトークンを取得し、Headerに付与します
 */
apiClient.interceptors.request.use((config) => {
  // クライアントサイド（ブラウザ）での実行時のみlocalStorageを確認
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;