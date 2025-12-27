# Architecture Decisions

This document records important architectural decisions made during MediaProc development.

---

## Decision 1: CLI-First, API-Later Approach

**Date:** December 2025  
**Status:** ✅ Accepted  
**Decision Makers:** Core Team

### Context

Should MediaProc expose a REST API for plugin integration, or remain a CLI-only tool?

### Decision

**Keep CLI-only for v0.1-v1.0, add optional API in v2.0+**

### Rationale

#### Why CLI-First?

1. **Simplicity** - Easier to develop, test, and maintain
2. **Target Audience** - Developers primarily need local tools
3. **Faster to Market** - Ship stable v1.0 faster
4. **Lower Complexity** - No server, authentication, deployment concerns
5. **Better Performance** - No network overhead
6. **Offline Support** - Works without internet

#### When to Add API?

- After v1.0 stable release
- When plugin ecosystem is mature
- When users explicitly request web integration
- When ready for cloud deployment

### Implementation Phases

#### Phase 1 (v0.1 - v1.0): CLI Tool
```bash
# Pure CLI usage
mediaproc image resize photo.jpg --width 1920
```

**Focus:**
- Perfect CLI experience
- Build core plugins
- Establish plugin standards
- Create comprehensive docs

#### Phase 2 (v1.0 - v2.0): Library API
```typescript
// Programmatic usage in Node.js
import { image, video } from '@mediaproc/cli';

await image.resize('photo.jpg', { width: 1920 });
await video.compress('video.mp4', { quality: 80 });
```

**Benefits:**
- No HTTP overhead
- Type safety
- Direct function calls
- Use in Node.js applications
- Better error handling

#### Phase 3 (v2.0+): Optional REST Server
```typescript
// Optional server plugin
import { startServer } from '@mediaproc/server';

startServer({
  port: 3000,
  auth: { type: 'jwt', secret: process.env.JWT_SECRET },
  plugins: ['image', 'video', 'audio'],
  storage: { type: 's3', bucket: 'media-bucket' }
});
```

```bash
# REST API usage
curl -X POST http://localhost:3000/api/image/resize \
  -F "file=@photo.jpg" \
  -F "width=1920" \
  -F "height=1080"
```

**Benefits:**
- Web app integration
- Remote execution
- Job queuing
- Horizontal scaling
- Multi-tenant support

### Alternatives Considered

#### Alternative 1: API-First Approach
❌ **Rejected** - Too complex for initial release, slower development

#### Alternative 2: Hybrid from Start
❌ **Rejected** - Splits focus, delays v1.0 release

#### Alternative 3: CLI + gRPC
⏳ **Deferred** - Consider if REST doesn't meet needs

### Consequences

#### Positive
- ✅ Faster v1.0 release
- ✅ Simpler codebase
- ✅ Better developer experience
- ✅ Lower maintenance burden
- ✅ Can add API later without breaking changes

#### Negative
- ❌ Web apps can't use directly (yet)
- ❌ No remote execution (yet)
- ❌ May need significant work later for API

#### Mitigations
- Document library usage pattern early
- Design plugin system to support both CLI and API
- Keep architecture modular for future API addition

### References

- [Plugin System Documentation](plugin-system.md)
- [Plugin Integration Guide](plugin-integration-guide.md)
- [Upcoming Features](upcoming-features.md)

---

## Decision 2: Plugin Naming Convention

**Date:** December 2025  
**Status:** ✅ Accepted

### Decision

**Official plugins:** `@mediaproc/<name>`  
**Community plugins:** `mediaproc-plugin-<name>` or `@scope/mediaproc-plugin-<name>`

### Rationale

1. **Clear Distinction** - Easy to identify official vs community plugins
2. **Auto-Discovery** - Plugins with correct naming are auto-discovered
3. **Namespace Protection** - Official plugins use @mediaproc scope
4. **Flexibility** - Community can use any npm scope

### Examples

```
Official:
- @mediaproc/image
- @mediaproc/video
- @mediaproc/audio

Community:
- mediaproc-plugin-ascii
- mediaproc-plugin-instagram
- @acme/mediaproc-plugin-custom
```

---

## Decision 3: TypeScript with Strict Mode

**Date:** December 2025  
**Status:** ✅ Accepted

### Decision

Use TypeScript with strict mode for all code

### Rationale

1. **Type Safety** - Catch errors at compile time
2. **Better DX** - IntelliSense and autocomplete
3. **Documentation** - Types serve as inline documentation
4. **Refactoring** - Safer refactoring with type checking
5. **Plugin API** - Clear interfaces for plugin developers

### Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node"
  }
}
```

---

## Decision 4: Commander.js for CLI Framework

**Date:** December 2025  
**Status:** ✅ Accepted

### Decision

Use Commander.js as the CLI framework

### Rationale

1. **Mature** - Battle-tested, widely used
2. **Feature-Rich** - Subcommands, options, help generation
3. **TypeScript Support** - Full type definitions
4. **Plugin-Friendly** - Easy to extend programmatically
5. **Documentation** - Excellent docs and examples

### Alternatives Considered

- **Yargs** - More verbose API
- **Oclif** - Too heavyweight, opinionated
- **Caporal** - Less popular, smaller community

---

## Decision 5: pnpm Workspace for Monorepo

**Date:** December 2025  
**Status:** ✅ Accepted

### Decision

Use pnpm workspace for monorepo management

### Rationale

1. **Efficient** - Saves disk space with symlinks
2. **Fast** - Faster installs than npm/yarn
3. **Strict** - Better dependency management
4. **Workspace Support** - Native monorepo support
5. **Performance** - Better for large monorepos

### Structure

```
mediaproc/
├── package.json (root)
├── pnpm-workspace.yaml
├── src/ (core CLI)
└── plugins/
    ├── image/
    ├── video/
    └── audio/
```

---

## Future Decisions

### Under Consideration

1. **Testing Framework** - Vitest vs Jest
2. **Documentation Site** - VitePress vs Docusaurus
3. **Plugin Marketplace** - Custom vs npm-only
4. **Cloud Integration** - AWS vs GCP vs Azure
5. **WebAssembly Support** - For browser usage

### Timeline

- Q1 2026: Testing framework decision
- Q2 2026: Documentation site decision
- Q3 2026: Plugin marketplace design
- Q4 2026: Cloud integration strategy

---

## Change Process

To propose a new architectural decision:

1. Open a GitHub Discussion with [ADR] prefix
2. Provide context and alternatives
3. Gather feedback from community
4. Core team makes final decision
5. Document decision in this file
6. Announce in changelog

---

**Last Updated:** December 27, 2025
