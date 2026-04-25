# app/services/outfit.py --- コーディネート生成ロジック ---
def generate_outfit(temp: float, weather: str) -> str:
    if weather == "rain":
        return "防水ジャケット + スニーカーがおすすめです"

    if temp >= 25:
        return "Tシャツ + ショートパンツがおすすめです"
    elif temp >= 18:
        return "長袖シャツ + デニムがちょうどいいです"
    elif temp >= 10:
        return "ニット + コートで暖かくしましょう"
    else:
        return "ダウンジャケット必須です"