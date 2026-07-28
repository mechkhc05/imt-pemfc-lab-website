"""
PINN for PEMFC performance prediction.

- CurrentNet: black-box MLP that predicts current density i (A/cm^2) from
  the 8 operating-condition inputs. Trained with BOTH a data loss (against
  CFD current) and a physics loss (the polarization equation in physics.py
  must reproduce the input voltage from the predicted current).
- Power density falls out for free: PD = i * V (exact, no learning needed).
- SEHead / ODUHead: small MLPs for system efficiency / O2 uniformity, which
  don't have a clean closed-form here, so they stay data-driven — but they
  get the physics-informed current estimate as an extra input feature
  instead of just the raw operating conditions.
"""
import torch
import torch.nn as nn

from .physics import PolarizationPhysics


class CurrentNet(nn.Module):
    def __init__(self, in_dim=8, hidden=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden),
            nn.Tanh(),
            nn.Linear(hidden, hidden),
            nn.Tanh(),
            nn.Linear(hidden, hidden),
            nn.Tanh(),
            nn.Linear(hidden, 1),
            nn.Softplus(),  # current density must be positive
        )

    def forward(self, x):
        return self.net(x).squeeze(-1)


class DataHead(nn.Module):
    """Small data-driven head for outputs without a simple closed form (SE, ODU)."""

    def __init__(self, in_dim, hidden=32):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden),
            nn.Tanh(),
            nn.Linear(hidden, hidden),
            nn.Tanh(),
            nn.Linear(hidden, 1),
        )

    def forward(self, x):
        return self.net(x).squeeze(-1)


class PEMFC_PINN(nn.Module):
    """
    Expects raw (unnormalized) physical inputs in this order for the
    physics term, plus normalized inputs for the neural nets:
      P (atm), AT (C), AH (%), AS, CT (C), CH (%), CS, V
    """

    def __init__(self, in_dim=8):
        super().__init__()
        self.current_net = CurrentNet(in_dim=in_dim)
        self.physics = PolarizationPhysics()
        self.se_head = DataHead(in_dim=in_dim + 1)
        self.odu_head = DataHead(in_dim=in_dim + 1)

    def forward(self, x_norm, raw):
        """
        x_norm: (N, 8) normalized inputs, for the neural nets.
        raw: dict of (N,) raw physical tensors — P, AT, AH, AS, CT, CH, CS, V.
        """
        i_hat = self.current_net(x_norm)

        t_avg_k = (raw["AT"] + raw["CT"]) / 2.0 + 273.15
        rh_avg = (raw["AH"] + raw["CH"]) / 2.0 / 100.0
        v_physics = self.physics(
            T_avg_K=t_avg_k,
            RH_avg=rh_avg,
            P_atm=raw["P"],
            stoi_a=raw["AS"],
            stoi_c=raw["CS"],
            i_hat=i_hat,
        )

        pd_hat = i_hat * raw["V"]

        head_in = torch.cat([x_norm, i_hat.unsqueeze(-1)], dim=-1)
        se_hat = self.se_head(head_in)
        odu_hat = self.odu_head(head_in)

        return {
            "i_hat": i_hat,
            "v_physics": v_physics,
            "pd_hat": pd_hat,
            "se_hat": se_hat,
            "odu_hat": odu_hat,
        }

    def anchor_loss(self):
        return self.physics.anchor_loss()
