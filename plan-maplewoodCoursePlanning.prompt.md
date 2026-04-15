## Plan: Maplewood Course Planning System

Build a full-stack course planning app (Spring Boot JPA + React/TypeScript/Zustand) where students log in, browse courses, build a weekly Google Calendar–style schedule (Mon–Fri), and track graduation progress. Conflicting time blocks turn red. All business rules enforced on both backend and frontend.

---

### Phase 1: Project Scaffolding & Database Extension - COMPLETED

**Step 1 — Backend project setup**
- Create `backend/` directory with standard Spring Boot layout
- Copy starter templates: `backend-pom.xml` → `pom.xml`, `Application.java`, `WebConfig.java`, `application.properties`
- Verify Spring Boot starts and connects to the existing SQLite database

**Step 2 — Frontend project setup**
- `npm create vite@latest`
- Replace Redux deps with: `zustand`, `axios`, `react-router-dom`, and a UI library Tailwind
- Adapt `types.ts` and `api-client.ts` from starter templates
- Verify `npm start` works

**Step 3 — Extend SQLite schema (new tables)** *depends on Step 1*
The existing DB already has `semesters` (with `is_active`, `order_in_year`), courses, students, and history. We need 4 new tables:

| Table | Purpose |
|-------|--------|
| `timeslots` | Defines the weekly grid: Mon–Fri periods, 8:00–15:00, skip 12–13 lunch = 6 teaching periods (`timeslot_id`, `day_of_week` 1–5, `start_time`, `end_time`) |
| `course_sections` | One enrollable offering of a course per semester. Groups all meeting times. (`section_id`, `semester_id`, `course_id`, `teacher_id`, `section_label` auto-generated e.g. "A"/"B") |
| `section_meetings` | One row = one weekly meeting time for a section. (`meeting_id`, `section_id`, `classroom_id`, `timeslot_id`) — capacity is governed by `classrooms.capacity` (max 10) |
| `enrollments` | Current-semester enrollment (student ↔ `course_section`, `status`: enrolled/dropped) |

Example: Biology (BIO101) Section A meets Mon/Wed/Fri at 9:00 AM → 1 row in `course_sections`, 3 rows in `section_meetings`. A student enrolls in the section; all 3 meetings appear on their calendar.

These tables are created and populated by `populate_database.py` (see Step 4).

**Step 4 — Seed all data via Python** *depends on Step 3*
- Extend `populate_database.py` to create and populate `timeslots`, `course_sections`, `section_meetings`, and `enrollments` tables (`semesters` already exists)
- Auto-generate timeslots (Mon–Fri, 6 periods/day) and 1–2 sections per course for the active semester, each with meeting times distributed across the week
- Auto-generate `section_label` ("A", "B", etc.) per course per semester
- Assign teachers (matching `course.specialization_id`), classrooms (via `specialization.room_type_id` → `classroom.room_type_id`; fallback to standard classrooms when `room_type_id` is NULL)
- Distribute `hours_per_week` meetings across the week
- **Respect `teachers.max_daily_hours = 4`** — no teacher may have more than 4 meetings on any single day
- Filter courses by active semester's `order_in_year` matching `courses.semester_order`
- **No `DataSeeder.java`** — Python is the single source of truth for all DB content
- Spring Boot connects to the pre-populated SQLite DB; change starter template's `ddl-auto=update` → `ddl-auto=validate`
- Update `WebConfig.java` CORS origin from `http://localhost:3000` → `http://localhost:5173` (Vite default port)
---

### Phase 2: Backend — JPA Entities & Repositories

**Step 5 — JPA Entities** (12 total in `com.maplewood.model`)
Map all existing tables (`RoomType`, `Specialization`, `Teacher`, `Classroom`, `Course`, `Student`, `StudentCourseHistory`) and new tables (`Semester`, `TimeSlot`, `CourseSection`, `SectionMeeting`, `Enrollment`). Use Lombok `@Data`/`@Entity`. Key relationships:
- `Course.prerequisite` → self-referencing `@ManyToOne`
- `CourseSection` → `@ManyToOne` to Course, Teacher, Semester; `@OneToMany` to SectionMeeting; `String sectionLabel`
- `SectionMeeting` → `@ManyToOne` to CourseSection, Classroom, TimeSlot (capacity governed by `Classroom.capacity`)
- `Enrollment` → `@ManyToOne` to Student and CourseSection; `String status` (enrolled/dropped)
- **N+1 prevention:** Use `@EntityGraph` or `JOIN FETCH` JPQL on all schedule/enrollment queries to eagerly load related entities (course, teacher, classroom, timeslots) in a single query

**Step 6 — Spring Data JPA Repositories** *parallel with Step 5*
Key repository methods:
- `StudentCourseHistoryRepository.findByStudentIdAndCourseIdAndStatus(studentId, courseId, "passed")` — prerequisite checks
- `EnrollmentRepository.countByStudentIdAndSectionSemesterIdAndStatus(studentId, semesterId, "enrolled")` — max 5 check (only counts active enrollments, not dropped)
- `EnrollmentRepository.findByStudentIdAndSectionSemesterId(studentId, semesterId)` — current schedule (with `@EntityGraph` to fetch section → meetings → timeslots in one query)

---

### Phase 3: Backend — Service Layer & Validation

**Step 7 — DTOs** (in `com.maplewood.dto`)
- `CourseDTO`, `CourseSectionDTO` (with list of `SectionMeetingDTO` containing `TimeSlotDTO`), `StudentProfileDTO` (gpa, credits, progress, history), `ScheduleDTO`, `EnrollmentRequestDTO`, `EnrollmentResponseDTO` (with `ValidationErrorDTO` list — includes `code` and `message`)

**Step 8 — Service Layer** *depends on Steps 5-7*

`EnrollmentService.enrollStudent(studentId, sectionId)` — **the core validation chain:**
1. Student exists & is active
2. Section exists & belongs to active semester
3. Course grade level matches student grade
4. Max 5 courses (count current enrollments where `status = 'enrolled'`)
5. Prerequisite passed (query `student_course_history`)
6. Time conflict (compare section meeting timeslots vs. existing enrolled section meeting timeslots, only for `status = 'enrolled'`)
7. Capacity (count enrolled students in section vs. `min(classroom.capacity)` across section meetings)
8. Not already enrolled in same course
- **Race condition safety:** Wrap enrollment in `@Transactional`. SQLite serializes all writes (single-writer model), so concurrent capacity races are safe for now. Add a note to revisit with `@Version` optimistic locking or `SELECT FOR UPDATE` if migrating to PostgreSQL.
- Returns **all** applicable errors, not just the first
- **Standardized response format:**
  ```json
  {
    "success": true/false,
    "errors": [
      {"code": "PREREQ_NOT_MET", "message": "Missing prerequisite: MAT101"},
      {"code": "TIME_CONFLICT", "message": "Conflicts with existing enrollment: BIO201"}
    ]
  }
  ```
- Error codes enum: `PREREQ_NOT_MET`, `TIME_CONFLICT`, `MAX_COURSES_EXCEEDED`, `SECTION_FULL`, `ALREADY_ENROLLED`, `GRADE_MISMATCH`, `STUDENT_NOT_FOUND`, `SECTION_NOT_FOUND`
- Success → HTTP 200 with `{"success": true, "errors": []}`
- Failure → HTTP 400 with all applicable error codes
- Frontend displays each `message` as a toast line, uses `code` for programmatic handling (e.g., highlighting conflicting blocks)

`StudentService.getStudentProfile(id)` — GPA: `(credits_passed / total_credits_attempted) * 4.0`

`CourseService.getAvailableCourses(gradeLevel, semesterOrder)` — filtered catalog; matches `courses.semester_order` against the active semester's `order_in_year`
---

### Phase 4: Backend — REST Controllers

**Step 9 — Endpoints** *depends on Step 8*

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/courses?gradeLevel=&semester=` | List/filter courses |
| `GET` | `/api/courses/{id}/sections` | Sections for a course |
| `GET` | `/api/students/{id}` | Profile + GPA + credits + history |
| `GET` | `/api/students/{id}/schedule` | Current schedule (sections + time slots) |
| `POST` | `/api/enrollments` | Enroll (body: `{studentId, sectionId}`) |
| `PATCH` | `/api/enrollments/{id}/drop` | Soft-delete: sets `status` to `dropped` |
| `GET` | `/api/semesters/active` | Active semester |
| `GET` | `/api/sections?semesterId=` | All sections with time slots |

**Step 9b — Backend unit & integration tests** *depends on Step 9*
- `@WebMvcTest` for controller-layer tests with mocked services
- `@SpringBootTest` with in-memory SQLite for integration tests exercising the full validation chain
- **Required test cases:**
  - Enroll successfully → 200, enrollment created
  - Missing prerequisite → 400, `PREREQ_NOT_MET`
  - Time conflict with existing enrollment → 400, `TIME_CONFLICT`
  - 6th course enrollment → 400, `MAX_COURSES_EXCEEDED`
  - Full section → 400, `SECTION_FULL`
  - Duplicate enrollment → 400, `ALREADY_ENROLLED`
  - Grade level mismatch → 400, `GRADE_MISMATCH`
  - Multiple simultaneous violations → 400, returns **all** applicable error codes
  - Drop enrollment (soft delete) → 200, status set to `dropped`, block freed
  - Drop then re-enroll → 200, new enrollment created (old stays as `dropped`)

---

### Phase 5: Frontend — Foundation & State

**Step 10 — Routing** *parallel with backend steps*
- `/login` → student selection (no real auth, just pick a student ID)
- `/dashboard` → profile, GPA, progress, history
- `/enroll` → course browser + calendar schedule builder

**Step 11 — Zustand stores** (2 stores)
- `useStudentStore` — student profile, GPA, credits, course history, loading/error state
- `useCourseStore` — course catalog, sections, filters, **current enrolled sections**, **computed `conflictingSlotIds`** (set of time_slot IDs appearing in 2+ sections), `enroll()` / `drop()` actions, enrollment count
- **Server is source of truth:** Client-side `conflictingSlotIds` is a preview only. After any `enroll()`/`drop()` call, the store must (1) use the server's `errors` array to display conflicts/rejections, and (2) re-fetch the current schedule + section capacities from the server to sync state. Server response always overrides client-side optimistic checks.
- **Freshness strategy:** Re-fetch section data (including capacity) on enrollment page load and after every enroll/drop action. No SWR/React Query needed — keep Zustand as the single state layer for simplicity.

**Step 12 — Types & API client**
- Extend starter `types.ts` with `TimeSlot`, `CourseSection`, `SectionMeeting`, `ScheduleEntry`, `EnrollmentResponse`
- Adapt `api-client.ts` for all endpoints

---

### Phase 6: Frontend — Pages & Components (the UI)

**Step 13 — Login Page**
- Input for student ID (or searchable dropdown)
- Fetch profile → store in Zustand → redirect to `/dashboard`

**Step 14 — Dashboard Page**
- Student info card (name, grade, email)
- GPA badge, credits progress bar (earned / 30), graduation %
- Course history table (semester, course, status, credits)
- "Plan Semester" button → `/enroll`

**Step 15 — Enrollment Page** *(core deliverable)* **split-pane layout:**

**Left: Course Browser**
- Filter bar (grade level, type, search)
- Course cards: code, name, credits, prerequisite info
- Expand to see sections (teacher, room, times, capacity)
- "Add" button per section
- Grey out courses with unmet prerequisites

**Right: Weekly Calendar (Mon–Fri, 8:00–15:00)**
- CSS Grid: columns = Mon–Fri, rows = hourly periods (skip 12–13 lunch)
- Enrolled sections render as **calendar blocks** (like Google Calendar)
- Block shows: course code, name, room
- **Conflict highlighting**: if any `timeSlotId` is in `conflictingSlotIds`, that block turns **RED** with error tooltip (e.g., "Conflicts with MAT201")
- "X" button on each block to drop course
- Header: "3/5 courses enrolled"
- **Resizable split panes** — allow students to drag the divider between course browser and calendar for better UX on different screen sizes

**Step 16 — Shared components**
- `CalendarGrid` — the Mon–Fri grid
- `ScheduleBlock` — individual calendar event (blue = normal, red = conflict)
- `CourseCard`, `SectionCard`, `ProgressBar`, `Navbar`

---

### Phase 7: Polish

**Step 17 — Error handling & UX** *depends on Steps 13-16*
- Loading skeletons, error toasts
- Disable "Add" buttons when at 5 courses
- Toast for enrollment success/failure with specific error messages

**Step 18 — Edge cases**
- Freshman with no history, failed prerequisites, full sections, drop & re-enroll

---

### Relevant Files

**Existing (reference):**
- `challenge/create_database.sql` — existing schema, triggers, constraints
- `challenge/populate_database.py` — data generation, course/student structure, GPA logic
- `challenge/DATABASE.md` — schema docs, sample queries
- `challenge/starter-templates/` — boilerplate to adapt

**Backend (to create):**
- `backend/pom.xml`, `application.properties`, `Application.java`, `WebConfig.java`
- `backend/.../model/` — 12 JPA entity classes
- `backend/.../repository/` — Spring Data repos
- `backend/.../dto/` — DTOs
- `backend/.../service/` — `StudentService`, `CourseService`, `EnrollmentService`
- `backend/.../controller/` — 4 REST controllers
- `backend/src/test/` — unit & integration tests for enrollment validation

**Frontend (to create):**
- `frontend/src/types/index.ts`, `frontend/src/api/client.ts`
- `frontend/src/store/` — 2 Zustand stores (`useStudentStore`, `useCourseStore`)
- `frontend/src/pages/` — `LoginPage`, `DashboardPage`, `EnrollmentPage`
- `frontend/src/components/` — `CalendarGrid`, `ScheduleBlock`, `CourseCard`, `SectionCard`, `ProgressBar`, `Navbar`

---

### Verification

1. Run `python populate_database.py` → verify SQLite has all tables and expected row counts
2. `mvn spring-boot:run` → no errors, `GET /api/courses` returns 57 courses
3. `GET /api/students/1` → correct GPA, credits, course history
4. `POST /api/enrollments` with valid data → 200, enrollment created
5. Enroll without prerequisite → 400 with "missing prerequisite" error
6. Enroll in two overlapping sections → 400 with "time conflict" error
7. Enroll 5 courses then try 6th → 400 with "max courses exceeded"
8. Frontend login → profile loads on dashboard
9. Enroll in 2–3 courses → blocks appear on Mon–Fri calendar
10. **Enroll in two conflicting sections → both blocks turn RED**
11. Drop a course → block disappears, count updates
12. Graduation progress bar reflects credits accurately

---

### Decisions

- **Zustand** over Redux — user preference, simpler API
- **No real auth** — login is student selection (challenge scope)
- **Section → Meetings model**: `course_sections` groups meetings (with auto-generated `section_label`); `section_meetings` holds individual timeslots. Students enroll in sections, all meetings appear on calendar.
- **Classroom capacity governs section size** — no separate capacity on `course_sections`; the smallest classroom across a section's meetings determines max enrollment
- **Soft-delete drops** — `enrollments.status` toggled to `dropped`, not hard-deleted, so history is preserved
- **Teacher daily limit** — seeder respects `teachers.max_daily_hours = 4` when assigning meetings
- **Semester filtering** — courses shown only when `courses.semester_order` matches active semester's `order_in_year`
- **`semesters` table is pre-existing** — not created by the new schema; use its `is_active` flag to find current semester
- **All seeding in `populate_database.py`** — single source of truth, no Java seeder
- **2 Zustand stores** (`useStudentStore`, `useCourseStore`) — enrollment state lives in `useCourseStore`
- **Standardized error response** — `{success, errors: [{code, message}]}` for consistent frontend toast handling
- **Client-side conflict detection** for instant visual feedback; **server is final authority** — re-fetch + use server errors after every mutation
- **N+1 prevention** — `@EntityGraph`/`JOIN FETCH` on all schedule queries
- **Race condition safety** — SQLite single-writer serializes concurrent enrollments; revisit with optimistic locking on DB migration
- **GPA formula**: `(credits_passed / total_credits_attempted) * 4.0` — confirmed by DATABASE.md; pass-rate on 4.0 scale, not letter-grade GPA
- **School day**: 8:00–15:00, 6 teaching periods (12–13 lunch break)
- **Scope includes**: login, dashboard, course browsing, calendar builder, enrollment validation, conflict highlighting
- **Scope excludes**: admin features, teacher views, section CRUD UI, semester switching, JWT auth
