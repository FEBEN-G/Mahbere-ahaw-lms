# Bug Fix Prompt

Use this when fixing a defect.

## Instructions

1. Reproduce or describe the failure clearly
2. Identify the owning module (do not patch across boundaries casually)
3. Find root cause before changing code
4. Write or update a failing test that captures the bug when practical
5. Fix the root cause in the correct layer (service vs repository vs UI)
6. Check for the same class of bug elsewhere in the module
7. Verify authorization and validation still hold
8. Run grill-me checklist

## Do Not

- Silence TypeScript to “make it work”
- Patch symptoms in the controller if the rule belongs in the service
- Introduce unrelated refactors in the same change
