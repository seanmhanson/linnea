# Copilot Instructions

## Application Overview

Linnea is a personal wildflower observation journal. An admin user uploads photos, goes through a guided identification process (iNaturalist primary, Claude secondary), and the results are published in a public-facing gallery. The public gallery requires no authentication and has no search/filter UI in initial scope.

## Auth & Routes

- `/admin` — protected, admin user only (next-auth)
- All other routes — public, no auth required
- There are no update or delete routes in initial scope; create and read only

## Observation Creation Flow

1. Admin uploads one to eight images as a "batch" to be processed
2. EXIF metadata is extracted client-side; identifying EXIF is stripped, **GPS coordinates are retained in client state only**
3. Each image in the batch is uploaded to Cloudinary (free tier)
  - the returned URL is stored in the observation as `image` 
  - if the upload fails, abort the observation creation flow and return an error to the admin
  - do not proceed to iNaturalist scoring without a valid image URL
4. iNaturalist `score_image` endpoint is called once for each uploaded image and corresponding lat/lng, and observed date
  - if the iNaturalist call fails entirely, surface the error to the admin and halt the flow
  - do not silently fall through to Claude
5. Each `score_image` call returns up to 5 candidates with `combined_score`, `vision_score`, `frequency_score`, and taxon info; the UI presents all candidates for each processed image and allows the admin to select a best fit for each image (optional) and flag if additional review is required (optional).
6. A call to Claude is made according to these rules:

| Condition | Include Image in Claude Call? | Confidence Source |
| --------- | -------------- | ----------------- |
| No candidates returned across all iNaturalist calls	 | Yes (skip selection step, include all) | Claude Response or observation discarded if no identification is returned |
| Admin selects no candidate                               | Yes (include)                      | Claude Response or observation discarded if no identification is returned |
| Admin selects a candidate with `combined_score >= 85`    | No                                       | Set to `"high"`                                                           |
| Admin selects a candidate and explicitly requests Claude | Yes                                      | Claude response (takes precedence over fast-path default)                 |
| Admin selects a candidate with `combined_score < 85`     | Yes                                      | Claude response                                                           |

7. When Claude is called, the Anthropic API receives all uploaded images, selected taxon (if any), location name, observed date, and cultivated flag; Claude returns a confidence level (`"high"` | `"medium"` | `"low"`). If the Anthropic API call fails or returns a malformed response, surface the error to the admin and do not persist the observation. Do not default confidence to any value silently.

## Security / PII Rules

- **GPS coordinates must never appear in any POST body or be persisted to the database**
- Location is stored as `locationName` (a human-readable string), never as coordinates
- EXIF data is stripped from images before upload; GPS is the only EXIF field kept, and only transiently in client state
- `$jsonSchema` collection validation is used in MongoDB to enforce the data model at the DB level

## External Integrations

| Service                | Purpose                               | Key detail                                             |
| ---------------------- | ------------------------------------- | ------------------------------------------------------ |
| iNaturalist            | Species identification scoring        | `score_image` endpoint; returns up to 5 candidates     |
| Anthropic (`claude-*`) | Secondary identification + confidence | See decision table in Observation Creation Flow step 6 |
| Cloudinary             | Image hosting                         | Free tier; store returned URL as `image`            |

## Data Model (`Observation`)

Key fields — do not add GPS fields to this type or the MongoDB schema:

- `commonName`, `scientificName`, `taxonId`, `inatTaxonId` — species identity
- `locationName` — human-readable location string (no coordinates)
- `observedAt` — date of observation
- `cultivated` — boolean
- `image` — Cloudinary URL (string)
- `confidence` — `"high"` | `"medium"` | `"low"`
- `identificationNotes`, `description` — optional text
- `createdAt` — set server-side on insert

## Package Manager

Always use **yarn** (not npm).

Key scripts:

- `yarn dev` — start dev server
- `yarn test:unit` — unit tests only
- `yarn test:integration` — integration tests only
- `yarn lint` / `yarn format`

## TypeScript & Path Aliases

- `@/*` maps to the **repo root** (not `src/`). Examples: `@/src/util/Config` for source utilities, `@/app/layout.tsx` for App Router files.
- `strict: true`, target ES2022, moduleResolution `bundler`
- ESM only — no `require()`

## Project Structure

```
|__ app/ — Next.js App Router pages and layouts
|__ src/
    |__ controller/ — request handlers / route logic
    |__ dao/ — data access objects (extend BaseDao)
    |__ mapper/ — mapppers, corresponding TypeScript types and MongoDB $jsonSchema definitions
    |__ provider/ — infrastructure (DatabaseProvider)
    |__ util/ — shared utilities (Config)
```

## Code Patterns

- **Providers** - singletons that manage communication with an external service, such as the database, iNaturalist API, or Claude API
  - **DatabaseProvider** — singleton default export; named export DatabaseProvider class for testing
- **DAOs** — extend BaseDao<T>, receive IDatabaseProvider via constructor injection
- **Mappers** - transform data into a common object for ingestion by a DAO, and vice-versa
- **Services** - divide up and aggregate tasks for a given request, communicating with DAOs, Mappers, and other layers
  - Note: Services do not import controllers
- **Utilities** - stand-alone utilities and classes for dedicated purposes such as wrapping environmental variables, string transformations, error identifcation, or other tasks
  - **Config** — singleton, access via getConfig(), reset in tests with resetConfig()
- **Controllers** - handle HTTP requests and routes and translating of incoming and outgoing data

## MongoDB Conventions
- names used at all levels in MongoDB should use `camelCase`
- fields that are `null` or `""` should be omitted from documents

## Testing

### Overview
Testing uses `vitest` and configures two named projects

| Project | Pattern | Notes |
| ------- | ------- | ----- |
| unit | `src/**/__tests__/*.spec.ts(.tsx)` | Mock all external deps |
| integration | `src/**/__tests__/*.int.ts(.tsx)` | Use `mongodb-memory-server`; never mock MongoClient |

### File and Directory Structure
Test files are consistently identifiable by extension:
- `.spec.ts(x)` for unit tests
- `.int.ts(x)` for integration tests
- `.fixture.ts(x)` for test fixtures

Test files and their subjects are identifiable due to co-location. Given a subject field located in `src/<module>`, corresponding tests and fixtures are found in `src/<module>/__tests__`.

### Test Structure

#### Global Scope & Root-Level Describe
- each file has a root level `describe` block that contains the subject's path (ex: `src/<module>/subject`)
- all other test blocks in the file should be inside the root level `describe` block
- all state should be stored and managed inside the root level describe block
- constants, types, and other non-state values may exist in the global scope

#### Describe & It Blocks
- for tests that directly correspond to a specific method or function, group these tests in a `describe` block labeled by the method or function name prefaced by `#`. `describe` blocks corresponding to a constructor do not use the `#` prefix
  - **ex:** `#classMethod`, `#standaloneFn`, `#exportedFn`, `constructor`
- for tests that do not correspond specifically in this way, group tests based off the the use-case being tested using a `describe` block labeled semantically:
  - the lowest-level should start with `when` (ex: `when querying for a user`)
  - nested `describe` blocks should start with `and` (ex: `and the query is successful`)
  - tests in `it` blocks use labels that integrate the preceding "it" (ex: `it('returns the user object')`)

### Testing Style

#### Setup & Teardown
- `beforeEach/All` and `afterEach/All` are preferred over `try/finally` blocks
  - helper functions may be included for setup of initial state and mocks to be shared across tests
- use `vi.stubEnv` and `vi.unstubAllEnvs` for overriding `env` variables and values on `process`
  - use native deletion for deleting these values when required
- mock constructors require regular `function` expressions, not arrow functions
