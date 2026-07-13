# 짐토리 세그먼트 확장 — Feature 조합 분석 (공유 패키지)

User Research 설문(106명) 기반 **Q6 가중 선호확률** · **RF Feature 조합** · **비대학생 확장 Top/Bottom 5** 분석 노트북입니다.

## 폴더 구조 (변경하지 마세요)

```
zimtori_expansion_combo_share/
├── README.md
├── requirements.txt
├── notebooks/
│   └── zimtori_expansion_combo_analysis.ipynb   ← 이 파일을 실행
├── scripts/
│   ├── ml_expansion_analysis.py
│   └── preference_prob_utils.py
└── data/
    ├── survey_responses.xlsx                   ← 설문 원본(이메일 제거)
    └── survey_analysis/
        └── ml_results/                         ← 사전 산출 CSV (캐시)
```

## 사전 준비

- **Python 3.10 이상**
- Windows / macOS / Linux

## 설치 및 실행

### 1. 패키지 설치

```bash
cd zimtori_expansion_combo_share
pip install -r requirements.txt
```

### 2. 노트북 실행

**방법 A — Jupyter**

```bash
jupyter notebook notebooks/zimtori_expansion_combo_analysis.ipynb
```

**방법 B — VS Code / Cursor**

1. `notebooks/zimtori_expansion_combo_analysis.ipynb` 열기
2. Python 3 커널 선택
3. **Run All** (위에서부터 순서대로 실행)

### 3. 전수탐색 옵션

노트북 섹션 3의 `RUN_GRID_SEARCH`:

| 값 | 동작 |
|----|------|
| `False` (기본) | `data/survey_analysis/ml_results/top5_feature_combinations.csv` 캐시 로드 |
| `True` | RF로 약 960만 조합 전수탐색 (약 4분) |

## 분석 내용 요약

| 단계 | 내용 |
|------|------|
| 0 | 분석 목적 및 방법론 선택 이유 |
| 1 | 실측 데이터 로드 (10대 제외) |
| 2 | Q6 점수 가중 예측·실측 선호확률 |
| 3 | RF Feature 조합 전수탐색 |
| 4 | 실측 응답자 상·하위 Top5 |
| 5 | **비대학생** 5-Feature 조합 평균 Top/Bottom 5 |
| 6 | 최종 결론 & STP 확장 로드맵 |

## 문제 해결

| 오류 | 해결 |
|------|------|
| `No module named 'ml_expansion_analysis'` | `scripts/` 폴더가 zip 루트 아래에 있는지 확인 |
| `No module named 'preference_prob_utils'` | 위와 동일 |
| `설문 xlsx 파일을 찾을 수 없습니다` | `data/survey_responses.xlsx` 존재 여부 확인 |
| Plotly 그래프 미표시 | `pip install plotly jupyter` 후 브라우저에서 실행 |

## 데이터 안내

- 설문 응답 106명 (공유용에서 **이메일 컬럼 제거**)
- 팝콘 프로젝트 / 짐토리(Zimtori) User Research

---

*팝콘 프로젝트 · 짐토리 Feature 조합 확장 분석 패키지*
