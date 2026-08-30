# Refactor Prompt

Use this when improving structure without changing intended behavior.

## Instructions

1. State the smell (God class, duplication, tight coupling, etc.)
2. Confirm behavior that must remain unchanged
3. Prefer extract module / extract service / introduce repository over rewrites
4. Keep files under 300 lines and functions under 40 lines
5. Preserve public API contracts unless explicitly versioning
6. Update tests to lock behavior
7. Run grill-me checklist

## Guardrails

- Architecture first — no shortcuts that create debt
- Maintainability first — another developer must understand it quickly
- Do not mix feature work into refactors
