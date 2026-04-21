//  Firebase初期化 + 認証

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCEoVYjilkR_gQAuCBOh7zQo4zOC3QTNsc",
  authDomain: "climo-app-c28d9.firebaseapp.com",
  projectId: "climo-app-c28d9",
  storageBucket: "climo-app-c28d9.firebasestorage.app",
  messagingSenderId: "1064125997336",
  appId: "1:1064125997336:web:5fc9497d83a8eb1a5b7e6d",
};

// 初期化
const app = initializeApp(firebaseConfig);

// 認証インスタンス
export const auth = getAuth(app);