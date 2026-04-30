import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

function parseInfraEnv(envPath: string): Record<string, string> {
  if (!fs.existsSync(envPath)) return {};

  const result: Record<string, string> = {};
  const content = fs.readFileSync(envPath, "utf-8");
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIdx = line.indexOf("=");
    if (eqIdx <= 0) continue;

    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();

    const commentIdx = value.indexOf(" #");
    if (commentIdx >= 0) {
      value = value.slice(0, commentIdx).trim();
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function loadSharedFirebaseConfig() {
  const repoRoot = path.resolve(process.cwd(), "..");
  const serviceAccountPath = path.join(
    repoRoot,
    ".secrets",
    "firebase",
    "serviceAccountKey.json",
  );
  const infraEnvPath = path.join(repoRoot, "infra", ".env");

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      `Missing Firebase service account file: ${serviceAccountPath}`,
    );
  }

  const serviceAccountRaw = fs.readFileSync(serviceAccountPath, "utf-8");
  const serviceAccount = JSON.parse(serviceAccountRaw) as {
    project_id?: string;
  };
  const infraEnv = parseInfraEnv(infraEnvPath);

  const projectId = serviceAccount.project_id;
  if (!projectId) {
    throw new Error("serviceAccountKey.json does not include project_id");
  }

  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_WEB_API_KEY ||
    infraEnv.FIREBASE_WEB_API_KEY ||
    "";
  if (!apiKey) {
    throw new Error(
      "Firebase Web API key is missing. Set NEXT_PUBLIC_FIREBASE_API_KEY or FIREBASE_WEB_API_KEY.",
    );
  }

  return {
    projectId,
    apiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    storageBucket: `${projectId}.appspot.com`,
  };
}

const firebase = loadSharedFirebaseConfig();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebase.projectId,
    NEXT_PUBLIC_FIREBASE_API_KEY: firebase.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebase.authDomain,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: firebase.storageBucket,
  },
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