"""Q6 점수 기반 가중 선호확률 계산 (예측·실제 동일 척도)."""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

from ml_expansion_analysis import get_feature_columns, make_pipeline, to_likert


def q6_to_prob_pct(q6_scores: np.ndarray | pd.Series) -> np.ndarray:
    """Q6 점수(1~5)를 선호확률(%)로 환산."""
    return np.clip(np.asarray(q6_scores, dtype=float), 1, 5) / 5 * 100


def build_weighted_result(
    df: pd.DataFrame,
    features: pd.DataFrame,
    targets: pd.DataFrame,
    *,
    exclude_age: str | None = "10대",
    include_occupations: list[str] | None = None,
    exclude_occupations: list[str] | None = None,
    fit_scope: str = "filtered",
) -> tuple[pd.DataFrame, list[str]]:
    """가중 선호확률 프레임 생성.

    fit_scope:
      - "filtered": 필터 적용 후 남은 표본으로 학습·예측
      - "all": 필터 전 전체(연령 제외만)로 학습, 필터된 표본에 예측
    """
    cat_cols, num_cols = get_feature_columns(use_behavioral=True)
    feat_cols = cat_cols + num_cols

    base_mask = pd.Series(True, index=features.index)
    if exclude_age:
        base_mask &= features["age_group"] != exclude_age

    train_features = features.loc[base_mask].copy()
    train_targets = targets.loc[base_mask].copy()
    train_df = df.loc[base_mask].copy()

    score_mask = base_mask.copy()
    if include_occupations:
        score_mask &= features["occupation"].isin(include_occupations)
    if exclude_occupations:
        score_mask &= ~features["occupation"].isin(exclude_occupations)

    if fit_scope == "all":
        fit_features, fit_targets, fit_df = train_features, train_targets, train_df
    else:
        fit_features = features.loc[score_mask].copy()
        fit_targets = targets.loc[score_mask].copy()
        fit_df = df.loc[score_mask].copy()

    score_features = features.loc[score_mask].copy()
    score_targets = targets.loc[score_mask].copy()
    score_df = df.loc[score_mask].copy()

    q6_fit = to_likert(fit_df["q6_service_intent"]).astype(float)
    pipe = make_pipeline(
        cat_cols,
        num_cols,
        RandomForestRegressor(n_estimators=200, random_state=42),
    )
    pipe.fit(fit_features[feat_cols], q6_fit)

    q6_actual = to_likert(score_df["q6_service_intent"]).astype(float)
    q6_predicted = np.clip(pipe.predict(score_features[feat_cols]), 1, 5)

    result = score_features[feat_cols].copy()
    result["respondent_id"] = result.index + 1
    result["q6_service_intent"] = q6_actual.values
    result["predicted_q6_score"] = np.round(q6_predicted, 2)
    result["predicted_prob_pct"] = np.round(q6_to_prob_pct(q6_predicted), 2)
    result["actual_prob_pct"] = np.round(q6_to_prob_pct(q6_actual), 2)
    result["predicted_preference"] = (q6_predicted >= 4).astype(int)
    result["actual_preference"] = score_targets["service_preference"].values
    return result, feat_cols
