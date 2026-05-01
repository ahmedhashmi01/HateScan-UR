# Beyond Binary: Fine-Grained Cyberbullying Detection (Roman Urdu)

This project trains classical machine learning models for **multi-class hate/cyberbullying detection** on Roman Urdu social media text.

## Data

Place these CSVs in the project root:

- `train_final.csv` (columns: `text`, `label`, `label_name`)
- `val_final.csv`
- `test_final.csv`

Labels:

- 0: Abusive/Offensive
- 1: Normal
- 2: Religious Hate
- 3: Sexism
- 4: Profane/Untargeted

## Setup (Python 3.10)

Install dependencies:

```bash
pip install -r requirements.txt
```

## Run

```bash
python ml_pipeline.py
```

Outputs are written to `outputs/`:

- `validation_summary.csv` (macro/micro F1 + per-class F1)
- `confusion_matrix_val_*.png` (for each model)
- `validation_reports.txt` and `validation_reports.json`
- `test_report_best_<model_key>.txt`

