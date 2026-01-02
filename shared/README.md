# Shared Types

Shared types and schemas for the AI Assistant project.

## Usage

### In middleware:

```typescript
import { TaskFilters, CreateTaskInput } from "@ai-assistant/shared";
```

### In frontend:

```typescript
import { TaskFilters, CreateTaskInput } from "@ai-assistant/shared";
```

## Development

To use this package locally in other projects, link it:

```bash
cd shared
npm install
npm link

cd ../middleware
npm link @ai-assistant/shared

cd ../frontend
npm link @ai-assistant/shared
```
