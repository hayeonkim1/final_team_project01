"""5개 feature 값 조합별 평균 선호확률 상·하위 Top5 분석."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
OUTPUT_DIR = ROOT / "data" / "survey_analysis" / "ml_results"

from ml_expansion_analysis import (  # noqa: E402
    build_features,
    build_targets,
    find_survey_file,
    rename_columns,
)
from preference_prob_utils import build_weighted_result  # noqa: E402

# 조합에 사용할 feature 5개 (RF importance + STP 해석력)
COMBO_FEATURES = [
    "occupation",
    "housing_type",
    "is_single_household",
    "pain_score",
    "trust_score",
]

TOP_K = 5
MIN_GROUP_N = 2


def aggregate_combo_means(result: pd.DataFrame, combo_features: list[str]) -> pd.DataFrame:
    grouped = (
        result.groupby(combo_features, dropna=False)
        .agg(
            n=("predicted_prob_pct", "size"),
            avg_predicted_prob_pct=("predicted_prob_pct", "mean"),
            avg_actual_prob_pct=("actual_prob_pct", "mean"),
            avg_predicted_q6=("predicted_q6_score", "mean"),
            avg_actual_q6=("q6_service_intent", "mean"),
        )
        .reset_index()
    )
    grouped = grouped[grouped["n"] >= MIN_GROUP_N].copy()
    grouped["avg_predicted_prob_pct"] = grouped["avg_predicted_prob_pct"].round(2)
    grouped["avg_actual_prob_pct"] = grouped["avg_actual_prob_pct"].round(2)
    grouped["avg_predicted_q6"] = grouped["avg_predicted_q6"].round(2)
    grouped["avg_actual_q6"] = grouped["avg_actual_q6"].round(2)
    grouped["combo_label"] = grouped.apply(
        lambda r: " | ".join(f"{c}={r[c]}" for c in combo_features),
        axis=1,
    )
    return grouped


def save_ranked(
    grouped: pd.DataFrame,
    combo_features: list[str],
    path: Path,
    ascending: bool,
    k: int,
) -> pd.DataFrame:
    out = grouped.sort_values("avg_predicted_prob_pct", ascending=ascending).head(k).copy()
    out = out.reset_index(drop=True)
    out.insert(0, "rank", range(1, len(out) + 1))
    cols = [
        "rank",
        "combo_label",
        *combo_features,
        "n",
        "avg_predicted_prob_pct",
        "avg_actual_prob_pct",
        "avg_predicted_q6",
        "avg_actual_q6",
    ]
    out[cols].to_csv(path, index=False, encoding="utf-8-sig")
    return out[cols]


def run_analysis(
    *,
    label: str,
    exclude_occupations: list[str] | None = None,
    fit_scope: str = "all",
) -> tuple[pd.DataFrame, pd.DataFrame]:
    raw = pd.read_excel(find_survey_file())
    df = rename_columns(raw)
    features = build_features(df)
    targets = build_targets(df)

    result, _ = build_weighted_result(
        df,
        features,
        targets,
        exclude_age="10대",
        exclude_occupations=exclude_occupations,
        fit_scope=fit_scope,
    )
    grouped = aggregate_combo_means(result, COMBO_FEATURES)

    suffix = label
    top = save_ranked(
        grouped,
        COMBO_FEATURES,
        OUTPUT_DIR / f"top5_feature_combo_means_{suffix}.csv",
        ascending=False,
        k=TOP_K,
    )
    bottom = save_ranked(
        grouped,
        COMBO_FEATURES,
        OUTPUT_DIR / f"bottom5_feature_combo_means_{suffix}.csv",
        ascending=True,
        k=TOP_K,
    )
    grouped.to_csv(
        OUTPUT_DIR / f"all_feature_combo_means_{suffix}.csv",
        index=False,
        encoding="utf-8-sig",
    )
    return top, bottom


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--scope",
        choices=["all", "non_student"],
        default="non_student",
        help="all: 10대 제외 전체 / non_student: 비대학생만",
    )
    args = parser.parse_args()

    print(f"Combo features ({len(COMBO_FEATURES)}): {', '.join(COMBO_FEATURES)}")
    print(f"Min group size: n>={MIN_GROUP_N}")
    print(f"Metric: group mean of weighted Q6 prob (predicted & actual)\n")

    if args.scope == "all":
        top, bottom = run_analysis(label="all", fit_scope="filtered")
        print(f"Population: all respondents excl. 10대")
    else:
        top, bottom = run_analysis(
            label="non_student",
            exclude_occupations=["대학생"],
            fit_scope="all",
        )
        print("Population: non-students (model trained on all excl. 10대)")

    print("\n=== Top 5 feature combos (highest avg predicted prob) ===")
    print(top.to_string(index=False))
    print("\n=== Bottom 5 feature combos (lowest avg predicted prob) ===")
    print(bottom.to_string(index=False))


if __name__ == "__main__":
    main()
