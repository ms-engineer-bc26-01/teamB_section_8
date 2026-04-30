import axios from 'axios';

/**
 * 共通のAPIクライアント設定
 * 
 * 注意: CORSエラーを回避するため、直接バックエンド(8000番)を叩かず、
 * Next.jsのRewrites機能を利用して /api-proxy 経由でリクエストを送ります。
 */
const apiClient = axios.create({
  // ✅ 修正: next.config.ts で設定したプロキシパスを使用
  baseURL: '/api-proxy', 
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * リクエストインターセプター
 * 送信前に毎回 localStorage から最新の認証トークンを取得してヘッダーにセットする
 */
apiClient.interceptors.request.use(
  (config) => {
    // クライアントサイド（ブラウザ）でのみ実行
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        // Firebaseの認証トークンをBearerスキームで付与
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
 * 401エラー（認証切れ）が発生した際の共通エラーハンドリング
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 認証エラー（401 Unauthorized）の場合、自動的にログイン画面へリダイレクト
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