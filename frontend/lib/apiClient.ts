import axios from 'axios';

/**
 * 共通のAPIクライアント設定
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * リクエストインターセプター
 * 送信前に毎回 localStorage から最新のトークンを取得してセットする
 */
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * レスポンスインターセプター
 * 401エラー（認証切れ）が発生した際の共通処理
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("認証トークンが無効です。再ログインしてください。");
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('login');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;