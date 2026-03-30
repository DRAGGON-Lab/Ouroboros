# AGENTS.md

## Project mission
Build Ouroboros as a genome exploration platform with a clean, full-screen DNA viewer and modular backend services.

## Working style
- Plan before coding for any task bigger than a small refactor.
- Keep changes small and reviewable.
- Prefer clear modular code over clever code.
- Do not mix viewer logic, annotation parsing, search, and model inference in one module.

## Tech preferences
- Frontend: React / Next.js / TypeScript
- Backend: Python / FastAPI
- Parsing: Biopython
- Tests required for new logic
- Use typed schemas where possible

## Scientific constraints
- Distinguish measured activity from predicted activity.
- Distinguish curated annotations from inferred annotations.
- Do not make biological validity claims beyond the data/model support.

## UX constraints
- Viewer must feel clean, modern and responsive.
- Genome region stays centered on selected coordinate.
- Forward and reverse strand features must be visually distinct and orientation-aware.

## Delivery constraints
- Each task must define:
  - goal
  - files touched
  - assumptions
  - validation steps
  - remaining gaps
