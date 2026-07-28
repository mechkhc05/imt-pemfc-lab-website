"""
0D/1D semi-empirical PEMFC polarization-curve physics.

    V = E_nernst - eta_activation(i) - eta_ohmic(i) - eta_concentration(i)

The equation FORM is fixed (standard PEMFC polarization model). Coefficients
are now low-parameter physical forms (not MLPs) so they can be reliably
identified from sparse data, and are initialized from / anchored to a fit
against the lab's own experimental I-V curve (src/fit_experimental_iv.py,
T=70C, ~1 atm, RH=100%, stoi=3.5):

    alpha=1.2085, R_ohm=0.0235 ohm.cm^2, B=0.1911 V, i_lim=1.7419 A/cm^2

i0 (exchange current density) was NOT well identified by that single-condition
fit (alpha/i0 trade off in the Tafel term when E_nernst is fixed), so it is
left free and instead learned from the CFD dataset's temperature sweep,
which is the only data source that can actually inform its T-dependence.
"""
import torch
import torch.nn as nn

R = 8.314        # J/(mol K)
F = 96485.0      # C/mol
E0 = 1.229       # V, standard reversible potential
K_E = 0.85e-3    # V/K, Nernst temperature coefficient
T_REF = 298.15   # K

# anchor values fitted from data/raw/0kpa_I-V_curve.xlsx
EXP_ANCHOR = {
    "T_K": 343.15, "P_atm": 1.0, "RH": 1.0, "stoi_a": 3.5, "stoi_c": 3.5,
    "alpha": 1.2085, "r_ohm": 0.0235, "b": 0.1911, "i_lim": 1.7419,
}


class PolarizationPhysics(nn.Module):
    """Given operating conditions and a candidate current density, returns
    the voltage the polarization equation implies (`V_physics`)."""

    def __init__(self):
        super().__init__()
        # i0(T): Arrhenius form, free (not anchored) -- learned from the
        # CFD dataset's temperature sweep.
        self.log_i0_ref = nn.Parameter(torch.tensor(-8.0))   # ln(i0) at T_ref
        self.ea_i0 = nn.Parameter(torch.tensor(2000.0))      # activation energy / R, in K

        # anchored coefficients: initialized at the experimental fit, with a
        # small learned correction as a function of operating condition so
        # they can still extend across the CFD dataset's wider range.
        self.alpha0 = nn.Parameter(torch.tensor(EXP_ANCHOR["alpha"]))
        self.r_ohm0 = nn.Parameter(torch.tensor(EXP_ANCHOR["r_ohm"]))
        self.b0 = nn.Parameter(torch.tensor(EXP_ANCHOR["b"]))
        self.i_lim0 = nn.Parameter(torch.tensor(EXP_ANCHOR["i_lim"]))

        # small linear corrections (few parameters each -> data-efficient)
        self.r_ohm_dT = nn.Parameter(torch.tensor(0.0))
        self.r_ohm_dRH = nn.Parameter(torch.tensor(0.0))
        self.i_lim_dP = nn.Parameter(torch.tensor(0.0))
        self.i_lim_dRH = nn.Parameter(torch.tensor(0.0))
        self.i_lim_dStoiC = nn.Parameter(torch.tensor(0.0))

    def coefficients(self, T_avg_K, RH_avg, P_atm, stoi_a, stoi_c):
        i0 = torch.exp(self.log_i0_ref - self.ea_i0 * (1.0 / T_avg_K - 1.0 / EXP_ANCHOR["T_K"])) + 1e-12
        alpha = torch.clamp(self.alpha0, min=0.05)
        r_ohm = torch.nn.functional.softplus(
            self.r_ohm0 + self.r_ohm_dT * (T_avg_K - EXP_ANCHOR["T_K"]) / 100.0
            + self.r_ohm_dRH * (RH_avg - EXP_ANCHOR["RH"])
        )
        b = torch.clamp(self.b0, min=1e-4)
        i_lim = torch.nn.functional.softplus(
            self.i_lim0
            + self.i_lim_dP * (P_atm - EXP_ANCHOR["P_atm"])
            + self.i_lim_dRH * (RH_avg - EXP_ANCHOR["RH"])
            + self.i_lim_dStoiC * (stoi_c - EXP_ANCHOR["stoi_c"])
        )
        return i0, alpha, r_ohm, b, i_lim

    def forward(self, T_avg_K, RH_avg, P_atm, stoi_a, stoi_c, i_hat):
        i0, alpha, r_ohm, b, i_lim = self.coefficients(T_avg_K, RH_avg, P_atm, stoi_a, stoi_c)
        i_lim = i_lim + i_hat.detach().abs() + 1e-3  # always stay above the current we're evaluating

        p_h2 = P_atm
        p_o2 = 0.21 * P_atm
        e_nernst = (
            E0
            - K_E * (T_avg_K - T_REF)
            + (R * T_avg_K) / (2 * F) * torch.log(torch.clamp(p_h2 * torch.sqrt(p_o2), min=1e-6))
        )

        i_hat_pos = torch.clamp(i_hat, min=1e-6)
        eta_act = (R * T_avg_K) / (alpha * F) * torch.log(i_hat_pos / i0)
        eta_ohm = i_hat_pos * r_ohm
        ratio = torch.clamp(i_hat_pos / i_lim, max=0.999)
        eta_conc = -b * torch.log(1 - ratio)

        v_physics = e_nernst - eta_act - eta_ohm - eta_conc
        return v_physics

    def anchor_loss(self):
        """Pulls alpha/R_ohm/B/i_lim back toward the experimental fit at the
        exact experimental condition (i0 is deliberately excluded -- it
        isn't identifiable from a single-condition curve)."""
        device = self.alpha0.device
        t = torch.tensor(EXP_ANCHOR["T_K"], device=device)
        rh = torch.tensor(EXP_ANCHOR["RH"], device=device)
        p = torch.tensor(EXP_ANCHOR["P_atm"], device=device)
        sa = torch.tensor(EXP_ANCHOR["stoi_a"], device=device)
        sc = torch.tensor(EXP_ANCHOR["stoi_c"], device=device)
        _, alpha, r_ohm, b, i_lim = self.coefficients(t, rh, p, sa, sc)
        target = EXP_ANCHOR
        loss = (
            (alpha - target["alpha"]) ** 2
            + (r_ohm - target["r_ohm"]) ** 2
            + (b - target["b"]) ** 2
            + (i_lim - target["i_lim"]) ** 2 * 0.1  # i_lim is on a larger scale
        )
        return loss
