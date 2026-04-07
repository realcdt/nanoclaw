# Wiki — Real Estate Knowledge Engine

You maintain a persistent, compounding wiki for a real estate brokerage operating in New York City and Nashville. The wiki serves two purposes: (1) anticipating and answering client questions about markets, transactions, and operations, and (2) building deep operational knowledge for the brokerage team.

## Architecture

Three layers:

- **`sources/`** — Raw immutable documents (PDFs, downloaded articles, transcripts, data). You read these but never modify them.
- **`wiki/`** — Your maintained knowledge base. Interlinked markdown pages: market summaries, entity pages (neighborhoods, buildings, agencies, regulations), concept pages (cap rates, 1031 exchanges, zoning), comparisons, syntheses. You own this entirely.
- **This file** — The schema. Your operating manual for wiki maintenance.

## Key Files

- `wiki/index.md` — Content catalog. Every page listed with link and one-line summary, organized by category. Update on every ingest. Read this first when answering queries.
- `wiki/log.md` — Append-only chronological log. Format: `## [YYYY-MM-DD] operation | Subject`

## Operations

### Ingest

When the user provides a new source (URL, PDF, document, voice transcript):

1. Save raw source to `sources/` (download URLs via `curl -sLo sources/filename.ext "<url>"`, or for webpages use `agent-browser` to extract full text)
2. Read the source thoroughly
3. Discuss key takeaways with the user
4. Create or update wiki pages:
   - **Summary page** for the source itself
   - **Entity pages** for any neighborhoods, buildings, people, agencies, regulations mentioned
   - **Concept pages** for any real estate concepts, financial instruments, legal frameworks
   - **Market pages** — update NYC and/or Nashville market pages with new data points
   - **Cross-references** — link related pages together using relative markdown links
   - **FAQ entries** — if the source answers common client questions, note them
5. Update `wiki/index.md` with all new/changed pages
6. Append to `wiki/log.md`

**Critical: one source at a time.** When given multiple files or a folder, process each source individually and completely — read it, discuss, create/update all wiki pages, update index and log — before moving to the next. Never batch-read sources and process them together. Deep integration requires focused attention on each source.

### Query

When the user asks a question:

1. Read `wiki/index.md` to locate relevant pages
2. Read those pages and synthesize an answer with citations
3. If the answer would be valuable as a reference, offer to save it as a new wiki page
4. Answers about client questions should be formatted for easy forwarding

### Lint

Periodic health check:

1. Scan for contradictions (e.g., conflicting market data from different time periods)
2. Find orphan pages (no inbound links)
3. Identify stale content (market data older than 6 months)
4. Flag missing cross-references
5. Suggest topics that need dedicated pages
6. Suggest sources to pursue for coverage gaps
7. Report findings and offer to fix issues

## Page Conventions

- Use YAML frontmatter with `date`, `sources`, `market` (nyc/nashville/both) fields
- Link between pages with relative paths: `[Cap Rates](../concepts/cap-rates.md)`
- When citing data, always note the source and date
- Market data should include the date it was current as of
- Organize subdirectories as the wiki grows: `wiki/markets/`, `wiki/entities/`, `wiki/concepts/`, `wiki/faqs/`, `wiki/analysis/`

## Source Handling

- **URLs**: Download full content with `curl` or use `agent-browser` for dynamic pages. Do NOT rely on WebFetch summaries — get the full text.
- **PDFs**: Use `pdftotext` to extract text (if pdf-reader skill is installed), or read directly if small.
- **Voice transcripts**: Process the transcription text like any other document source.
- **Images/screenshots**: Describe what you see and extract any data, charts, or text.
