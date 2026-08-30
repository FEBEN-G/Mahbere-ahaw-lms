# Content Modules Module

## Responsibilities

- Create / edit reading modules under a course
- Upload or link learning materials (PDF, Word, video URL)
- Control module visibility within an unlocked course
- Prepare downloadable packages for offline reading

## Supported Materials

- PDF (primary in-app reader)
- Word documents
- Video links (streamed when online)

## Business Rules

- Module belongs to a Course
- Student access requires course month to be unlocked
- Offline package includes PDFs needed for reading without network
- Soft delete only
- Store files in object storage; DB keeps metadata only

## Integrations

- Courses (parent)
- Assignments (often attached to module/course month)
- Student Content Viewer
