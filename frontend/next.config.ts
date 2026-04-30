import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        // "/api-proxy/" で始まるリクエストを検知
        source: '/api-proxy/:path*',
        // バックエンドの実際のサーバー（8000番ポート）に転送
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
};

export default nextConfig;