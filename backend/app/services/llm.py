# backend/app/services/llm.py
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def generate_response(user_message: str) -> str:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "あなたはファッションコーディネートを提案するアシスタントです"},
            {"role": "user", "content": user_message}
        ],
        temperature=0.7
    )

    return response.choices[0].message.content