# 짐토리 ML 확장 가능성 분석 — 실행 가이드

User Research 설문(106명) 기반 Feature Engineering · 서비스 선호(Y/N) 예측 · 세그먼트 확장 분석 노트북입니다.

## 폴더 구조 (변경하지 마세요)

```
zimtori_ml_share/
├── README.md
├── requirements.txt
├── notebooks/
│   └── zimtori_ml_expansion_analysis.ipynb
├── scripts/
│   └── ml_expansion_analysis.py
└── data/
    └── survey_responses.xlsx
```

## 사전 준비

- **Python 3.10 이상** 설치
- Windows / macOS / Linux 모두 가능

## 설치 및 실행

### 1. 패키지 설치

```bash
pip install -r requirements.txt
```

### 2. 노트북 실행

**방법 A — Jupyter**

```bash
jupyter notebook notebooks/zimtori_ml_expansion_analysis.ipynb
```

**방법 B — VS Code / Cursor**

1. `notebooks/zimtori_ml_expansion_analysis.ipynb` 열기
2. Python 3 커널 선택
3. **Run All** 또는 위에서부터 순서대로 실행

### 3. 결과 저장 위치

노트북 마지막 셀 실행 시 자동 생성:

```
data/survey_analysis/ml_results/
```

## 분석 내용 요약

| 단계 | 내용 |
|------|------|
| 1 | 설문 데이터 로드 |
| 2 | Feature Engineering & Target(Y) 정의 |
| 3 | EDA (Plotly 시각화) |
| 4 | 세그먼트별 선호율 |
| 5 | ML 모델 학습 (Logistic / Random Forest) |
| 6 | Feature Importance 해석 |
| 7 | STP 확장 세그먼트 예측 |
| 8 | 대학생 모델 → 비대학생 전이 예측 |
| 9 | 최종 결론 및 사업 시사점 |

## 문제 해결

| 오류 | 해결 |
|------|------|
| `No module named 'ml_expansion_analysis'` | `scripts/` 폴더가 있는지, 폴더 구조가 유지됐는지 확인 |
| `설문 xlsx 파일을 찾을 수 없습니다` | `data/survey_responses.xlsx` 존재 여부 확인 |
| Plotly 그래프 미표시 | `pip install plotly jupyter` 후 브라우저에서 노트북 실행 |

## 데이터 안내

- 설문 응답 106명 (이메일 컬럼은 공유용에서 제거됨)
- 팝콘 프로젝트 / 짐토리(Zimtori) User Research 기반

---

*팝콘 프로젝트 · 짐토리 ML 분석 패키지*
