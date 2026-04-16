# Maplewood Course Planning — Codebase Guide

## Project overview

Full-stack course planning system for Maplewood High School.
Students log in, browse the course catalog, stage enrollments in a preview calendar, and commit them. The backend enforces all business rules (prerequisites, time conflicts, capacity, 5-course limit, grade level).

```
blue_dog/
├── backend/          Spring Boot 3 API (Java 21, Gradle-free — uses Maven)
├── frontend/         React 19 + TypeScript + Vite SPA
├── maplewood_school.sqlite   Pre-seeded database (400 students, 57 courses)
└── challenge/        Problem statement and original docs
```

---

## Running locally

**Backend** (port 8080)
```bash
cd backend
mvn spring-boot:run
```

**Frontend** (port 5173)
```bash
cd frontend
npm install
npm run dev
```

The frontend proxies `/api` to `http://localhost:8080` via Vite config.

---

## Backend

### Stack
- Spring Boot 3, Java 21
- Spring Data JPA + Hibernate
- SQLite (`maplewood_school.sqlite` in repo root — path relative to `backend/`)
- Lombok for boilerplate reduction
- Maven

### Package layout
```
com.maplewood/
├── controller/    REST endpoints (thin — delegate to services)
├── service/       Business logic and validation
├── repository/    Spring Data JPA interfaces
├── model/         JPA entities
└── dto/           Request/response shapes (never expose entities directly)
```

### Key API endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/students/{id}` | Student profile (GPA, credits, history) |
| GET | `/api/students/{id}/schedule` | Current semester enrolled sections |
| GET | `/api/courses?gradeLevel=&semester=` | Course catalog with filters |
| GET | `/api/courses/{id}/sections` | Sections for a specific course |
| GET | `/api/sections?semesterId=` | All sections in a semester |
| GET | `/api/semesters/active` | Active semester metadata |
| POST | `/api/enrollments` | Enroll `{ studentId, sectionId }` |
| DELETE | `/api/enrollments/{id}` | Drop an enrollment |

### Enrollment validation (EnrollmentService)
All rules are checked server-side; the response always contains `{ success, errors[] }`:
1. Student exists and is active
2. Section belongs to the active semester
3. Student's grade ≥ course `gradeLevelMin` (no upper bound — older students may revisit lower-grade courses)
4. Max 5 enrolled courses per semester
5. Prerequisite passed (`student_course_history.status = 'passed'`)
6. No time-slot conflict with existing enrollments
7. Section not at capacity
8. Not already enrolled in the same course

### Error codes
`STUDENT_NOT_FOUND` · `SECTION_NOT_FOUND` · `GRADE_MISMATCH` · `MAX_COURSES_EXCEEDED` · `PREREQ_NOT_MET` · `TIME_CONFLICT` · `SECTION_FULL` · `ALREADY_ENROLLED`

### Running backend tests
```bash
cd backend
mvn test          # 26 tests across 4 test classes
```

---

## Frontend

### Stack
- React 19, TypeScript (strict)
- Vite 8 + `@tailwindcss/vite`
- Tailwind CSS v4 (CSS-first config — see `src/index.css`)
- Zustand for state management
- Axios via `src/api/client.ts`

### Directory layout
```
src/
├── api/           Typed API client wrappers (axios)
├── components/
│   ├── ui/        Primitive design-system components (Badge, Button, Card)
│   ├── CalendarGrid.tsx
│   ├── CourseCard.tsx   accordion with lazy section loading
│   ├── Navbar.tsx
│   ├── ScheduleBlock.tsx
│   ├── SectionCard.tsx
│   ├── Skeleton.tsx
│   └── Toast.tsx
├── lib/
│   ├── dayNames.ts
│   ├── specializationColors.ts   subject → Tailwind color classes
│   └── toastService.ts           pub/sub; call showToast() anywhere
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx   GPA, credits, graduation progress, history
│   └── EnrollPage.tsx      course browser + live calendar preview
├── store/
│   ├── useCourseStore.ts   catalog, sections cache, pending enrollments, schedule
│   └── useStudentStore.ts  profile + auth
└── types/index.ts          shared TypeScript interfaces
```

### Design tokens (Tailwind theme)
Defined in `src/index.css` using Tailwind v4's `@theme` directive.
Semantic aliases map to standard Tailwind palette values so the entire color scheme can be changed in one place:

| Token family | Purpose | Default mapping |
|---|---|---|
| `primary-*` | Brand / interactive | indigo |
| `success-*` | Confirmed / enrolled | green |
| `danger-*` | Errors / conflicts | red |
| `warning-*` | Cautions / prerequisites | amber |
| `pending-*` | Staged (not committed) | blue |
| `surface` / `surface-muted` / `surface-subtle` | Backgrounds | white / gray-50 / gray-100 |
| `border` / `border-muted` | Dividers | gray-200 / gray-100 |
| `text-base` / `text-muted` / `text-subtle` | Typography | gray-900 / 500 / 400 |

### State management (Zustand)

**`useCourseStore`** — everything enrollment-related:
- `courses` — catalog fetched for the current student grade + semester
- `sectionsByCourseId` — per-course section cache (lazy, fetched on accordion expand)
- `schedule` — committed enrollments from the server
- `pendingEnrollments` — staged (not yet saved); shown as dashed blocks on calendar
- `conflictingSlotIds` — timeslot IDs that appear in 2+ sections (enrolled + pending); used to paint blocks red
- `commitPending` — POSTs each pending section; toasts from backend errors only; keeps failed sections staged

**`useStudentStore`** — student profile and session identity (`studentId`).

### Enrollment UX flow
1. Student expands a CourseCard → sections lazy-load
2. Clicking **Add** stages the section in `pendingEnrollments` (no validation, always succeeds client-side)
3. Pending sections appear as dashed calendar blocks; red if a slot conflict is detected client-side
4. FAB (bottom-right) appears: **Cancel** clears pending, **Save N courses** calls `commitPending`
5. Backend validates each section; failures stay staged with toast messages; successes are cleared

### Primitive components (`src/components/ui/`)
| Component | Props | Use for |
|---|---|---|
| `Badge` | `variant` (primary/success/warning/danger/pending/neutral) | Inline status labels |
| `Button` | `variant`, `size`, `loading` | Any clickable action |
| `Card` | `noPadding` | White rounded-xl shadow container |

---

## Database

Schema details in `challenge/DATABASE.md`. Key tables:

| Table | Notes |
|-------|-------|
| `students` | 400 pre-seeded; `status = 'active'` |
| `courses` | 57 courses; `prerequisite_id` self-ref FK |
| `course_sections` | Created for current semester; holds `semester_id`, `teacher_id` |
| `section_meetings` | Joins section → timeslot → classroom (N meetings per section) |
| `enrollments` | `status`: `enrolled` or `dropped` |
| `student_course_history` | Historical pass/fail per course per semester |
| `semesters` | `is_active = 1` flags the current semester |

The database file (`maplewood_school.sqlite`) is committed to the repo root and is the single source of truth for both dev and test. The backend test suite uses an in-memory H2 database (see `application-test.properties`).

---

## Common tasks

**Add a new business rule** → `EnrollmentService.enrollStudent()`, add a `ValidationErrorDTO` to `errors`, add the code to `EnrollmentErrorCode`.

**Change the brand color** → Edit `--color-primary-*` in `src/index.css` to point at a different Tailwind palette.

**Add a new subject specialization** → Add an entry to `SUBJECT_COLORS` in `src/lib/specializationColors.ts` and the same key to `ScheduleBlock.tsx`'s `SUBJECT_COLORS` map.

**Add an API endpoint** → Controller method → Service method → (optional) new DTO → add typed wrapper in `src/api/client.ts`.
