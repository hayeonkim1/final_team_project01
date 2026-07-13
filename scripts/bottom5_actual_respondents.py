"""Bottom-K lowest predicted preference profiles from actual respondents (exclude 10대)."""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from ml_expansion_analysis import (  # noqa: E402
    build_features,
    build_targets,
    find_survey_file,
    rename_columns,
)
from preference_prob_utils import build_weighted_result  # noqa: E402

OUTPUT = (
    ROOT / "data" / "survey_analysis" / "ml_results" / "bottom5_feature_combinations_actual.csv"
)
BOTTOM_K = 5
EXCLUDE_AGE = "10대"


def main() -> None:
    raw = pd.read_excel(find_survey_file())
    df = rename_columns(raw)
    features = build_features(df)
    targets = build_targets(df)

    result, feat_cols = build_weighted_result(
        df, features, targets, exclude_age=EXCLUDE_AGE
    )
    result = result.sort_values("predicted_prob_pct", ascending=True).head(BOTTOM_K)
    result = result.reset_index(drop=True)
    result.insert(0, "rank", range(1, BOTTOM_K + 1))

    cols = [
        "rank",
        "respondent_id",
        *feat_cols,
        "predicted_q6_score",
        "predicted_prob_pct",
        "actual_prob_pct",
        "predicted_preference",
        "actual_preference",
        "q6_service_intent",
    ]
    result = result[cols]
    result.to_csv(OUTPUT, index=False, encoding="utf-8-sig")
    print(f"Excluded {EXCLUDE_AGE}: weighted Q6 regression model")
    print(f"Saved: {OUTPUT}")
    print(result.to_string(index=False))


if __name__ == "__main__":
    main()
