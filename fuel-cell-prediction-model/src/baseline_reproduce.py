"""
Reproduces the surrogate-model baseline from:
Ngo, Nguyen, Lee, Kim, "Comparative analysis and evaluation of PEMFC machine
learning surrogates by bridging CFD and experimental data", J. Ind. Eng.
Chem. (2025), https://doi.org/10.1016/j.jiec.2025.10.027

Inputs (8): pressure, anode/cathode temperature, anode/cathode humidity,
anode/cathode stoichiometry, voltage.
Outputs (3): power density (PD), system efficiency (SE), O2 std dev (ODU).

This does not re-run Optuna hyperparameter search (the paper's 20-trial TPE
sweep per model) — it uses reasonable defaults to confirm the data pipeline
and get in the right ballpark against Table 7 of the paper before any
PINN/DeepONet work builds on top of it.
"""
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVR
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import r2_score, mean_squared_error
from xgboost import XGBRegressor
import numpy as np

DATA_PATH = "data/raw/dataset_formodel_paper2-3.xlsx"

INPUT_COLS = [
    "Pressure",
    "anode temperature",
    "anode humidity",
    "anode stoi",
    "cathode temperature",
    "Cathode humidity",
    "cathode stoi",
    "voltage",
]
OUTPUT_COLS = ["power density", "System efficiency", "stand devision o2"]


def load_data():
    df = pd.read_excel(DATA_PATH)
    X = df[INPUT_COLS].values
    y = df[OUTPUT_COLS].values
    return X, y


def evaluate(name, model, X_train, X_test, y_train, y_test, out_names):
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    print(f"\n{name}")
    for i, out in enumerate(out_names):
        r2 = r2_score(y_test[:, i], pred[:, i])
        rmse = np.sqrt(mean_squared_error(y_test[:, i], pred[:, i]))
        print(f"  {out:22s} R2={r2:.4f}  RMSE={rmse:.5f}")


def main():
    X, y = load_data()
    print(f"Loaded {X.shape[0]} rows, {X.shape[1]} inputs, {y.shape[1]} outputs")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=62
    )

    x_scaler = StandardScaler().fit(X_train)
    X_train_s = x_scaler.transform(X_train)
    X_test_s = x_scaler.transform(X_test)

    models = {
        "Random Forest": MultiOutputRegressor(
            RandomForestRegressor(n_estimators=200, random_state=62)
        ),
        "Gradient Boosting": MultiOutputRegressor(
            GradientBoostingRegressor(n_estimators=500, learning_rate=0.05, max_depth=4, random_state=62)
        ),
        "SVR": MultiOutputRegressor(SVR(C=5.0, epsilon=0.05, kernel="rbf")),
        "ANN (MLP)": MultiOutputRegressor(
            MLPRegressor(hidden_layer_sizes=(100,), max_iter=3000, random_state=62)
        ),
        "XGBoost": MultiOutputRegressor(
            XGBRegressor(
                n_estimators=200, learning_rate=0.08, max_depth=5,
                subsample=0.8, colsample_bytree=0.8, random_state=62
            )
        ),
    }

    for name, model in models.items():
        evaluate(name, model, X_train_s, X_test_s, y_train, y_test, OUTPUT_COLS)


if __name__ == "__main__":
    main()
