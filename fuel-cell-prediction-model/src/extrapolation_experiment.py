"""
Real test of the PINN's motivating hypothesis: can it extrapolate beyond
the CFD conditions it was trained on, better than a black-box model?

Unlike data_efficiency_experiment.py (random holdout -> interpolation),
this holds out an entire edge of the operating envelope -- all rows at the
highest anode temperature (100 C) -- so both models must predict a
condition they never saw *and* that lies beyond the training range, not
just a gap inside it. Tree ensembles like XGBoost can't extrapolate past
their training range (a leaf just repeats its last value); a physics
-constrained model should degrade much more gracefully.
"""
import numpy as np
import pandas as pd
import torch
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_squared_error
from xgboost import XGBRegressor

from pinn.model import PEMFC_PINN

DATA_PATH = "data/raw/dataset_formodel_paper2-3.xlsx"
RAW_COLS = ["Pressure", "anode temperature", "anode humidity", "anode stoi",
            "cathode temperature", "Cathode humidity", "cathode stoi", "voltage"]
RAW_KEYS = ["P", "AT", "AH", "AS", "CT", "CH", "CS", "V"]
HOLDOUT_COL = "voltage"
HOLDOUT_VALUE = 0.4
N_EPOCHS = 4000


def to_raw_dict(X_raw):
    return {key: torch.tensor(X_raw[:, i], dtype=torch.float32) for i, key in enumerate(RAW_KEYS)}


def report(name, true, pred):
    r2 = r2_score(true, pred)
    rmse = np.sqrt(mean_squared_error(true, pred))
    print(f"  {name:15s} R2={r2:8.4f}  RMSE={rmse:.5f}")
    return r2, rmse


def main():
    df = pd.read_excel(DATA_PATH)
    is_holdout = df[HOLDOUT_COL] == HOLDOUT_VALUE
    train_df = df[~is_holdout].reset_index(drop=True)
    test_df = df[is_holdout].reset_index(drop=True)
    print(f"Train: {len(train_df)} rows ({HOLDOUT_COL} in {sorted(train_df[HOLDOUT_COL].unique())})")
    print(f"Test:  {len(test_df)} rows, held out at {HOLDOUT_COL}={HOLDOUT_VALUE} (never seen in training)\n")

    X_train_raw = train_df[RAW_COLS].values.astype(np.float32)
    X_test_raw = test_df[RAW_COLS].values.astype(np.float32)
    pd_train = train_df["power density"].values.astype(np.float32)
    pd_test = test_df["power density"].values.astype(np.float32)
    current_train = train_df["current"].values.astype(np.float32)
    se_train = train_df["System efficiency"].values.astype(np.float32)
    odu_train = train_df["stand devision o2"].values.astype(np.float32)

    scaler = StandardScaler().fit(X_train_raw)
    X_train_norm = scaler.transform(X_train_raw).astype(np.float32)
    X_test_norm = scaler.transform(X_test_raw).astype(np.float32)

    # --- baseline: XGBoost trained only on AT != 100 ---
    base_model = XGBRegressor(
        n_estimators=200, learning_rate=0.08, max_depth=5,
        subsample=0.8, colsample_bytree=0.8, random_state=62
    )
    base_model.fit(X_train_norm, pd_train)
    base_pred = base_model.predict(X_test_norm)

    # --- PINN trained only on AT != 100 ---
    torch.manual_seed(62)
    model = PEMFC_PINN(in_dim=X_train_norm.shape[1])
    opt = torch.optim.Adam(model.parameters(), lr=2e-3, weight_decay=1e-3)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=N_EPOCHS)

    X_train_norm_t = torch.tensor(X_train_norm)
    raw_train_t = to_raw_dict(X_train_raw)
    current_train_t = torch.tensor(current_train)
    se_train_t = torch.tensor(se_train)
    odu_train_t = torch.tensor(odu_train)

    for epoch in range(N_EPOCHS):
        model.train()
        opt.zero_grad()
        out = model(X_train_norm_t, raw_train_t)
        loss_current = torch.mean((out["i_hat"] - current_train_t) ** 2)
        loss_phys = torch.mean((out["v_physics"] - raw_train_t["V"]) ** 2)
        loss_se = torch.mean((out["se_hat"] - se_train_t) ** 2)
        loss_odu = torch.mean((out["odu_hat"] - odu_train_t) ** 2)
        loss_anchor = model.anchor_loss()
        loss = loss_current + 0.05 * loss_phys + 5.0 * loss_se + 0.3 * loss_odu + 2.0 * loss_anchor
        loss.backward()
        opt.step()
        sched.step()
        if epoch % 1000 == 0 or epoch == N_EPOCHS - 1:
            print(f"  [pinn] epoch {epoch:5d}  loss={loss.item():.5f}")

    model.eval()
    with torch.no_grad():
        out = model(torch.tensor(X_test_norm), to_raw_dict(X_test_raw))
    pinn_pred = out["pd_hat"].numpy()

    print(f"\nExtrapolation test: predicting power density at {HOLDOUT_COL}={HOLDOUT_VALUE} "
          f"(never seen in training, n={len(test_df)})")
    report("XGBoost", pd_test, base_pred)
    report("PINN", pd_test, pinn_pred)

    print("\nSample predictions (first 10 held-out rows):")
    print(f"  {'true':>8s}  {'xgboost':>8s}  {'pinn':>8s}")
    for t, b, p in list(zip(pd_test, base_pred, pinn_pred))[:10]:
        print(f"  {t:8.4f}  {b:8.4f}  {p:8.4f}")


if __name__ == "__main__":
    main()
