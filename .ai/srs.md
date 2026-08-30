# Software Requirements Specification (SRS)

**Project Name:** Mahbere Ahaw Seminary — Distance Learning Management System (LMS)

**Primary Objective:** Enable students to read monthly released modules and submit assignments, while allowing administrators to manage and monitor the entire educational process.

## 1. User Roles

### Super Admin

Controls the entire system, registers students and instructors, creates courses, and manages overall administrative processes.

### Instructor / Grader

Reviews student assignment submissions, assigns grades or scores, and provides written corrective feedback.

### Student

Reads the monthly released courses within the system, downloads assignments, and uploads completed tasks as files.

## 2. Core Features

### A. Admin Dashboard

- **User Management:** Registers new students and instructors, issues login credentials, and assigns system access permission levels.
- **Course & Module Management:** Creates new courses and uploads reading materials (via PDF, Word, or video links).
- **Drip Content Delivery:** Schedules courses to release automatically every month.
  - Example: When a student registers, only two courses for “Month 1” are unlocked. Exactly 30 days later, the two courses for “Month 2” unlock automatically.
- **Gradebook:** Consolidates all student grades into a single dashboard view and allows exporting data to Excel format.

### B. Student Portal (Mobile & Web App)

- **Dashboard:** Displays the 2 courses assigned for the current month and a visual progress bar.
- **Content Viewer:** Built-in PDF reader for training modules.
- **Assignment Submission:** Download questions, see due dates, upload PDF/Word/Image.
- **Grade & Feedback View:** Graded marks and instructor comments.
- **Push Notifications:** New course released or assignment deadline approaching.

### C. Instructor Panel

- **Assignment Review:** View, check, and download student submissions.
- **Grading System:** Numerical marks + written feedback.

## 3. Special Technical Considerations (Local Context)

- **Offline Capability:** After downloading newly released courses, students can read completely offline. Internet required only for submitting assignments and downloading new content.
- **Data Optimization:** Lightweight and optimized for low data consumption.
- **Cross-Platform:** Mobile App (preferred) and Web App.

## 4. Baseline Note

This document is a baseline discussion draft. Additional revisions and enhancements can be incorporated as needed.
