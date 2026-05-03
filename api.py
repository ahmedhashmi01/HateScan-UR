from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib, shap, re, emoji, numpy as np
from scipy.sparse import hstack

app = Flask(__name__)
CORS(app)

print("Loading models...")
word  = joblib.load("tfidf_word.pkl")
char  = joblib.load("tfidf_char.pkl")
model = joblib.load("xgb_model.pkl")
explainer  = shap.TreeExplainer(model)
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

@app.route("/api/classify", methods=["POST"])
def classify():
    text = request.get_json().get("text", "")
    if not text.strip():
        return jsonify({"error": "empty text"}), 400
    X, _ = get_features(text)
    predicted = int(model.predict(X)[0])
    proba     = model.predict_proba(X)[0].tolist()
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

        print("SHAP type:", type(shap_values))
        print("SHAP array shape:", np.array(shap_values).shape)

        # New XGBoost returns shape (1, n_features, n_classes)
        sv = np.array(shap_values)
        if sv.ndim == 3:
            # shape: (n_samples, n_features, n_classes)
            class_shap = sv[0, :, predicted]
        elif sv.ndim == 2:
            # shape: (n_samples, n_features) — binary only
            class_shap = sv[0, :]
        else:
            # list of arrays — old format
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

        word_shap.sort(key=lambda x: x["shap"], reverse=True)
        top_positive = word_shap[:5]
        top_negative = sorted(word_shap, key=lambda x: x["shap"])[:3]

        return jsonify({
            "predicted": predicted,
            "label": LABELS[predicted],
            "top_words": top_positive,
            "contrast_words": top_negative,
            "cleaned_text": cleaned
        })

    except Exception as e:
        print("EXPLAIN ERROR:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=5000, debug=True)