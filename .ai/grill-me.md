# AI Self-Review Checklist

Before completing any task, review your solution.

Ask yourself:

- Can this code scale to 100,000 students?
- Can this module be reused?
- Does it violate SOLID?
- Can responsibilities be separated further?
- Is there duplicated logic?
- Is this readable?
- Can another developer understand it quickly?
- Are names meaningful?
- Have I validated inputs?
- Have I handled errors?
- Does every endpoint require authorization?
- Can this code be unit tested?
- Are dependencies injected?
- Does this create tight coupling?
- Can this be extended later?
- Did I optimise database queries?
- Did I avoid N+1 queries?
- Is pagination implemented?
- Would I merge this into production?

If not, improve it before returning.
