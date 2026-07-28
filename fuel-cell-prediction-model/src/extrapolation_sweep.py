"""
Runs the extrapolation test (see extrapolation_experiment.py) across every
major operating-condition axis, holding out one edge value per axis so the
model must predict beyond the range it was trained on. Produces the summary
table used in docs/phase1_findings.md.
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
N_EPOCHS = 4000

# (column, held-out value, human label)
CASES = [
    ("voltage", 0.4, "Voltage (low, 0.4V) -- concentration-loss regime"),
    ("Pressure", 3, "Pressure (high, 3 atm)"),
    ("anode humidity", 20, "Anode humidity (low, 20% -- dry/high-ohmic regime)"),
    ("anode stoi", 1, "Anode stoichiometry (low, 1 -- fuel-starved regime)"),
    ("cathode stoi", 1.5, "Cathode stoichiometry (low, 1.5 -- O2-starved regime)"),
    ("anode temperature", 100, "Anode temperature (high, 100C)"),
]


def to_raw_dict(X_raw):
    return {key: torch.tensor(X_raw[:, i], dtype=torch.float32) for i, key in enumerate(RAW_KEYS)}


def train_and_eval(train_df, test_df):
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

    base_model = XGBRegressor(
        n_estimators=200, learning_rate=0.08, max_depth=5,
        subsample=0.8, colsample_bytree=0.8, random_state=62
    )
    base_model.fit(X_train_norm, pd_train)
    base_pred = base_model.predict(X_test_norm)

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

    model.eval()
    with torch.no_grad():
        out = model(torch.tensor(X_test_norm), to_raw_dict(X_test_raw))
    pinn_pred = out["pd_hat"].numpy()

    base_r2 = r2_score(pd_test, base_pred)
    base_rmse = np.sqrt(mean_squared_error(pd_test, base_pred))
    pinn_r2 = r2_score(pd_test, pinn_pred)
    pinn_rmse = np.sqrt(mean_squared_error(pd_test, pinn_pred))
    return base_r2, base_rmse, pinn_r2, pinn_rmse


def main():
    df = pd.read_excel(DATA_PATH)
    results = []
    for col, val, label in CASES:
        is_holdout = df[col] == val
        train_df = df[~is_holdout].reset_index(drop=True)
        test_df = df[is_holdout].reset_index(drop=True)
        if len(test_df) == 0:
            print(f"skip {label}: no matching rows")
            continue
        base_r2, base_rmse, pinn_r2, pinn_rmse = train_and_eval(train_df, test_df)
        winner = "PINN" if pinn_r2 > base_r2 else "XGBoost"
        results.append((label, len(train_df), len(test_df), base_r2, base_rmse, pinn_r2, pinn_rmse, winner))
        print(f"{label}: n_train={len(train_df)} n_test={len(test_df)}  "
              f"XGBoost R2={base_r2:.4f} RMSE={base_rmse:.4f}  |  "
              f"PINN R2={pinn_r2:.4f} RMSE={pinn_rmse:.4f}  -> {winner}")

    print("\n\n=== SUMMARY (power density extrapolation, held-out edge condition) ===")
    print(f"{'case':55s} {'n_tr':>5s} {'n_te':>5s} {'XGB R2':>8s} {'PINN R2':>8s} {'winner':>8s}")
    for label, ntr, nte, br2, brmse, pr2, prmse, winner in results:
        print(f"{label:55s} {ntr:5d} {nte:5d} {br2:8.4f} {pr2:8.4f} {winner:>8s}")


if __name__ == "__main__":
    main()
