"""
Independent check: does the polarization-curve equation (physics.py's
functional form) actually fit our lab's own experimental I-V data?

If the coefficients (i0, alpha, R_ohm, i_lim) fit from this real
measurement are reasonable and the fit is tight, those values become the
anchor/prior for the PINN's physics coefficients -- initialize near them,
and regularize the PINN's coefficient sub-models to stay close (but let
the CFD data nudge them across the wider operating range).
"""
import numpy as np
import pandas as pd
from scipy.optimize import curve_fit
from sklearn.metrics import r2_score

R = 8.314
F = 96485.0
E0 = 1.229
K_E = 0.85e-3
T_REF = 298.15

PATH = "data/raw/0kpa_I-V_curve.xlsx"

# experimental condition (T=70C, ~1 atm, RH=100%, stoi=3.5)
T_EXP = 343.15
P_EXP = 1.0

E_NERNST_EXP = (
    E0 - K_E * (T_EXP - T_REF)
    + (R * T_EXP) / (2 * F) * np.log(P_EXP * np.sqrt(0.21 * P_EXP))
)


def load_trial(df, header_row, n_points=13):
    block = df.iloc[header_row + 1: header_row + 1 + n_points, 1:4]
    block.columns = ["i", "V", "PD"]
    block = block.astype(float)
    return block


def polarization_v(i, alpha, i0, r_ohm, b, i_lim):
    """Same functional form as physics.py, with E_nernst fixed analytically
    (not a free fit parameter) so the fitted i0/alpha are consistent with
    what the PINN will actually use."""
    i = np.clip(i, 1e-6, None)
    eta_act = (R * T_EXP) / (alpha * F) * np.log(i / i0)
    eta_ohm = i * r_ohm
    ratio = np.clip(i / i_lim, 1e-6, 0.999)
    eta_conc = -b * np.log(1 - ratio)
    return E_NERNST_EXP - eta_act - eta_ohm - eta_conc


def main():
    raw = pd.read_excel(PATH, sheet_name="comparison", header=None)
    t1 = load_trial(raw, header_row=6)
    t2 = load_trial(raw, header_row=25)
    both = pd.concat([t1, t2], ignore_index=True)

    fit_data = both[both["i"] > 1e-4].reset_index(drop=True)
    i_data = fit_data["i"].values
    v_data = fit_data["V"].values

    p0 = [0.5, 0.001, 0.05, 0.05, 1.6]
    bounds = (
        [0.05, 1e-12, 1e-6, 1e-4, 1.48],
        [3.0, 1.0, 1.0, 1.0, 3.0],
    )
    popt, pcov = curve_fit(polarization_v, i_data, v_data, p0=p0, bounds=bounds, maxfev=20000)
    alpha, i0, r_ohm, b, i_lim = popt
    v_pred = polarization_v(i_data, *popt)
    r2 = r2_score(v_data, v_pred)
    rmse = np.sqrt(np.mean((v_data - v_pred) ** 2))

    print(f"E_nernst (analytic, fixed) = {E_NERNST_EXP:.4f} V")
    print("Fitted polarization-curve coefficients (T=70C, ~1 atm, RH=100%, stoi=3.5):")
    print(f"  alpha (transfer coeff.)   = {alpha:.4f}")
    print(f"  i0 (exchange current)     = {i0:.6f} A/cm^2")
    print(f"  R_ohm (area resistance)   = {r_ohm:.4f} ohm.cm^2")
    print(f"  B (concentration coeff.)  = {b:.4f} V")
    print(f"  i_lim (limiting current)  = {i_lim:.4f} A/cm^2")
    print(f"\nFit quality: R2={r2:.5f}  RMSE={rmse:.5f} V  (n={len(i_data)} points, both trials pooled)")

    print("\nPer-point residuals:")
    for i, v, vp in zip(i_data, v_data, v_pred):
        print(f"  i={i:.4f}  V_meas={v:.3f}  V_model={vp:.4f}  resid={v - vp:+.4f}")


if __name__ == "__main__":
    main()
