# Predict, then run

Function: `availabilityLabel(stock)` in `CatalogViewModel.js`.
It computes the project's single derived product field, `availability`.

## Predictions recorded before execution

Recorded November 25, 2026, before running the checks below. These are
AI-assisted predictions for this implementation, disclosed in `AIUsage.md`.

| Input | Predicted output | Reason |
| --- | --- | --- |
| `0` | `"Sold out"` | The zero-stock condition returns first. |
| `3` | `"Only 3 seats left"` | Three is included in the low-stock boundary. |
| `4` | `"Seats available"` | Four is above that boundary. |

## Actual output

Executed after the predictions were committed in `0d214a9`:

```json
{"input":0,"output":"Sold out"}
{"input":3,"output":"Only 3 seats left"}
{"input":4,"output":"Seats available"}
```

All three matched. There were no mismatches to explain. The boundary was
deliberate: `stock <= 3` includes three, while four reaches the final return.
The zero condition must run first or zero would be described as low stock.

Reproduce from the project folder:

```powershell
node --input-type=module -e 'import {availabilityLabel} from "./CatalogViewModel.js"; for(const stock of [0,3,4]) console.log(JSON.stringify({input:stock,output:availabilityLabel(stock)}));'
```
