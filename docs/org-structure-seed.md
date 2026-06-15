# Jera org structure — seed reference for the backend phase (B1)

**Source:** `Jera Organogram.pdf` (provided by Ryan, 2026-06-15).
**Status:** PROPOSED — role assignments pending Ryan's confirmation. Used to seed `employees` (hierarchy via `manager_id`) + initial Pulse roles, and the Training product assignments, when the backend phase (B1) stands up real data.
**Note:** roles are managed in Pulse (`employees.role`), not M365. M365 only authenticates. This seed is the *initial* state; an admin can change roles/managers in-app afterwards.

## Reporting hierarchy (manager_id)

```
Raymond De Kock — Managing Director            [top]
├── Charl Haasbroek — Operations Director
│   └── Melicke Olivier — Payroll & HR software consultant
├── Kevin Maroveke — ERP Systems Manager
│   ├── Werner Taute — Sage X3 Senior Consultant
│   ├── Liberty Maworera — Sage X3 Senior Consultant
│   ├── Riette Du Toit — Sage X3 Senior Consultant
│   ├── Ruth Elston — Sage X3 Senior Consultant
│   ├── Leon De Kock — Retail Consultant
│   ├── Michael Olivier — Junior Consultant
│   ├── Sikolwethu Dlamini — IT and Sage Junior Consultant
│   └── (Vacancy) — X3 Developer
├── Ryan de Kock — Business Development Manager
└── Ben Oosthuizen — Finance Manager
    └── Jo-ann Witten — Receptionist
```

## Pulse roles — CONFIRMED (Ryan, 2026-06-15)

**Ryan de Kock is the Owner / Super-Admin** (unrestricted, protected top authority). Other Admins: **Raymond De Kock, Ben Oosthuizen.** Everyone else is Manager (if they have direct reports) or Employee.

| Person | Title | Role | Notes |
|---|---|---|---|
| Ryan de Kock | Business Development Manager | **Owner / Super-Admin** | Unrestricted access to everything. Protected top authority: only the Owner can grant/revoke Admin, and the Owner can never be demoted or locked out by another user. |
| Raymond De Kock | Managing Director | **Admin** | |
| Ben Oosthuizen | Finance Manager | **Admin** | Expense approvals / finance |
| Charl Haasbroek | Operations Director | **Manager** | Manages Melicke; team oversight only — NO payroll/POPIA/contract |
| Kevin Maroveke | ERP Systems Manager | **Manager** | Manages the consultant team |
| Melicke Olivier | Payroll & HR software consultant | **Employee** | ⚠ **FLAG:** as Employee she has NO payroll/POPIA/policy-publish access. For a payroll/HR consultant this is likely wrong — confirm whether she should be Admin (the only role with payroll/HR access). |
| Werner Taute | Sage X3 Senior Consultant | Employee | |
| Liberty Maworera | Sage X3 Senior Consultant | Employee | |
| Riette Du Toit | Sage X3 Senior Consultant | Employee | |
| Ruth Elston | Sage X3 Senior Consultant | Employee | |
| Leon De Kock | Retail Consultant | Employee | |
| Michael Olivier | Junior Consultant | Employee | |
| Sikolwethu Dlamini | IT & Sage Junior Consultant | Employee | |
| Jo-ann Witten | Receptionist | Employee | |

> **Note on the manager boundary:** Pulse has only three roles. "Manager" deliberately *cannot* see payroll/POPIA/contracts (that's the whole point of the boundary). So anyone who must touch payroll/HR/personal data needs **Admin** — there is no middle "HR-only" role. If a finer-grained HR role is ever needed, that's a future capability-model change.

## Product / system teams (for the Training module assignments)

| Product | People |
|---|---|
| Sage 300 HR & Payroll | Charl (Exec), Melicke Olivier (Consultant) |
| Sage X3 | Charl (Exec), Kevin (Manager), Ryan (Project mgr), Liberty, Michael, Sikolwethu, Werner (Developer), Riette, Ruth, + Developer (vacant) |
| Sage Intacct | Charl (Exec), Kevin (Manager), Ryan (Project mgr), Leon, Michael, Sikolwethu, + Developer (vacant) |
| iVend Retail | Leon (Consultant), + iVend Consultant (vacant) |

## Open questions for Ryan
1. **Melicke Olivier** — Admin (for payroll/HR access) or Employee (current)? See the role-table flag.
2. Vacancies (X3 Developer, iVend Consultant) — seed as open positions or omit until filled?
3. Email addresses per person (needed for M365 identity matching at B1) — derive as `firstname@jera.co.za`, or provide the list?

_Resolved: Admin set = Ryan (Owner/Super-Admin), Raymond, Ben. Annemarie Taute removed — no longer employed._
