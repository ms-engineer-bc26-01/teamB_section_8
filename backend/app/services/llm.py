# backend/app/services/llm.py

import os
from openai import OpenAI
from dotenv import load_dotenv
from app.prompts.stylist_prompt import SYSTEM_PROMPT

# .env 読み込み
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_response(user_message: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.6,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ]
        )
        return response.choices[0].message.content

    except Exception as e:
        # デバッグしやすくする
        print("OpenAI API Error:", e)
        return "エラーが発生しました。しばらくしてから再試行してください。"