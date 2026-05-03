from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib, shap, re, emoji, numpy as np, sqlite3, os
from scipy.sparse import hstack
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ── Database setup ──────────────────────────────────────────────────
DB_PATH = "analytics.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS classifications (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            text      TEXT NOT NULL,
            predicted INTEGER NOT NULL,
            label     TEXT NOT NULL,
            confidence REAL NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def log_classification(text, predicted, label, confidence):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO classifications (text, predicted, label, confidence, timestamp) VALUES (?,?,?,?,?)",
        (text, predicted, label, confidence, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

init_db()

# ── Load models ─────────────────────────────────────────────────────
print("Loading models...")
word      = joblib.load("tfidf_word.pkl")
char      = joblib.load("tfidf_char.pkl")
model     = joblib.load("xgb_model.pkl")
explainer = shap.TreeExplainer(model)
word_vocab = {v: k for k, v in word.vocabulary_.items()}
char_vocab = {v: k for k, v in char.vocabulary_.items()}
print("Models loaded.")

LABELS = {
    0: "Abusive/Offensive",
    1: "Normal",
    2: "Religious Hate",
    3: "Sexism",
    4: "Profane/Untargeted"
}

LABEL_COLORS = {
    0: "#E24B4A",
    1: "#1D9E75",
    2: "#D85A30",
    3: "#7F77DD",
    4: "#BA7517"
}

# ── Helpers ──────────────────────────────────────────────────────────
def preprocess(text):
    text = str(text).lower()
    text = emoji.demojize(text, delimiters=(" ", " "))
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"@\w+", " @user ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def get_features(text):
    cleaned = preprocess(text)
    Xw = word.transform([cleaned])
    Xc = char.transform([cleaned])
    X  = hstack([Xw, Xc]).tocsr()
    return X, cleaned

# ── Routes ───────────────────────────────────────────────────────────
@app.route("/api/classify", methods=["POST"])
def classify():
    text = request.get_json().get("text", "")
    if not text.strip():
        return jsonify({"error": "empty text"}), 400

    X, _ = get_features(text)
    predicted  = int(model.predict(X)[0])
    proba      = model.predict_proba(X)[0].tolist()
    confidence = float(proba[predicted])

    # Log to SQLite
    log_classification(text, predicted, LABELS[predicted], confidence)

    return jsonify({
        "predicted": predicted,
        "label": LABELS[predicted],
        "confidence": proba
    })

@app.route("/api/explain", methods=["POST"])
def explain():
    try:
        data      = request.get_json()
        text      = data.get("text", "")
        predicted = int(data.get("predicted", 0))
        if not text.strip():
            return jsonify({"error": "empty text"}), 400

        X, cleaned = get_features(text)
        shap_values = explainer.shap_values(X)

        sv = np.array(shap_values)
        if sv.ndim == 3:
            class_shap = sv[0, :, predicted]
        elif sv.ndim == 2:
            class_shap = sv[0, :]
        else:
            class_shap = np.array(shap_values[predicted])[0]

        word_size     = len(word.vocabulary_)
        feature_names = (
            [word_vocab.get(i, f"word_{i}") for i in range(word_size)] +
            [char_vocab.get(i, f"char_{i}") for i in range(len(char.vocabulary_))]
        )

        X_dense     = X.toarray()[0]
        nonzero_idx = np.where(X_dense > 0)[0]

        word_shap = []
        for idx in nonzero_idx:
            if idx >= len(feature_names) or idx >= len(class_shap):
                continue
            fname = feature_names[idx]
            sval  = float(class_shap[idx])
            if idx < word_size and not fname.startswith("word_"):
                word_shap.append({"word": fname, "shap": sval})

        word_shap = [w for w in word_shap if abs(w["shap"]) > 0.001]
        word_shap.sort(key=lambda x: x["shap"], reverse=True)
        top_positive = word_shap[:5]
        top_negative = [w for w in sorted(word_shap, key=lambda x: x["shap"]) if w["shap"] < -0.001][:3]

        return jsonify({
            "predicted": predicted,
            "label": LABELS[predicted],
            "top_words": top_positive,
            "contrast_words": top_negative,
            "cleaned_text": cleaned
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/analytics")
def analytics():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Total count
    total = conn.execute("SELECT COUNT(*) as cnt FROM classifications").fetchone()["cnt"]

    # Per class counts
    rows = conn.execute("""
        SELECT predicted, label, COUNT(*) as count,
               AVG(confidence) as avg_confidence
        FROM classifications
        GROUP BY predicted
        ORDER BY predicted
    """).fetchall()

    class_stats = []
    for r in rows:
        class_stats.append({
            "predicted":      r["predicted"],
            "label":          r["label"],
            "count":          r["count"],
            "percentage":     round((r["count"] / total * 100), 1) if total > 0 else 0,
            "avg_confidence": round(r["avg_confidence"] * 100, 1),
            "color":          LABEL_COLORS[r["predicted"]]
        })

    # Recent 10
    recent = conn.execute("""
        SELECT text, predicted, label, confidence, timestamp
        FROM classifications
        ORDER BY id DESC
        LIMIT 10
    """).fetchall()

    recent_list = []
    for r in recent:
        recent_list.append({
            "text":       r["text"][:120] + "..." if len(r["text"]) > 120 else r["text"],
            "predicted":  r["predicted"],
            "label":      r["label"],
            "confidence": round(r["confidence"] * 100, 1),
            "timestamp":  r["timestamp"][:16].replace("T", " "),
            "color":      LABEL_COLORS[r["predicted"]]
        })

    # Most common class
    top = conn.execute("""
        SELECT label, COUNT(*) as cnt FROM classifications
        GROUP BY predicted ORDER BY cnt DESC LIMIT 1
    """).fetchone()

    conn.close()

    return jsonify({
        "total":        total,
        "class_stats":  class_stats,
        "recent":       recent_list,
        "top_class":    top["label"] if top else "N/A",
        "top_count":    top["cnt"]   if top else 0
    })

@app.route("/api/analytics/clear", methods=["POST"])
def clear_analytics():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM classifications")
    conn.commit()
    conn.close()
    return jsonify({"status": "cleared"})

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=5000, debug=True)