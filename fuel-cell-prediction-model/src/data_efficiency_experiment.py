"""
Core hypothesis test for this project: does embedding the polarization-curve
physics let the model stay accurate with LESS CFD data than a black-box
model needs?

Trains the XGBoost baseline and the PINN on shrinking fractions of the
training pool (same held-out 20% test set throughout, random_state=62) and
compares power-density R^2 on the untouched test set.
"""
import numpy as np
import pandas as pd
import torch
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import r2_score
from xgboost import XGBRegressor

from pinn.model import PEMFC_PINN

DATA_PATH = "data/raw/dataset_formodel_paper2-3.xlsx"
RAW_COLS = ["Pressure", "anode temperature", "anode humidity", "anode stoi",
            "cathode temperature", "Cathode humidity", "cathode stoi", "voltage"]
RAW_KEYS = ["P", "AT", "AH", "AS", "CT", "CH", "CS", "V"]
FRACTIONS = [0.1, 0.2, 0.4, 0.6, 0.8, 1.0]
N_EPOCHS = 2500


def to_raw_dict(X_raw):
    return {key: torch.tensor(X_raw[:, i], dtype=torch.float32) for i, key in enumerate(RAW_KEYS)}


def train_baseline(X_train, y_train_pd):
    model = XGBRegressor(
        n_estimators=200, learning_rate=0.08, max_depth=5,
        subsample=0.8, colsample_bytree=0.8, random_state=62
    )
    model.fit(X_train, y_train_pd)
    return model


def train_pinn(X_norm_train, raw_train, current_train, se_train, odu_train,
                n_epochs=N_EPOCHS, lambda_phys=0.05, weight_decay=0.0, lambda_anchor=1.0):
    torch.manual_seed(62)
    model = PEMFC_PINN(in_dim=X_norm_train.shape[1])
    opt = torch.optim.Adam(model.parameters(), lr=2e-3, weight_decay=weight_decay)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=n_epochs)

    for _ in range(n_epochs):
        model.train()
        opt.zero_grad()
        out = model(X_norm_train, raw_train)
        loss_current = torch.mean((out["i_hat"] - current_train) ** 2)
        loss_phys = torch.mean((out["v_physics"] - raw_train["V"]) ** 2)
        loss_se = torch.mean((out["se_hat"] - se_train) ** 2)
        loss_odu = torch.mean((out["odu_hat"] - odu_train) ** 2)
        loss_anchor = model.anchor_loss()
        loss = (loss_current + lambda_phys * loss_phys + 5.0 * loss_se
                + 0.3 * loss_odu + lambda_anchor * loss_anchor)
        loss.backward()
        opt.step()
        sched.step()
    return model


def main():
    df = pd.read_excel(DATA_PATH)
    X_raw = df[RAW_COLS].values.astype(np.float32)
    current = df["current"].values.astype(np.float32)
    pd_true_all = df["power density"].values.astype(np.float32)
    se = df["System efficiency"].values.astype(np.float32)
    odu = df["stand devision o2"].values.astype(np.float32)

    idx = np.arange(len(df))
    idx_train_full, idx_test = train_test_split(idx, test_size=0.2, random_state=62)

    scaler = StandardScaler().fit(X_raw[idx_train_full])
    X_norm = scaler.transform(X_raw).astype(np.float32)

    X_norm_test = torch.tensor(X_norm[idx_test])
    raw_all = to_raw_dict(X_raw)
    raw_test = {k: v[torch.tensor(idx_test)] for k, v in raw_all.items()}
    pd_test = pd_true_all[idx_test]

    print(f"{'fraction':>8s}  {'n_train':>8s}  {'baseline_R2':>12s}  {'pinn_R2':>10s}")
    for frac in FRACTIONS:
        n_sub = max(8, int(len(idx_train_full) * frac))
        rng = np.random.RandomState(62)
        sub_idx = rng.choice(idx_train_full, size=n_sub, replace=False)

        # --- baseline ---
        base_model = train_baseline(X_norm[sub_idx], pd_true_all[sub_idx])
        base_pred = base_model.predict(X_norm_test.numpy())
        base_r2 = r2_score(pd_test, base_pred)

        # --- pinn ---
        sub_idx_t = torch.tensor(sub_idx)
        X_norm_sub = torch.tensor(X_norm[sub_idx])
        raw_sub = {k: v[sub_idx_t] for k, v in raw_all.items()}
        current_sub = torch.tensor(current[sub_idx])
        se_sub = torch.tensor(se[sub_idx])
        odu_sub = torch.tensor(odu[sub_idx])

        pinn_model = train_pinn(X_norm_sub, raw_sub, current_sub, se_sub, odu_sub,
                                 lambda_phys=0.05, weight_decay=1e-3, lambda_anchor=2.0)
        pinn_model.eval()
        with torch.no_grad():
            out = pinn_model(X_norm_test, raw_test)
        pinn_pred = out["pd_hat"].numpy()
        pinn_r2 = r2_score(pd_test, pinn_pred)

        print(f"{frac:8.1f}  {n_sub:8d}  {base_r2:12.4f}  {pinn_r2:10.4f}")


if __name__ == "__main__":
    main()
