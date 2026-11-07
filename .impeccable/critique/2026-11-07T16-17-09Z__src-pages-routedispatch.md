---
target: today's dispatches page
total_score: 38
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:C:\\Users\\giann\\Documents\\Programming Stuff\\MadayawGas\\madayawgas-frontend\\src\\pages\\RouteDispatch"
timestamp: 2026-11-07T16-17-09Z
slug: src-pages-routedispatch
---
Method: post-refactor validation

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 4 | 2-step wizard progress tracker; persistent unavailable counter; live Bunawan yard stock indicators. |
| 2 | Match System / Real World | 4 | Physical Bunawan yard bulk stock directly bound to load items; 24-unit crate calculations with remainder units. |
| 3 | User Control and Freedom | 4 | Pinned yellow CLOSE and operational action buttons in SideDrawer footer; Back to Staging in wizard; 1-click driver reassignment. |
| 4 | Consistency and Standards | 4 | Unified MadayawGas Accent Yellow (#FFDF2C) primary buttons; fixed MiddayReload transferType bug; preserved circular Truck icon badge. |
| 5 | Error Prevention | 4 | Yard inventory boundary checks prevent over-staging; real-time active driver attendance gating blocks unclocked crew. |
| 6 | Recognition Rather Than Recall | 4 | Live available yard stock displayed directly in staging row; read-only manifest review in Step 2. |
| 7 | Flexibility and Efficiency | 3 | Streamlined 2-step staging workflow; quick driver substitution dropdown; persistent operational KPI filters. |
| 8 | Aesthetic and Minimalist Design | 4 | High-density Mission-Control KPI strip; duplicate filter chips eliminated; 11px font floor enforced; WCAG AA contrast. |
| 9 | Error Recovery | 4 | Inline off-duty driver alert guides user to select from active on-duty drivers immediately. |
| 10 | Help and Documentation | 3 | Contextual helper text for scheduled vs ad-hoc modes; manifest breakdown cues. |
| **Total** | | **38/40** | **Excellent (95%) — Production Ready** |

### Design Specificity Verdict
The interface is now tightly grounded in physical LPG terminal operations. The truck dispatch modal operates as an air-traffic staging console with live warehouse yard stock balances, driver attendance verification, and a 2-step manifest confirmation wizard.

### What's Working
- Preserved circular Navy + Yellow Truck icon badge across rows, cards, drawers, and modal headers.
- Real-time Bunawan bulk yard inventory checks directly in the dispatch staging form.
- Pinned SideDrawer footer with yellow CLOSE button and quick-action triggers.
- Mission-control KPI strip providing instant morning staging situational awareness.
