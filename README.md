# StackWise

A puzzle-first learning platform for computer science foundations. Four tracks: algorithms, object design, distributed systems, and machine learning.

The idea it is built on: most courses explain the answer and then ask you to apply it. StackWise makes you commit to a guess first, then solve the thing by hand under a budget, and only then shows you the explanation and the code. The explanation lands harder because you were wrong two minutes earlier.

## The five-phase loop

Every concept runs the same five phases, in order.

| Phase | What happens |
|---|---|
| Predict | A multiple choice question you must answer before anything moves. Locked once answered. |
| Play | The puzzle. Direct manipulation under a budget. No code. |
| Reveal | What the budget was actually measuring. |
| Implement | The same idea written out, with notes on the non-obvious parts. |
| In the wild | Where it shows up in real software, with a confidence label and a source note. |

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The first build downloads the web fonts through `next/font`, so it needs network access once. After that they are self-hosted and cached.

```bash
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # vitest, engines plus content
```

## Analytics

Google Analytics is wired through `@next/third-parties`. Copy `.env.example` to `.env.local` and set your measurement id:

```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Leave it empty and the analytics component renders nothing, so local development sends no events.

## No accounts

There is no auth and no database. Progress lives in `localStorage` under the key `stackwise-progress`, written through Zustand's `persist` middleware. Clearing browser data clears progress and there is no recovery path. This is stated in the footer and on the progress page.

The consequence worth knowing: progress does not follow a learner across devices, and you cannot see a mentee's progress from your own machine. Adding that later means adding auth and a database, and the store is shaped so the swap is contained to one file.

## Architecture

The one decision that matters: **each track has a small pure-TypeScript engine, and every level is data that the engine reads.** Lessons are JSON-shaped objects, not bespoke React components. Adding a concept means writing content, not writing a component.

```
src/
├── engines/          pure TypeScript, zero React imports
│   ├── arrayops/     operation-budget machine (sorting, searching)
│   ├── blueprint/    blast-radius model (coupling, cohesion)
│   ├── traffic/      deterministic capacity and queue simulator
│   └── boundary/     decision boundary, logistic regression, kNN
├── content/
│   ├── tracks.ts     track definitions and lookup helpers
│   ├── puzzles.ts    every level, keyed by puzzle id
│   └── concepts/     one file per track, the authored lessons
├── features/
│   ├── concept/      the phase runner and concept list
│   ├── puzzles/      one React renderer per engine, plus the dispatcher
│   └── progress/     Zustand store and the progress board
├── components/
│   ├── ui/           Panel, Button, CodeBlock, BudgetMeter, ConfidenceTag
│   ├── layout/       header and footer
│   └── analytics/    Google Analytics wrapper
├── app/              routes
├── lib/              formatting helpers
└── types/            content and phase types
tests/                engine tests and content regression tests
```

Engines never import React. That keeps them testable in plain Node and means the scoring logic has exactly one implementation.

### Why the budget meter is everywhere

The same `BudgetMeter` component renders operation count in algorithms, blast radius in object design, and credit spend in systems. Cost reads identically across tracks, so a learner arriving at track three already knows how to read the constraint.

## Adding a concept

1. Add a level to `src/content/puzzles.ts` under a new puzzle id.
2. Add a `Concept` object to the right file in `src/content/concepts/`.
3. Add its slug to nothing else. `tracks.ts` derives track membership from the concept files.
4. Run `npm run test`. The content suite will fail if the puzzle is unreachable, unsolvable, or unused.

### Adding a track

Add an engine folder, a renderer in `src/features/puzzles/`, a case in `PuzzleHost`, a variant in `PuzzleDefinition`, and a `Track` entry. The `PuzzleDefinition` union is discriminated, so TypeScript will point at every place that needs updating.

## Tests

46 tests across five files.

- `arrayops`, `blueprint`, `traffic`, `boundary` cover engine behaviour: cost accounting, invalid input, determinism, conservation of requests, and the scoring rules.
- `content.test.ts` is the one that protects the teaching. It checks that every prerequisite resolves, every play phase has a registered puzzle, every puzzle is used, and every real-world case carries a source note. It then checks each puzzle against the lesson it claims to teach:
  - insertion sort clears its budget
  - binary search needs the full budget, so scanning cannot pass
  - both blueprint levels have at least one clearing arrangement, found by exhaustive search
  - the read-heavy level cannot be cleared without a cache, and stacking app servers changes nothing
  - the write-heavy level is unmoved by read replicas, to the decimal
  - the neighbour level overfits at low k and underfits at high k

That last group exists because content drift is the real risk here. Retuning a level to feel better can quietly break the lesson it was built to teach. Three of these tests caught exactly that during the build: two blueprint levels were unsolvable, and the write-heavy level could be rescued by replicas, which is the opposite of its point.

## Content and sources

Topics follow four books:

- Introduction to Algorithms (CLRS), 4th edition
- Designing Data-Intensive Applications (DDIA), 2nd edition
- Head First Object-Oriented Analysis and Design
- Understanding Machine Learning: From Theory to Algorithms

Topic sequences and curricula are not copyrightable, so teaching the same subjects in a similar order is fine. Exercises, problem statements, pseudocode, figures, and prose are not. Every explanation, puzzle, and code sample here is written from scratch. Nothing is reproduced from any of the four books.

Every real-world case carries one of three confidence labels, rendered in the UI next to a source note:

- **verified** — checked against a primary source named in the note
- **widely documented** — standard in public engineering literature, not re-verified line by line
- **interpretation** — a design argument, not a sourced claim

The labels are part of the content type, so a case cannot ship without one.

## Accessibility

Colour pairs were checked against the palette. Cream on the deep navy background is about 10:1, and the sky, rose, and light umber accents all clear 4.5:1. The raw umber `#685044` is used only as a fill on light surfaces, never as text on the dark background, where it sits at roughly 1.4:1.

Puzzle controls are real buttons and selects, the budget meter exposes `role="meter"` with live values, results are announced through `role="status"`, there is a skip link, focus is visible, and `prefers-reduced-motion` is respected.

## Known limits

- Progress is per browser. No cross-device sync and no mentor view.
- Eight concepts, two per track. The architecture is built for more, the content is not written yet.
- The traffic simulator is a teaching model, not a queueing-theory model. It uses fixed per-tick capacities and no latency distribution, which is enough to show where a chain breaks and not enough to size real infrastructure.
- The code phase shows code, it does not run it. Adding execution means a Web Worker sandbox, which is a separate piece of work.
