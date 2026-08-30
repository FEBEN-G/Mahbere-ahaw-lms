# Feature Implementation Prompt

Use this when adding a new feature.

## Instructions

1. Read `.ai/agent.md`, `.ai/rules.md`, and `.ai/grill-me.md`
2. Read the relevant files under `.ai/architecture/` and `.ai/modules/`
3. Restate the feature in one sentence
4. List affected modules and boundaries
5. Design API + data changes first (including Prisma migration if needed)
6. Implement backend (DTO → controller → service → repository → tests)
7. Implement frontend (schema → query/mutation → UI)
8. Add validation, authz, logging, and error handling
9. Queue side effects (notifications, exports) — never do them inline
10. Run the grill-me checklist before finishing

## Definition of Done

- [ ] Input validation
- [ ] Authorization on every endpoint
- [ ] No `any`, no duplicated business logic
- [ ] Migration if schema changed
- [ ] Tests for critical business rules
- [ ] Consistent API response shape
- [ ] Architectural decision noted if non-obvious
