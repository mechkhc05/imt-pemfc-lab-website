# 연료전지 예측 모델 (Fuel Cell Prediction Model)

25 cm² (5×5 cm) PEMFC의 온도·압력·수소/산소 공급 조건에 따른 I-V 곡선과
출력을 예측하는 프로젝트. 최종적으로는 실시간 예측 + Unity 시각화 +
논문 출판까지가 목표.

## 배경

- Ansys CFD 해석으로 다양한 운전조건의 성능 데이터를 확보했고, 실험으로
  해석 모델의 파라미터를 튜닝/검증해 신뢰성을 확보한 상태.
- 랩에서 이미 발표한 논문
  [Ngo, Nguyen, Lee, Kim — "Comparative analysis and evaluation of PEMFC
  machine learning surrogates by bridging CFD and experimental data"](https://doi.org/10.1016/j.jiec.2025.10.027)
  (J. Ind. Eng. Chem., 2025)에서 CFD 데이터 306개(51개 운전조건 × 전압
  6단계)로 RF/GB/SVM/ANN/XGBoost 대리모델을 비교했고, XGBoost가 가장
  우수 (PD R²=0.989, SE R²=0.999, ODU R²=0.935).
- 논문이 스스로 밝힌 한계: 295~306개 데이터는 넓은 운전영역 대비 부족하며,
  더 많은 CFD 케이스 없이는 조건 외삽 시 신뢰도가 떨어짐. → 이 프로젝트의
  출발점.

## 아이디어

CFD 케이스를 무한정 늘리는 대신, **물리 법칙을 제약조건으로 넣은 PINN**을
학습해서 적은 CFD 데이터로도 넓은 조건 범위를 커버하고, 궁극적으로는 CFD
툴 없이 예측할 수 있는 모델을 만든다. 그 위에 **DeepONet**을 얹어 실시간
추론이 가능하게 하고, **Unity**로 시각화한다.

### 물리 모델 (PINN)

3D CFD 지배방정식(연속/운동량/에너지/종보존 등)을 그대로 쓰기엔 공간 분포
데이터가 없어 맞지 않음 → 대신 PEMFC **분극곡선 반경험식**을 물리 제약으로
사용:

```
V = E_Nernst(T, P) − η_activation(i, T) − η_ohmic(i, T, RH) − η_concentration(i, P, stoi, RH)
```

신경망이 조건별로 각 손실항(또는 그 파라미터)을 예측하고, 위 식을 물리
잔차 손실로, CFD 데이터를 데이터 손실로 함께 학습한다. ODU(산소 분포
균일도)는 이 식에 없으므로 별도 데이터 기반 헤드로 예측.

### 실시간 추론 (DeepONet)

PINN(검증된 물리 모델)로 저비용으로 만든 대량 합성 데이터를 학습해,
운전조건 → I-V 곡선을 즉시 매핑하는 오퍼레이터 네트워크를 구성.

### Unity 연동

학습된 모델을 Python 서버(FastAPI 등)로 서빙하고, Unity 클라이언트가
REST/WebSocket으로 요청해 실시간 시각화.

## 진행 단계

- [x] **Phase 0 — Baseline 재현**: 이 프로젝트의 CFD 데이터셋으로 논문의
      XGBoost 결과를 재현해 데이터 파이프라인 검증 완료 (`src/baseline_reproduce.py`).
      Optuna 튜닝 없이도 논문 수치와 근접 (PD R²=0.988, SE R²=0.999, ODU R²=0.921).
- [ ] **Phase 1 — PINN**: 분극곡선 물리 잔차 + CFD 데이터 손실 결합 모델
- [ ] **Phase 2 — DeepONet**: PINN 기반 합성 데이터로 실시간 추론 모델 학습
- [ ] **Phase 3 — Unity 연동**: Python 서빙 서버 + Unity 클라이언트
- [ ] **Phase 4 — 논문 작성**

## 데이터

`data/raw/dataset_formodel_paper2-3.xlsx` — CFD 해석 결과, 306행.

입력 8개: `Pressure` (1~3 atm), `anode temperature` / `cathode temperature`
(50~100°C), `anode humidity` / `Cathode humidity` (20~100%), `anode stoi`
(1,3,5) / `cathode stoi` (1.5,3.5,5.5), `voltage` (0.4~0.9V).

출력 3개: `power density`, `System efficiency`, `stand devision o2` (O₂
분포 균일도, 논문의 ODU).

## 실행

```bash
pip install -r requirements.txt
python src/baseline_reproduce.py
```

## 폴더 구조

```
fuel-cell-prediction-model/
├── data/raw/         CFD 데이터셋
├── src/              모델 코드
├── notebooks/        탐색/실험용
├── unity/            Unity 프로젝트 (추후)
└── requirements.txt
```
