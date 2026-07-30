# Admin Delivery Acceptance and Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the management-side acceptance remediation and lifecycle execution workflows without adding non-contract API calls.

**Architecture:** Extend the existing delivery workbench with a protected whole-package acceptance submission. Expand the acceptance issue page around the contract's delivery-scoped acceptance rounds, and expand lifecycle execution around the existing application detail's `lifecycleRequest`. Reuse the global system message component and route.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Vitest, existing request adapter.

## Global Constraints

- Use only frozen OpenAPI resources and the existing system notification adapter.
- No backend changes and no production fake fallback.
- Every command mutation uses an idempotency key.
- Preserve Element Plus and the existing blue/white admin visual language.

### Task 1: Contract and validation helpers

**Files:**
- Modify: `src/api/dataMarket/delivery.ts`, `src/api/dataMarket/types.ts`
- Create: `src/views/dataMarket/acceptanceIssue/validation.ts`, `src/views/dataMarket/lifecycle/validation.ts`
- Test: `tests/dataMarket/adminAcceptanceLifecycle.spec.ts`

- [ ] Write tests for delivery rounds lookup, resubmission eligibility, and CHANGE target-version validation.
- [ ] Run the focused test and confirm RED.
- [ ] Add contract types, a real delivery-round adapter, and minimal validation helpers.
- [ ] Re-run the focused test and confirm GREEN.

### Task 2: Acceptance remediation workbench

**Files:**
- Modify: `src/views/dataMarket/acceptanceIssue/index.vue`, `src/views/dataMarket/deliveryWorkbench/index.vue`
- Test: `tests/dataMarket/adminAcceptanceLifecycle.spec.ts`

- [ ] Use a delivery ID to retrieve and flatten acceptance rounds/issues.
- [ ] Provide issue detail, resolution form, and guarded resubmission after unresolved issues are absent.
- [ ] Keep submit command idempotent and refresh actual server data after actions.

### Task 3: Lifecycle review and message entry

**Files:**
- Modify: `src/views/dataMarket/lifecycle/index.vue`
- Test: `tests/dataMarket/adminAcceptanceLifecycle.spec.ts`

- [ ] Retrieve the selected application detail and display its server-provided lifecycle request, credential IDs, schedule and execution result.
- [ ] Require reviewed impact, effective time and the CHANGE target version before execute.
- [ ] Add a message-center link to the reused `MyNotifyMessage` route and an unresolved-issue reminder linked to the acceptance workbench.

### Task 4: Verification and delivery

**Files:**
- Create: `admin-task5-report.md` in the shared delivery report folder.

- [ ] Run focused and full unit tests, data-market typecheck, build and targeted lint.
- [ ] Capture 1024, 1366 and 1440 views of both workbenches.
- [ ] Commit only task files and report exact evidence.
