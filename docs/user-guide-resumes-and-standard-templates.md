# ResumeAI user guide: creating and editing resumes (aligned with professional template principles)

This guide explains how to use **ResumeAI** end-to-end after the app is running (local or deployed). It also maps your workflow to the kind of **structure, clarity, and formatting discipline** promoted by professional resume builders such as [Standard Resume’s resume templates](https://standardresume.co/resume-templates)—for **content and layout habits**, not as a pixel-perfect copy of any third-party template.

> **Relationship to Standard Resume:** Standard Resume emphasizes automatic formatting, hiring-manager–friendly layouts, easy switching between template styles, and built-in best practices ([their template overview](https://standardresume.co/resume-templates)). ResumeAI gives you a **guided editor**, **live preview**, **theme accent colors**, **AI-assisted text** for summary and bullets, and **PDF export**. Use the ideas below to steer your content toward the same goals: scannable, one-page–friendly, and role-focused.

---

## Before you start

1. **Sign in** via `/sign-in` or create an account via `/sign-up` (Clerk).
2. Open **`/dashboard`** once authenticated. You should see your resume grid and the option to create a new resume.

---

## Creating a new resume

1. On the **Dashboard**, click the **dashed “add” tile** (plus icon).
2. In the dialog, enter a **resume title** (e.g. `Software Engineer — 2026` or `Marketing — Acme Co`) and submit.
3. You are taken to **`/my-resume/[id]/edit`**, the step-by-step editor.

---

## Editor walkthrough (five steps)

The form is a **wizard** with **Prev / Next**. Progress through:

| Step | Section        | What to enter |
|------|----------------|---------------|
| 1    | Personal       | Name, job title, contact (address, phone, email). |
| 2    | Summary        | Professional summary; optional **AI** suggestions by job title or trait presets. |
| 3    | Experience     | Roles, companies, dates; optional **AI**-generated bullet descriptions (activity levels). |
| 4    | Education      | Schools, degrees, dates; optional **AI** descriptions. |
| 5    | Skills         | Skills list aligned to the role. |

**Saving:** On the last step, **Next** runs **Save** (persists personal fields, experience, education, skills) and redirects to **`/my-resume/[id]/view`**.

**Theme:** Use the **Theme** control (top of the editor) to pick an **accent color** stored on the resume. This affects preview styling; pick a color that matches the tone you want (e.g. conservative navy vs. brighter accent for creative roles)—similar to choosing between **professional / simple / modern** vibes on template galleries.

---

## Using AI effectively (Gemini)

ResumeAI calls Gemini for:

- **Summary** — variants by seniority or personality presets (see `generateSummary` in the codebase).
- **Experience** — bullet-style narratives with optional simple HTML (`<b>`, `<ul>`, etc.) for emphasis.
- **Education** — short reflective descriptions.

**Tips (Standard Resume–style discipline):**

- **Start from a target job title** in Personal/Step 1 so summary AI stays relevant.
- Prefer **one clear headline** in the summary (who you are + what you solve), then 2–4 lines—mirroring “built-in best practices” and scannability.
- For experience AI output, **edit ruthlessly**: keep **metrics**, **verbs**, and **scope**; remove filler so the page stays dense and readable like a strong template.

---

## Preview, PDF, and sharing

On **`/my-resume/[id]/view`**:

- **Download** generates a **PDF** from the on-screen resume (`A4`, portrait) via the browser.
- **Share** uses the device share sheet where supported.
- **Public preview**: shared links can show a read-only preview for others (see in-app copy on the view page).

**Formatting tips for PDFs:**

- Keep sections in a logical order: contact → summary → experience → education → skills (ResumeAI’s flow matches common US resume conventions, similar to what [Standard Resume describes](https://standardresume.co/resume-templates) for professional layouts).
- Avoid huge blocks of text; short bullets trump paragraphs for experience.

---

## Editing an existing resume

1. From **Dashboard**, open a **resume card** (your list of saved resumes).
2. Choose **edit** (or the route your UI provides) to return to **`/my-resume/[id]/edit`**.
3. Walk the steps again, change fields, re-run AI where useful, adjust **Theme**, then save on the final step.

---

## Adapting “template style” without leaving ResumeAI

Standard Resume’s gallery groups ideas like **professional**, **simple**, **modern**, and **creative** ([category links on their templates page](https://standardresume.co/resume-templates)). You can approximate that **in content and restraint**, not by importing their files:

| Style goal | What to do in ResumeAI |
|------------|-------------------------|
| **Professional** | Neutral summary; formal job titles; metrics in experience; subdued theme color. |
| **Simple** | Short summary; fewer bullets per job; minimal AI adjectives; plenty of white space in preview. |
| **Modern** | Strong summary hook; skills aligned to stack/tools; slightly bolder theme; concise bullets. |
| **Creative** (use sparingly) | More personality in summary; still keep experience factual; avoid noisy colors if printing. |

---

## Troubleshooting

- **Cannot sign in:** See [docs/clerk-production.md](./clerk-production.md) (production keys, Development-instance limits, temporary `pk_test_` deploy path).
- **AI errors:** Confirm `GEMINI_API_KEY` is set in your environment (Doppler or `.env`).
- **Empty dashboard:** Hard refresh; confirm the same Clerk user you used when creating resumes.

---

## References

- [Standard Resume — resume templates](https://standardresume.co/resume-templates) — inspiration for layout discipline and template categories.
- [Standard Resume — resume examples](https://standardresume.co/examples) — optional reading for tone and section strength (e.g. software engineer, designer).
