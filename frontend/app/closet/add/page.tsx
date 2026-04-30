"use client";



import { useState } from "react";

import { useRouter } from "next/navigation";



export default function AddClothesPage() {

const router = useRouter();



const [name, setName] = useState("");

const [category, setCategory] = useState("トップス");

const [image, setImage] = useState<string | null>(null);

const [loading, setLoading] = useState(false);



// 画像アップロード（サイズ制限あり）

const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {

const file = e.target.files?.[0];

if (!file) return;



if (file.size > 2 * 1024 * 1024) {

alert("画像は2MB以下にしてください");

return;

}



const reader = new FileReader();



reader.onloadend = () => {

const base64 = reader.result as string;

setImage(base64);

};



reader.readAsDataURL(file);

};



// 保存処理（エラーハンドリング付き）

const handleSave = () => {

if (!name || loading) return;



setLoading(true);



let clothes = [];



try {

const stored = localStorage.getItem("clothes");

clothes = stored ? JSON.parse(stored) : [];

} catch {

localStorage.removeItem("clothes");

}



const newItem = {

id: Date.now(),

name,

category,

image,

};



const updated = [newItem, ...clothes];

localStorage.setItem("clothes", JSON.stringify(updated));



setTimeout(() => {

router.push("/closet");

}, 300);

};



return (

<main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100">



<div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl p-6 flex flex-col justify-between">



<div>



<div className="text-center mb-6">

<h1 className="text-xl font-bold">➕ 服を追加</h1>

<p className="text-sm text-gray-500">

新しいアイテムを登録

</p>

</div>



<div className="space-y-4">



{/* 画像 */}

<label className="block">

<div className="

w-full h-32 bg-gray-100 rounded-xl

flex items-center justify-center

cursor-pointer overflow-hidden shadow-inner

transition-all duration-200 ease-out

hover:scale-[1.02] hover:shadow-md

">

{image ? (

<img

src={image}

alt="preview"

className="w-full h-full object-cover"

/>

) : (

<span className="text-gray-400">

📷 画像を追加（タップ）

</span>

)}

</div>



<input

type="file"

accept="image/*"

className="hidden"

onChange={handleImageUpload}

/>

</label>



{/* 名前 */}

<input

type="text"

placeholder="例：白Tシャツ"

value={name}

onChange={(e) => setName(e.target.value)}

className="

w-full p-3 rounded-xl bg-gray-100

focus:outline-none focus:ring-2 focus:ring-sky-300

"

/>



{/* カテゴリ */}

<select

value={category}

onChange={(e) => setCategory(e.target.value)}

className="

w-full p-3 rounded-xl bg-gray-100

focus:outline-none focus:ring-2 focus:ring-pink-300

"

>

<option>トップス</option>

<option>ボトムス</option>

<option>アウター</option>

<option>シューズ</option>

</select>



</div>



</div>



{/* ボタン */}

<div className="flex gap-3">



<button

onClick={() => router.back()}

className="

flex-1 bg-gray-100 py-3 rounded-xl

hover:bg-gray-200 active:scale-95

"

>

戻る

</button>



<button

onClick={handleSave}

disabled={loading}

className="

flex-1

bg-gradient-to-r from-sky-400 to-pink-400 text-white

py-3 rounded-xl shadow-md

hover:shadow-lg active:scale-95

disabled:opacity-50

"

>

{loading ? "保存中..." : "保存"}

</button>



</div>



</div>

</main>

);

}