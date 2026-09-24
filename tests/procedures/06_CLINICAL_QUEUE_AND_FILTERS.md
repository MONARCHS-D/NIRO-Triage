# Suite 06: Clinical Queue Management & Filters Procedures

**Target Routes**: `/queue`, `/dashboard`  
**Backend Endpoints**: `GET /facilities/{id}/cases`

---

## Procedure TC-QUE-001: Queue Table Render & Column Structure

### Objective
Verify that the triage queue correctly renders patient rows with all mandatory clinical triage columns.

### Steps to Perform
1. Navigate browser to `${BASE_URL}/queue`.
2. Inspect table header row:
   - Token / ID (`Token #`)
   - Patient Name & Demographics
   - Chief Complaint
   - Clinical Risk Indicators
   - Priority Category (`RED`, `YELLOW`, `GREEN`)
   - Review Status (`AI_DRAFT`, `PENDING_REVIEW`, `REVIEWED`, `ESCALATED`)
   - Actions ("Review Case →")
3. Verify rows are populated with active facility cases.

---

## Procedure TC-QUE-002: Filter Queue by Priority RED (Immediate Attention)

### Objective
Verify that clicking the RED priority filter isolates high-urgency cases.

### Steps to Perform
1. On `/queue`, locate the priority filter pill buttons:
   - `All`, `Red (Urgent)`, `Yellow (Prompt)`, `Green (Routine)`
2. Click button: `Red (Urgent)`.

### Expected Results
- Queue table updates immediately.
- All visible patient rows display the red priority badge: `.bg-red-500` or text `RED`.
- Total row count matches the Red KPI counter in the dashboard summary.

---

## Procedure TC-QUE-003: Filter Queue by Priority YELLOW (Prompt Review)

### Objective
Verify filtering by moderate urgency cases.

### Steps to Perform
1. Click button: `Yellow (Prompt)`.

### Expected Results
- Only patients categorized as `YELLOW` are visible in the table.

---

## Procedure TC-QUE-004: Filter Queue by Priority GREEN (Routine)

### Objective
Verify filtering by routine outpatient triage cases.

### Steps to Perform
1. Click button: `Green (Routine)`.

### Expected Results
- Only patients categorized as `GREEN` are visible in the table.

---

## Procedure TC-QUE-005: Reset Queue Filter to ALL

### Objective
Verify resetting the filter restores the entire patient queue.

### Steps to Perform
1. Click button: `All`.

### Expected Results
- Table restores full listing across all priority tiers.

---

## Procedure TC-QUE-006: Search by Patient Name

### Objective
Verify real-time search filtering by patient full or partial name.

### Steps to Perform
1. Locate the search input in Topbar or queue toolbar:
   `input[placeholder*="Search patient name, ID"]`
2. Type `Bimala`.

### Expected Results
- Table filters dynamically to display rows matching "Bimala".
- Non-matching rows are excluded.

---

## Procedure TC-QUE-007: Search by Patient ID / Token

### Objective
Verify direct lookup using unique patient reference code (e.g. `P-1042`).

### Steps to Perform
1. In search input, type `P-1042`.

### Expected Results
- Exactly one row matching ID `P-1042` is rendered.

---

## Procedure TC-QUE-008: Zero Search Results & Empty State Illustration

### Objective
Verify that queries yielding zero matches display the Section 15.1 empty queue artwork (`empty_queue.png`).

### Steps to Perform
1. In search input, enter a non-existent search term: `ZXQ999NONEXISTENT`.

### Expected Results
- Queue table body is replaced by the empty state container.
- Artwork renders: `<img src*="empty_queue.png">`.
- Text displays: "No matching patients found in queue" with a suggestion to clear filters.
2. Clear the search input -> queue table immediately reappears.
