# 짐토리 ML Feature Engineering 및 확장 가능성 분석 계획

> **목적:** User Research(106명)를 활용해 서비스 선호도(Y/N)를 학습하고, 메인타겟(대학생·기숙사생) 외 세그먼트의 사업 확장 가능성을 검증  
> **데이터:** `주거 공백기 짐보관_대여 서비스 설문 조사(응답).xlsx`  
> **실행:** `py scripts/ml_expansion_analysis.py`

---

## 1. 분석 배경 및 가설 연결

| 기존 가설 | ML에서의 역할 |
|-----------|---------------|
| H1 주거 공백기 페인 | `storage_need_score`, `pain_score`, `move_frequency` |
| H2~H3 위탁대여·지불의향 | `consignment_positive`, `service_preference` (타깃) |
| H4 플랫폼 신뢰 | `trust_score` |
| H5 외부 대여 니즈 | `has_rental_experience` |
| H6 기숙사생·이동 시기 | `occupation`, `move_frequency`, `segment_stp` |

**핵심 질문**
1. 어떤 유저 feature 조합이 서비스 **선호(Y)** 와 연결되는가?
2. **대학생이 아닌** 직장인·프리랜서·취준생도 동일한 전환 패턴을 보이는가?

---

## 2. 타깃 변수 (Y) 정의

설문 Q6 「필요한 기간 동안 짐 보관 서비스를 이용할 의향」을 기준으로 이진화합니다.

| 변수명 | 정의 | 용도 |
|--------|------|------|
| **`service_preference`** (주 타깃) | Q6 ≥ 4점 → **1 (선호)**, 그 외 → 0 | 메인 분류 모델 |
| `service_strong_preference` | Q6 = 5점 → 1 | 강한 전환 의향 분석 |
| `composite_fit` | Q2 ≥ 4 **AND** Q6 ≥ 4 → 1 | 니즈+의향 복합 적합도 |

> 실측 기준: `service_preference` 양성 비율 ≈ **87.7%** (93/106명)

---

## 3. Feature Engineering 설계

### 3.1 인구통계 Feature (요청 항목)

| 원본 컬럼 | Feature | 인코딩 | 비고 |
|-----------|---------|--------|------|
| 성별 | `gender` | One-Hot | 남/여 |
| 연령대 | `age_group` | One-Hot | 10·20·30·40·50대+ |
| 직업 | `occupation` | One-Hot | **세그먼트 확장 핵심 축** |
| 가구형태 | `housing_type` | One-Hot | 1~4인 가구 |

### 3.2 추가 Behavioral Feature (최소 6개)

인구통계만으로는 「주거 노마드」 특성이 드러나지 않아, **행동·니즈 지표**를 최소한으로 추가합니다.

| Feature | 원본 | 변환 | 선정 이유 |
|---------|------|------|-----------|
| `move_frequency` | Q1 이동 횟수 | 0~4 서열 | 시즌성 이동 = 핵심 페르소나 |
| `storage_need_score` | Q2 보관 필요 | 1~5 리커트 | 수요 강도 (크롤링 H1 검증과 연결) |
| `pain_score` | Q4 불편 정도 | 1~5 리커트 | 페인 강도 → 전환 동기 |
| `trust_score` | Q8 플랫폼 신뢰 | 1~5 리커트 | H4 신뢰 장벽 |
| `has_rental_experience` | 대여 경험 | 0/1 | H5 외부 대여 수요 |
| `consignment_positive` | 위탁 참여 의향 | 0/1 | H2 수익형 모델 적합도 |
| `is_single_household` | 1인 가구 여부 | 0/1 | 주거 공백기와 상관 |
| `pain_transport/space/cost` | Q5 복수선택 | 0/1 each | Logistics 페인 (USER RESEARCH 1위) |

> **의도적으로 제외:** Q3 처리방법, Q7 중요요소, Q9 신뢰요소 → 고차원·다중선택으로 과적합 위험

### 3.3 세그먼트 라벨 (분석용, 모델 입력 X)

| 변수 | 정의 |
|------|------|
| `segment_main` | `main_student`(대학생) vs `expansion_non_student` |
| `segment_stp` | STP A/B/C + expansion (취준생, 기타) |

---

## 4. 모델링 전략

### 4.1 알고리즘

| 모델 | 선택 이유 |
|------|-----------|
| **Logistic Regression** | 계수 해석 → feature별 선호 방향 설명 |
| **Random Forest** | 비선형·상호작용 포착, Feature Importance |

### 4.2 검증 방법

- **Stratified 5-Fold CV** (n=106, 클래스 불균형 대응)
- 지표: Accuracy, F1, ROC-AUC
- **Baseline:** 인구통계 4개만 사용한 모델 vs 행동 feature 포함 모델 비교

### 4.3 확장 가능성 검증 (2단계)

**Step 1 — 실측 세그먼트 비교**
- 직업·STP 세그먼트별 `preference_rate` 산출
- 메인(대학생) vs 확장(비대학생) 평균 비교

**Step 2 — ML 예측 시뮬레이션**
- 전체 데이터로 RF 학습
- STP B/C 및 expansion 프로필에 대해 `predicted_preference_prob` 산출
- **대학생만**으로 학습한 모델 → 비대학생 응답자에 대한 예측 (전이 가능성)

---

## 5. 확장 프로필 시나리오 (시뮬레이션)

| 프로필 | STP | 가정 |
|--------|-----|------|
| A_20대_대학생_1인가구 | 메인 | 현재 타겟 베이스라인 |
| B_30대_프리랜서_1인가구 | 계절근로 | 이동·장비 보관 |
| C_30대_직장인_1인가구 | 장기출장 | 파견·프로젝트 이동 |
| expansion_취준생 | 확장 | 이사·면접 시즌 |
| expansion_40대_직장인_4인가구 | 소극 | 낮은 니즈 가정 |

---

## 6. 산출물

| 파일 | 내용 |
|------|------|
| `data/survey_analysis/ml_feature_matrix.csv` | Feature + Target 매트릭스 |
| `data/survey_analysis/ml_results/segment_summary.csv` | 세그먼트별 선호율 |
| `data/survey_analysis/ml_results/logistic_coefficients.csv` | 로지스틱 계수 |
| `data/survey_analysis/ml_results/rf_feature_importance.csv` | RF 중요도 |
| `data/survey_analysis/ml_results/expansion_profile_predictions.csv` | 확장 프로필 예측 |
| `data/survey_analysis/ml_results/non_student_predictions.csv` | 비대학생 실측 vs 예측 |
| `data/survey_analysis/ml_results/analysis_report.md` | 요약 리포트 |
| `data/survey_analysis/ml_results/*.png` | 시각화 |

---

## 7. 해석 시 주의사항

1. **표본 크기 n=106** → 절대 확률보다 **세그먼트 간 상대 순위** 중심 해석
2. 설문은 **편의 표집** → 대표성 한계, 추후 Meta Ads·GA4 행동 데이터로 보강
3. 선호율 87%로 **클래스 불균형** → `class_weight=balanced` 적용
4. 인구통계만으로 AUC가 낮고 행동 feature 추가 시 상승 → **「누가」보다 「어떤 상황」** 이 중요

---

## 8. 다음 단계 (사업 계획 연결)

| 단계 | 액션 |
|------|------|
| 단기 | 직장인·취준생 대상 소규모 랜딩 A/B (메시지: 문 앞 픽업 + 보관료 상쇄) |
| 중기 | 크롤링 시즌성(6월·2월) + 설문 segment 결합 → 캠페인 타이밍 최적화 |
| 장기 | GA4 이벤트(픽업신청, 위탁동의)를 Y로 대체 → 실전환 예측 모델 고도화 |

---

## 9. 실행 방법

```powershell
# 1. 패키지 설치 (최초 1회)
py -m pip install pandas openpyxl scikit-learn matplotlib

# 2. 분석 실행
py scripts/ml_expansion_analysis.py

# 3. 결과 확인
# data/survey_analysis/ml_results/analysis_report.md
```

---

*본 계획은 Notion 자료조사·USER RESEARCH·가설 H1~H6 및 `database/docs/DATA_MODEL.md`의 `user_research_responses` 스키마와 정합되도록 설계되었습니다.*
