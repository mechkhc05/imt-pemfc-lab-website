"""
Trains the physics-informed model (src/pinn/) on the CFD dataset and
compares it against the black-box baseline (src/baseline_reproduce.py).

Loss = data loss on current density (against CFD "current")
     + physics loss (polarization equation must reproduce the input voltage
       from the predicted current)
     + data loss on system efficiency and O2 uniformity (data-driven heads)

Same 80/20 split and random_state=62 as the baseline script, so R^2/RMSE
numbers are directly comparable.
"""
import numpy as np
import pandas as pd
import torch
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_squared_error

from pinn.model import PEMFC_PINN

DATA_PATH = "data/raw/dataset_formodel_paper2-3.xlsx"
RAW_COLS = ["Pressure", "anode temperature", "anode humidity", "anode stoi",
            "cathode temperature", "Cathode humidity", "cathode stoi", "voltage"]
RAW_KEYS = ["P", "AT", "AH", "AS", "CT", "CH", "CS", "V"]

torch.manual_seed(62)


def to_raw_dict(X_raw):
    return {key: torch.tensor(X_raw[:, i], dtype=torch.float32) for i, key in enumerate(RAW_KEYS)}


def main():
    df = pd.read_excel(DATA_PATH)
    X_raw = df[RAW_COLS].values.astype(np.float32)
    current = df["current"].values.astype(np.float32)
    power_density = df["power density"].values.astype(np.float32)
    se = df["System efficiency"].values.astype(np.float32)
    odu = df["stand devision o2"].values.astype(np.float32)

    idx = np.arange(len(df))
    idx_train, idx_test = train_test_split(idx, test_size=0.2, random_state=62)

    scaler = StandardScaler().fit(X_raw[idx_train])
    X_norm = scaler.transform(X_raw).astype(np.float32)

    X_norm_t = torch.tensor(X_norm)
    raw_t = to_raw_dict(X_raw)
    current_t = torch.tensor(current)
    se_t = torch.tensor(se)
    odu_t = torch.tensor(odu)

    train_idx_t = torch.tensor(idx_train)
    test_idx_t = torch.tensor(idx_test)

    model = PEMFC_PINN(in_dim=X_norm.shape[1])
    opt = torch.optim.Adam(model.parameters(), lr=2e-3)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=4000)

    lambda_phys = 0.05
    lambda_se = 5.0
    lambda_odu = 0.3
    lambda_anchor = 1.0

    n_epochs = 4000
    for epoch in range(n_epochs):
        model.train()
        opt.zero_grad()

        x_tr = X_norm_t[train_idx_t]
        raw_tr = {k: v[train_idx_t] for k, v in raw_t.items()}
        out = model(x_tr, raw_tr)

        loss_current = torch.mean((out["i_hat"] - current_t[train_idx_t]) ** 2)
        loss_phys = torch.mean((out["v_physics"] - raw_tr["V"]) ** 2)
        loss_se = torch.mean((out["se_hat"] - se_t[train_idx_t]) ** 2)
        loss_odu = torch.mean((out["odu_hat"] - odu_t[train_idx_t]) ** 2)
        loss_anchor = model.anchor_loss()

        loss = (loss_current + lambda_phys * loss_phys + lambda_se * loss_se
                + lambda_odu * loss_odu + lambda_anchor * loss_anchor)
        loss.backward()
        opt.step()
        sched.step()

        if epoch % 500 == 0 or epoch == n_epochs - 1:
            print(f"epoch {epoch:5d}  loss={loss.item():.5f}  "
                  f"current={loss_current.item():.5f}  phys={loss_phys.item():.5f}  "
                  f"se={loss_se.item():.5f}  odu={loss_odu.item():.5f}  anchor={loss_anchor.item():.5f}")

    model.eval()
    with torch.no_grad():
        x_te = X_norm_t[test_idx_t]
        raw_te = {k: v[test_idx_t] for k, v in raw_t.items()}
        out = model(x_te, raw_te)

    i_pred = out["i_hat"].numpy()
    pd_pred = out["pd_hat"].numpy()
    se_pred = out["se_hat"].numpy()
    odu_pred = out["odu_hat"].numpy()

    i_true = current[idx_test]
    pd_true = power_density[idx_test]
    se_true = se[idx_test]
    odu_true = odu[idx_test]

    print("\nPINN test-set performance")
    for name, true, pred in [
        ("current", i_true, i_pred),
        ("power density", pd_true, pd_pred),
        ("System efficiency", se_true, se_pred),
        ("stand devision o2", odu_true, odu_pred),
    ]:
        r2 = r2_score(true, pred)
        rmse = np.sqrt(mean_squared_error(true, pred))
        print(f"  {name:22s} R2={r2:.4f}  RMSE={rmse:.5f}")

    with torch.no_grad():
        p = model.physics
        i0, alpha, r_ohm, b, i_lim = p.coefficients(
            torch.tensor(343.15), torch.tensor(1.0), torch.tensor(1.0),
            torch.tensor(3.5), torch.tensor(3.5),
        )
    print(f"\nLearned coefficients @ anchor condition: "
          f"i0={i0.item():.6g}  alpha={alpha.item():.4f}  r_ohm={r_ohm.item():.4f}  "
          f"b={b.item():.4f}  i_lim={i_lim.item():.4f}")
    print(f"Experimental fit was:                   "
          f"alpha=1.2085  r_ohm=0.0235  b=0.1911  i_lim=1.7419")


if __name__ == "__main__":
    main()
