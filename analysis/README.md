# Operational analysis

Run the model generator and training commands in services/models first. Open
notebooks/operations-analysis.ipynb with that pinned Python environment. Its
output report is report.json. The notebook covers pending activities, settled
income/expense changes, and tenant attention. It uses the same synthetic
histories and model artifact as the model workstream.

All findings are synthetic and dated June 2026. Reference cash totals are
checked through a separate SQLite query. Recommendations link their period and
source activity IDs. These are not claims about current app operations.
