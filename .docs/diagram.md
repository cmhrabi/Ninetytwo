# How the pipeline works

These diagrams show what runs in the browser (frontend) and what runs on the server (backend).
They are accurate as of `main` at stage 08 (7fa4594), plus the rubric-as-config test from stage 09.

**Legend:** a solid arrow is wired and used today. A dashed arrow is built and tested in the
backend, but the UI doesn't call it yet. Until it does, `npm run smoke` (over HTTP) and
`npm run calibrate` (in-process) drive those steps.

## 1. Frontend and backend

```mermaid
flowchart TB
    subgraph pages["Next.js pages (frontend)"]
        landing["Landing and assess pages<br/>src/app/"]
        content[("Team copy: content/*.md<br/>read by src/lib/content.ts")]
    end

    subgraph browser["Browser (frontend)"]
        ui["Assess screen<br/>src/components/assess/"]
        state["AssessmentProvider<br/>src/state/"]
        client["Typed API client<br/>src/lib/api.ts"]
        overall["computeOverall<br/>src/shared/score.ts"]
    end

    scripts["npm run smoke (HTTP)<br/>npm run calibrate (in-process)"]

    subgraph routes["src/app/api/ (backend)"]
        samples["GET /api/samples<br/>GET /api/samples/:id"]
        extract["POST /api/extract"]
        scan["POST /api/scan"]
        judge["POST /api/judge/:criterion"]
        meta["GET /api/health<br/>GET /api/rubric"]
    end

    subgraph server["src/server/ (backend)"]
        services["services/ (I/O)<br/>samples, extractText, scan,<br/>judge, cache, rubricStore"]
        core["core/ (pure functions)<br/>paragraphs, pii, phraseScan,<br/>mergeScan, prompts, quoteCheck,<br/>applyRubric, hash"]
        ai["services/openrouter.ts<br/>completeJson(), the only AI caller"]
        files[("Repo files<br/>rubric/, samples/, cache/")]
    end

    openrouter(["OpenRouter<br/>SCAN_MODEL, JUDGE_MODEL"])

    landing --> content
    landing -->|"renders"| ui
    ui --> state
    state --> client
    client -->|"sample list, sample text"| samples
    client -->|"upload"| extract
    client -.->|"not called yet"| scan
    client -.->|"not called yet, 3 in parallel"| judge
    client -.-> overall
    scripts --> scan
    scripts --> judge
    samples & extract & scan & judge & meta --> services
    services --> core
    services --> ai
    services --> files
    ai --> openrouter
```

| Runs in | What | Owner | Files |
| --- | --- | --- | --- |
| Browser | Assess screen, assessment state, typed API client, overall score | Tech A (score math: Tech B) | `src/components/`, `src/state/`, `src/lib/api.ts`, `src/shared/score.ts` |
| Next.js server, pages | Landing and assess pages, team copy | Tech A (copy: the team) | `src/app/**/page.tsx`, `src/app/layout.tsx`, `src/lib/content.ts`, `content/` |
| Next.js server, API | Thin route handlers: parse, call `src/server/`, respond | Tech B | `src/app/api/**/route.ts` |
| Server only | Extraction, scan, judge, quote check, scoring, cache, AI client | Tech B | `src/server/` |
| Repo files | Rubric, sample policies, cached runs | Tech B and the team | `rubric/`, `samples/`, `cache/` |
| External | The AI models | | OpenRouter |

## 2. One assessment, step by step

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant B as Browser (state and lib/api.ts)
    participant R as API routes (src/app/api)
    participant S as Server code (src/server)
    participant O as OpenRouter

    U->>B: Pick a sample, or drop a PDF, DOCX or TXT
    alt Sample
        B->>R: GET /api/samples/:id
    else Upload
        B->>R: POST /api/extract (multipart, max 4 MB)
    end
    R->>S: Read text in memory, split into numbered paragraphs, strip emails and phones
    S-->>B: DocumentText with paragraphs p1 to pn
    U->>B: Tick consent, press Run
    Note over B,O: Today Run only marks the document ready. The steps below are built and<br/>tested in the backend, and npm run smoke drives them until the UI calls them.
    B->>R: POST /api/scan with the paragraphs
    R->>S: Keyword scan over the rubric phrases (code)
    S->>O: 1 call to SCAN_MODEL
    O-->>S: Relevant paragraphs per criterion, red-flag quotes
    S-->>B: ScanResult, merged (keyword-only if the AI call failed)
    par H1
        B->>R: POST /api/judge/H1 with the paragraphs and scan
    and H3
        B->>R: POST /api/judge/H3
    and H5
        B->>R: POST /api/judge/H5
    end
    R->>S: Build one prompt per criterion
    S->>O: 3 calls to JUDGE_MODEL, in parallel
    O-->>S: Findings with exact quotes, never scores
    S->>S: Verify every quote, apply the rubric rules
    S-->>B: 3 CriterionResults
    B->>B: computeOverall gives the percent, band and warnings
```

## 3. Inside one judge call, with the cached fallback

```mermaid
flowchart TD
    start["POST /api/judge/:criterion"] --> known{"Criterion in rubric.json?"}
    known -->|"no"| e404["404 not_found"]
    known -->|"yes"| body{"Valid body?<br/>emails and phones stripped again"}
    body -->|"no"| e400["400 bad_request"]
    body -->|"yes"| aicall["completeJson()<br/>JUDGE_MODEL, strict JSON schema,<br/>one retry on a bad reply"]
    aicall -->|"reply matches the schema"| verify["Verify each quote<br/>core/quoteCheck.ts"]
    verify --> rules["Apply the rubric rules<br/>core/applyRubric.ts"]
    rules --> live["200 CriterionResult<br/>cached: false"]
    aicall -->|"ai_failed or rate_limited"| hash{"Is the text a sample policy?<br/>sha256 matches a file in cache/"}
    hash -->|"yes"| cached["200 saved calibration result<br/>cached: true"]
    hash -->|"no, e.g. an upload"| eai["502 ai_failed or 429 rate_limited"]
    aicall -->|"any other error"| e500["500 internal"]
```

Code, not the model, decides every score. A check counts only with a verified quote. A verified
red flag sets the criterion to 0. H1 = 0 or H3 = 0 raises a baseline warning. See the
[README](../README.md#creative-use-of-technology-criterion-4) for the rules.
