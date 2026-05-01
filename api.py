from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib, re, emoji
from scipy.sparse import hstack
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)
CORS(app)

print("Loading models...")
word = joblib.load("tfidf_word.pkl")
char = joblib.load("tfidf_char.pkl")
model = joblib.load("xgb_model.pkl")
print("Models loaded.")

LABELS = {
    0: "Abusive/Offensive",
    1: "Normal",
    2: "Religious Hate",
    3: "Sexism",
    4: "Profane/Untargeted"
}

def preprocess(text):
    text = str(text).lower()
    text = emoji.demojize(text, delimiters=(" ", " "))
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"@\w+", " @user ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

@app.route("/api/classify", methods=["POST"])
def classify():
    data = request.get_json()
    text = data.get("text", "")
    if not text.strip():
        return jsonify({"error": "empty text"}), 400

    cleaned = preprocess(text)
    Xw = word.transform([cleaned])
    Xc = char.transform([cleaned])
    X  = hstack([Xw, Xc]).tocsr()

    predicted = int(model.predict(X)[0])
    proba     = model.predict_proba(X)[0].tolist()

    return jsonify({
        "predicted": predicted,
        "label": LABELS[predicted],
        "confidence": proba
    })

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
    