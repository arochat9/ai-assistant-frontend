# AI Assistant Frontend - Copilot Instructions

## Architecture Overview

**Monorepo with 3 packages**: Builds as single-app deployment to Fly.io via Docker.

```
middleware/      → Express backend + serves built React frontend (port 3000)
web-frontend/    → React + Vite + TypeScript + Tailwind + shadcn/ui
shared/          → Shared TypeScript types/schemas (ESM modules)
```

**Key pattern**: Express serves static frontend files AND handles `/api/*` routes → no CORS needed.

## Critical Build & Deploy Knowledge

### Local Development Commands

-   **Backend**: `cd middleware && npm run dev` (nodemon + ts-node on port 3000)
-   **Frontend**: `cd web-frontend && npm run dev` (Vite dev server on port 5173)
-   **Shared package changes**: `cd shared && npm run watch` (auto-rebuild on save)

### Docker Build Order (middleware/Dockerfile)

1. Build `shared/` package (ESM modules)
2. Install & build `web-frontend/` (Vite → static files in `dist/`)
3. Install & build `middleware/` (TypeScript → Node.js)
4. Express serves both frontend + API routes

**Build-time secret**: `FOUNDRY_TOKEN` injected via `--build-secret` for NPM registry auth (Palantir Foundry SDK).

### Environment Variables

-   **Backend** (`middleware/.env`): `CLIENT_ID`, `CLIENT_SECRET`, `PORT` (optional)
-   **Frontend** (`web-frontend/.env`): `VITE_API_URL=http://localhost:3000` (dev only; production uses relative URLs)

## Foundry Integration Patterns

**Backend uses Palantir Foundry OSDK** to manage tasks in Foundry ontology.

### Data Flow

1. Frontend calls API → `middleware/src/controllers/tasks.controller.ts`
2. Controller validates with Zod schemas from `shared/schemas.ts`
3. Calls Foundry OSDK client (`middleware/src/config/foundry.ts`)
4. Converts OSDK Task → custom Task interface via `taskConverter.ts` (strips `runId` and `environment`)
5. Returns to frontend

### Key Conversion Pattern

**Always filters to `environment = "prod"`** in [taskQueries.ts](middleware/src/utils/taskQueries.ts#L13):

```typescript
const conditions = [{ environment: { $eq: Environment.PRODUCTION } }];
```

### Date Handling

-   **API Request**: Parse ISO strings → Date objects in [requestParser.ts](middleware/src/utils/requestParser.ts)
-   **API Response**: Dates automatically converted in frontend [api.ts](web-frontend/src/services/api.ts) axios interceptor
-   **Foundry API**: Convert Date objects → ISO strings before sending to OSDK

## Frontend State Management

### React Query Pattern

-   **All server state**: TanStack Query (`@tanstack/react-query`)
-   **Query keys**: `["tasks", filters]` - updates when filters change
-   **Mutations**: [useTaskMutations.ts](web-frontend/src/hooks/useTaskMutations.ts) with optimistic updates

**Optimistic update strategy**:

-   On create/update: immediately update ALL cached task queries (not just current filter)
-   On success: replace temp IDs with server response
-   On error: rollback all queries using snapshot

### Context Providers (App.tsx order matters)

```tsx
<TaskDrawerProvider>
    {" "}
    // Manages slide-out task detail drawer
    <TaskDialogProvider>
        {" "}
        // Manages create/edit dialogs
        <Layout>...</Layout>
    </TaskDialogProvider>
</TaskDrawerProvider>
```

## Shared Package (ESM Modules)

**CRITICAL**: `shared/` outputs ESM → **must use `.js` extensions in imports**:

```typescript
import { TaskStatus } from "./enums.js"; // ✅ Required
import { TaskStatus } from "./enums"; // ❌ Breaks
```

**Re-export pattern** in [shared/index.ts](shared/index.ts) for clean imports:

```typescript
export * from "./enums.js";
export * from "./schemas.js";
```

**Package contents**: Zod schemas, TypeScript interfaces, and enums for Task domain objects. Import from `"shared"` in both middleware and web-frontend (already linked via `package.json`).

## UI Component Patterns

### shadcn/ui Components

Located in `web-frontend/src/components/ui/` - DO NOT edit directly (regenerate from CLI if needed).

### Custom Data Table

[DataTable.tsx](web-frontend/src/components/ui/data-table/DataTable.tsx) is a generic table component with:

-   Column sorting (controlled or uncontrolled)
-   Inline editing (startEdit/cancelEdit pattern)
-   Row grouping with drag-and-drop
-   Optional drawer/actions columns

**Usage**: Pass `columns` array with `key`, `label`, `sortable`, `render`, and optional `editable`.

# FROM USER

everything should be maintainable and easy to manage. this is a solo project, so it should be simple. Don't use bad practices. Things should be scalable and readable NOT verbose. CONCISE. No anti patterns. Follow KISS & DRY.

For example, don't type things as "any" that is bad practice.

Don't finish your agent loop until you have checked for errors and confirmed there are none from the code changes you have made.

Also, don't make example files

BE CONCISE when you talk to the user.
