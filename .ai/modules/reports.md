# Reports Module

## Responsibilities

- Consolidate student grades into gradebook views
- Filter by course, month, instructor, student
- Export gradebook to Excel
- Provide admin monitoring summaries

## Business Rules

- Export jobs run via BullMQ for large datasets
- Respect RBAC: instructors see assigned scope; admins see all
- Exported files stored temporarily in object storage with expiry
- Never block HTTP request on large Excel generation

## Outputs

- Paginated gradebook API
- Excel download URL / stream
