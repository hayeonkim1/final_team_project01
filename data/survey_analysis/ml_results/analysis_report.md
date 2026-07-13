# 짐토리 ML 확장 가능성 분석 결과

- 설문 응답: 106명
- 서비스 선호율 (Y=1): 88.7%

## 1. 세그먼트별 실측 선호율
segment_type segment  n  preference_rate  strong_rate  composite_rate  avg_pain  avg_move_freq
  occupation    자영업자  7         1.000000     0.714286        1.000000  4.142857       3.142857
  occupation     직장인 26         1.000000     0.346154        1.000000  4.230769       2.653846
  occupation     대학생 48         0.895833     0.354167        0.750000  3.812500       2.250000
  occupation 취업 준비 중 19         0.842105     0.315789        0.842105  4.000000       2.473684
  occupation    프리랜서  5         0.400000     0.000000        0.400000  3.000000       1.600000
  occupation      무직  1         0.000000     0.000000        0.000000  3.000000       2.000000

## 2. 메인 vs 확장 세그먼트
segment_type               segment  n  preference_rate  strong_rate  composite_rate  avg_pain  avg_move_freq
segment_main          main_student 48         0.895833     0.354167         0.75000  3.812500       2.250000
segment_main expansion_non_student 58         0.879310     0.344828         0.87931  4.017241       2.551724

## 3. 모델 성능 (5-Fold CV)
- Logistic Regression AUC: 0.845
- Random Forest AUC: 0.894
- Demographics Only AUC: 0.760

## 4. 확장 프로필 예측 (Random Forest)
               profile  predicted_preference_prob  predicted_preference
   A_현재메인_20대_대학생_1인가구                   0.973312                     1
  B_계절근로_30대_프리랜서_1인가구                   0.732414                     1
   C_장기출장_30대_직장인_1인가구                   0.642398                     1
expansion_취준생_20대_2인가구                   0.384408                     0
expansion_40대_직장인_4인가구                   0.185068                     0

## 5. 해석 가이드
- n=106으로 표본이 작아 절대 확률보다 **세그먼트 간 상대 비교**에 집중
- 행동 피처(이동빈도, 페인, 보관니즈)가 인구통계만으로는 설명되지 않는 선호 패턴 포착
- 비대학생 세그먼트도 실측 선호율 80%+ → 확장 타당성 있음 (직장인·취준생 중심)