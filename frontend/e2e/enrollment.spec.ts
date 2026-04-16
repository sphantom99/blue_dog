/**
 * Enrollment E2E tests
 *
 * Covers the four scenarios from the problem statement:
 *   1. Valid enrollment (happy path)
 *   2. Prerequisite violation blocked by backend
 *   3. Time conflict blocked by backend
 *   4. Course limit (max 5) blocked by backend
 *
 * Prerequisites:
 *   - Backend running on http://localhost:8080
 *   - Frontend running on http://localhost:5173
 */

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// ── REST helpers ───────────────────────────────────────────────────────────

async function dropAllEnrollments(studentId: number) {
	const resp = await fetch(`http://localhost:8080/api/students/${studentId}/schedule`);
	if (!resp.ok) return;
	const data = await resp.json();
	for (const section of data.enrolledSections ?? []) {
		if (section.enrollmentId) {
			// Drop endpoint is PATCH /api/enrollments/{id}/drop (not DELETE)
			await fetch(`http://localhost:8080/api/enrollments/${section.enrollmentId}/drop`, {
				method: "PATCH",
			});
		}
	}
}

// ── Page helpers ───────────────────────────────────────────────────────────

async function loginAs(page: Page, studentId: number) {
	await page.goto("/login");
	await page.fill("#studentId", String(studentId));
	await page.click('button[type="submit"]');
	await page.waitForURL("**/dashboard");
	await page.waitForSelector("text=Plan Semester");
}

async function goToEnroll(page: Page) {
	await page.click("text=Plan Semester");
	await page.waitForURL("**/enroll");
	// Wait for the course list to render — targets the desktop split pane only.
	// (There are two search inputs in DOM: one mobile [hidden at 1280px], one desktop.)
	await page.waitForSelector(".md\\:flex .font-mono", { state: "visible" });
}

/**
 * Stage a section:
 * 1. Type the course code into the desktop search box (filters to one result)
 * 2. Click the accordion to expand it
 * 3. Click the Add button for the given section label (A=first, B=second, …)
 * 4. Clear the search
 */
async function addSection(page: Page, courseCode: string, sectionLabel = "A") {
	// Desktop search input — inside the hidden md:flex split pane
	const search = page.locator(".md\\:flex input[placeholder='Search courses...']");
	await search.fill(courseCode);

	// Accordion button — the button inside the desktop pane that contains the code text
	const accordion = page
		.locator(".md\\:flex")
		.getByRole("button")
		.filter({ hasText: courseCode })
		.first();
	await accordion.waitFor({ state: "visible" });
	await accordion.click();

	// After the accordion expands, Add buttons appear.
	// Filtering to one course means the only Add buttons belong to that course.
	// Section labels are ordered A, B, C… so A=index 0, B=index 1.
	const sectionIndex = Math.max(0, sectionLabel.toUpperCase().charCodeAt(0) - 65);
	const addBtn = page
		.locator(".md\\:flex")
		.getByRole("button", { name: "Add" })
		.nth(sectionIndex);
	await addBtn.waitFor({ state: "visible" });
	await addBtn.click();

	// Clear filter so the next call sees the full list
	await search.fill("");
}

/** Click the Save FAB and wait for a toast (success or error). */
async function saveEnrollments(page: Page) {
	const saveBtn = page.getByRole("button", { name: /Save \d+ course/ });
	await saveBtn.waitFor({ state: "visible" });
	await saveBtn.click();
	// Toast element has shadow-lg and border and text-sm classes
	await page.waitForSelector("div.shadow-lg.border.text-sm", { timeout: 10_000 });
}

// ── Test data ──────────────────────────────────────────────────────────────
//
// Student   2 — Patricia Baker,  grade  9, no history         (conflict + max-5)
// Student 101 — Carol Smith,     grade 10, no ENG102 pass     (prereq violation)
// Student 301 — Joshua Phillips, grade 12, passed ENG102      (valid enrollment)
//
// Five conflict-free section IDs for the max-5 test (verified in sqlite3):
//   id  code      label  timeslot-ids
//    1  ENG101    A      {1,8,14,23,30}
//   15  SOC101    B      {4,12,22,29}
//   19  PHOT101   A      {6,9,18}
//   21  MUS101    B      {10,17,19}
//   36  GERM101   A      {5,11,13,26}

const PATRICIA = 2;    // grade  9, no history
const CAROL    = 101;  // grade 10, has passed ENG101 but NOT ENG102
const JOSHUA   = 301;  // grade 12, has passed ENG102

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe("Enrollment scenarios", () => {
	test.beforeEach(async () => {
		// Guarantee clean state regardless of previous run leftovers
		await dropAllEnrollments(PATRICIA);
		await dropAllEnrollments(CAROL);
		await dropAllEnrollments(JOSHUA);
	});

	test.afterEach(async () => {
		await dropAllEnrollments(PATRICIA);
		await dropAllEnrollments(CAROL);
		await dropAllEnrollments(JOSHUA);
	});

	// ── Scenario 1: Valid enrollment ─────────────────────────────────────────
	test("valid enrollment succeeds and appears on the calendar", async ({ page }) => {
		// Joshua has passed ENG102 so ENG201 is enrollable
		await loginAs(page, JOSHUA);
		await goToEnroll(page);

		await addSection(page, "ENG201", "A");

		// FAB appears when there are pending enrollments — proves the section was staged
		await expect(page.getByRole("button", { name: /Save 1 course/ })).toBeVisible({ timeout: 5_000 });

		await saveEnrollments(page);

		// Success — green toast
		await expect(page.locator("div.bg-green-50").first()).toBeVisible({ timeout: 8_000 });
	});

	// ── Scenario 2: Prerequisite violation ──────────────────────────────────
	test("enrolling without a prerequisite is blocked with an error toast", async ({ page }) => {
		// Carol (grade 10) has passed ENG101 but not ENG102.
		// ENG201 requires ENG102 → backend must block with PREREQ_NOT_MET.
		await loginAs(page, CAROL);
		await goToEnroll(page);

		await addSection(page, "ENG201", "A");
		await saveEnrollments(page);

		// Error toast
		await expect(page.locator("div.bg-red-50").first()).toBeVisible({ timeout: 8_000 });
	});

	// ── Scenario 3: Time conflict ────────────────────────────────────────────
	test("two sections sharing a timeslot turn red on the calendar", async ({ page }) => {
		// MAT101-A and ENG101-A both meet Monday 8:00 AM (timeslot id = 1)
		await loginAs(page, PATRICIA);
		await goToEnroll(page);

		await addSection(page, "ENG101", "A");
		await addSection(page, "MAT101", "A");

		// Both sections are staged — FAB shows "Save 2 courses"
		await expect(page.getByRole("button", { name: /Save 2 courses/ })).toBeVisible({ timeout: 5_000 });

		// At least one calendar block should carry the conflict title attribute
		await expect(page.locator('[title*="Time conflict"]').first()).toBeAttached({ timeout: 5_000 });

		await saveEnrollments(page);

		// Backend blocks the conflicting enrollment
		await expect(page.locator("div.bg-red-50").first()).toBeVisible({ timeout: 8_000 });
	});

	// ── Scenario 4: Course limit (max 5) ─────────────────────────────────────
	test("enrolling a 6th course is blocked by the backend", async ({ page }) => {
		// Pre-enroll Patricia in 5 non-conflicting sections via the API
		const sectionIds = [1, 15, 19, 21, 36];
		for (const sectionId of sectionIds) {
			const resp = await fetch("http://localhost:8080/api/enrollments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ studentId: PATRICIA, sectionId }),
			});
			const data = await resp.json();
			expect(
				data.success,
				`Pre-enroll section ${sectionId} failed: ${JSON.stringify(data)}`,
			).toBe(true);
		}

		await loginAs(page, PATRICIA);
		await goToEnroll(page);

		// Header must show 5/5
		await expect(page.locator("text=/5\\s*\\/\\s*5/")).toBeVisible({ timeout: 5_000 });

		// Try to add a 6th course (ART101 — no prerequisites, grade 9)
		await addSection(page, "ART101", "A");
		await saveEnrollments(page);

		// Backend returns MAX_COURSES_EXCEEDED → error toast
		await expect(page.locator("div.bg-red-50").first()).toBeVisible({ timeout: 8_000 });
	});
});
