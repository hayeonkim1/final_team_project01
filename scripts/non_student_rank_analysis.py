"""비대학생 세그먼트 확장 가능성: 상·하위 Top5 + 직업별 요약."""
from __future__ import annotations

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

TOP_K = 5
EXCLUDE_OCCUPATION = "대학생"
RESULT_COLS = [
    "rank",
    "respondent_id",
    "gender",
    "age_group",
    "occupation",
    "housing_type",
    "move_frequency",
    "storage_need_score",
    "pain_score",
    "trust_score",
    "has_rental_experience",
    "consignment_positive",
    "is_single_household",
    "pain_transport",
    "pain_space",
    "pain_cost",
    "predicted_q6_score",
    "predicted_prob_pct",
    "actual_prob_pct",
    "predicted_preference",
    "actual_preference",
    "q6_service_intent",
]


def save_ranked(df: pd.DataFrame, path: Path, ascending: bool, k: int) -> pd.DataFrame:
    out = df.sort_values("predicted_prob_pct", ascending=ascending).head(k).copy()
    out = out.reset_index(drop=True)
    out.insert(0, "rank", range(1, len(out) + 1))
    out[RESULT_COLS].to_csv(path, index=False, encoding="utf-8-sig")
    return out


def occupation_summary(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for occ, grp in df.groupby("occupation", sort=False):
        rows.append(
            {
                "occupation": occ,
                "n": len(grp),
                "avg_predicted_prob_pct": round(grp["predicted_prob_pct"].mean(), 2),
                "avg_actual_prob_pct": round(grp["actual_prob_pct"].mean(), 2),
                "preference_rate_binary": round(grp["actual_preference"].mean() * 100, 2),
                "avg_predicted_q6": round(grp["predicted_q6_score"].mean(), 2),
                "avg_actual_q6": round(grp["q6_service_intent"].mean(), 2),
            }
        )
    summary = pd.DataFrame(rows).sort_values(
        "avg_predicted_prob_pct", ascending=False
    )
    summary.insert(0, "expansion_rank", range(1, len(summary) + 1))
    return summary


def main() -> None:
    raw = pd.read_excel(find_survey_file())
    df = rename_columns(raw)
    features = build_features(df)
    targets = build_targets(df)

    # 전체(10대 제외)로 학습 → 비대학생만 스코어링
    result, _ = build_weighted_result(
        df,
        features,
        targets,
        exclude_age="10대",
        exclude_occupations=[EXCLUDE_OCCUPATION],
        fit_scope="all",
    )

    top5 = save_ranked(
        result,
        OUTPUT_DIR / "top5_feature_combinations_non_student.csv",
        ascending=False,
        k=TOP_K,
    )
    bottom5 = save_ranked(
        result,
        OUTPUT_DIR / "bottom5_feature_combinations_non_student.csv",
        ascending=True,
        k=TOP_K,
    )
    summary = occupation_summary(result)
    summary.to_csv(
        OUTPUT_DIR / "non_student_occupation_expansion_summary.csv",
        index=False,
        encoding="utf-8-sig",
    )

    print(f"Non-student respondents (excl. 10대): n={len(result)}")
    print(f"Model: trained on all respondents (excl. 10대), scored on non-students")
    print("\n=== 직업별 확장 가능성 순위 ===")
    print(summary.to_string(index=False))
    print("\n=== Top 5 (비대학생) ===")
    print(top5[RESULT_COLS].to_string(index=False))
    print("\n=== Bottom 5 (비대학생) ===")
    print(bottom5[RESULT_COLS].to_string(index=False))


if __name__ == "__main__":
    main()
