"use client";



import { useEffect, useState } from "react";

import { useRouter, usePathname } from "next/navigation";



type Cloth = {

id: number;

name: string;

category: string;

image?: string;

};



export default function ClosetPage() {

const router = useRouter();

const pathname = usePathname();



const [clothes, setClothes] = useState<Cloth[]>([]);



useEffect(() => {

try {

const stored = localStorage.getItem("clothes");

if (stored) setClothes(JSON.parse(stored));

} catch {

localStorage.removeItem("clothes");

}

}, []);



const handleDelete = (id: number) => {

if (!confirm("削除してもよろしいですか？")) return;

const updated = clothes.filter((c) => c.id !== id);

setClothes(updated);

localStorage.setItem("clothes", JSON.stringify(updated));

};



return (

<main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-pink-100">

<div className="w-[360px] h-[640px] bg-white rounded-[40px] shadow-xl flex flex-col overflow-hidden">



{/* ヘッダー */}

<div className="h-[56px] flex items-center justify-center border-b border-gray-200 text-base font-semibold text-gray-700">

👕 クローゼット

</div>



{/* メイン */}

<div className="flex-1 p-3 overflow-y-auto">

<div className="grid grid-cols-2 gap-3">



{clothes.length === 0 && (

<div className="col-span-2 text-center text-gray-400 text-sm mt-6">

🧺 まだ服がありません

</div>

)}



{clothes.map((item) => (

<div

key={item.id}

className="relative bg-white rounded-2xl shadow-md p-3 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition"

>

<button

onClick={() => handleDelete(item.id)}

className="absolute top-2 right-2 text-xs bg-gray-200 w-6 h-6 rounded-full hover:bg-red-400 hover:text-white active:scale-90 transition"

>

✕

</button>



<div className="w-full h-20 bg-gray-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden">

{item.image ? (

<img src={item.image} className="w-full h-full object-cover" />

) : (

"👕"

)}

</div>



<p className="text-sm text-center font-semibold">{item.name}</p>



<div className="text-center mt-1">

<span className="text-xs bg-sky-100 text-sky-600 px-2 py-1 rounded-full">

{item.category}

</span>

</div>

</div>

))}

</div>

</div>



{/* ＋ボタン */}

<div className="flex justify-center mb-2">

<button

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



/* ===== 共通ナビ ===== */

function BottomNav({ pathname, router }: any) {

return (

<div className="h-[64px] border-t border-gray-200 flex justify-around items-center">

<NavBtn icon="🏠" label="ホーム" path="/" {...{ pathname, router }} />

<NavBtn icon="👕" label="クローゼット" path="/closet" {...{ pathname, router }} />

<NavBtn icon="💬" label="チャット" path="/chat" {...{ pathname, router }} />

</div>

);

}



function NavBtn({ icon, label, path, pathname, router }: any) {

const active = pathname === path;



return (

<button

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

