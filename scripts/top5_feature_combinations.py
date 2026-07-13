"""Find top-K feature combinations by predicted preference (streaming grid search)."""
from __future__ import annotations

import heapq
import sys
from itertools import product
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from ml_expansion_analysis import (  # noqa: E402
    build_features,
    build_targets,
    find_survey_file,
    get_feature_columns,
    make_pipeline,
    rename_columns,
)

OUTPUT = ROOT / "data" / "survey_analysis" / "ml_results" / "top5_feature_combinations.csv"
TOP_K = 5
BATCH_SIZE = 100_000


def main() -> None:
    raw = pd.read_excel(find_survey_file())
    df = rename_columns(raw)
    features = build_features(df)
    targets = build_targets(df)
    cat_cols, num_cols = get_feature_columns(use_behavioral=True)
    feat_cols = cat_cols + num_cols

    pipe = make_pipeline(
        cat_cols,
        num_cols,
        RandomForestClassifier(
            n_estimators=200, random_state=42, class_weight="balanced"
        ),
    )
    pipe.fit(features[feat_cols], targets["service_preference"])

    cat_domains = {c: sorted(features[c].dropna().unique().tolist()) for c in cat_cols}
    num_domains = {
        "move_frequency": [0, 1, 2, 3, 4],
        "storage_need_score": [1, 2, 3, 4, 5],
        "pain_score": [1, 2, 3, 4, 5],
        "trust_score": [1, 2, 3, 4, 5],
        "has_rental_experience": [0, 1],
        "consignment_positive": [0, 1],
        "is_single_household": [0, 1],
        "pain_transport": [0, 1],
        "pain_space": [0, 1],
        "pain_cost": [0, 1],
    }

    keys = cat_cols + num_cols
    domains = [cat_domains[c] for c in cat_cols] + [num_domains[c] for c in num_cols]
    grid_size = int(np.prod([len(d) for d in domains]))
    print(f"Grid size: {grid_size:,}", flush=True)

    # min-heap of (prob, counter, row_dict) — keep K highest probs
    heap: list[tuple[float, int, dict]] = []
    counter = 0
    batch: list[dict] = []

    def flush_batch() -> None:
        nonlocal counter
        if not batch:
            return
        Xb = pd.DataFrame(batch)
        proba = pipe.predict_proba(Xb)[:, 1]
        for row, p in zip(batch, proba):
            item = (float(p), counter, row)
            counter += 1
            if len(heap) < TOP_K:
                heapq.heappush(heap, item)
            elif p > heap[0][0]:
                heapq.heapreplace(heap, item)
        batch.clear()

    processed = 0
    for combo in product(*domains):
        batch.append(dict(zip(keys, combo)))
        processed += 1
        if len(batch) >= BATCH_SIZE:
            flush_batch()
            if processed % 500_000 == 0:
                print(f"processed {processed:,}", flush=True)

    flush_batch()

    top = sorted(heap, key=lambda x: x[0], reverse=True)
    rows = []
    for rank, (prob, _, row) in enumerate(top, start=1):
        out = {"rank": rank, **row}
        out["predicted_preference_prob"] = prob
        out["prob_pct"] = round(prob * 100, 2)
        out["predicted_preference"] = int(prob >= 0.5)
        rows.append(out)

    result = pd.DataFrame(rows)
    cols = ["rank"] + feat_cols + ["prob_pct", "predicted_preference"]
    result = result[cols]
    result.to_csv(OUTPUT, index=False, encoding="utf-8-sig")
    print(f"Saved: {OUTPUT}", flush=True)
    print(result.to_string(index=False), flush=True)


if __name__ == "__main__":
    main()
