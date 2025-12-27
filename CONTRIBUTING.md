# Contributing to MediaProc

First off, thank you for considering contributing to MediaProc! It's people like you that make MediaProc such a great tool.

## 🌟 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (command you ran, files used, expected vs actual output)
- **Include error messages** and stack traces
- **Describe your environment** (OS, Node.js version, MediaProc version)

**Example Bug Report:**

```markdown
Title: Video compression fails on files larger than 2GB

Environment:
- OS: Ubuntu 22.04
- Node.js: v20.10.0
- MediaProc: v0.1.0

Steps to reproduce:
1. Run `mediaproc video compress large-file.mp4 --quality 80`
2. Wait for processing
3. Error occurs at ~75% completion

Expected: File compresses successfully
Actual: Error "ENOMEM: out of memory"

Error log:
[paste error message here]
```

### Suggesting Features

Feature suggestions are welcome! Please:

- **Check if the feature already exists** in the roadmap
- **Provide a clear use case** - why is this feature needed?
- **Describe the expected behavior** in detail
- **Consider the impact** on existing functionality
- **Provide examples** of how it would be used

### Pull Requests

#### Getting Started

1. **Fork the repository** and clone your fork
2. **Create a branch** from `main`: `git checkout -b feature/my-feature`
3. **Install dependencies**: `pnpm install`
4. **Build the project**: `pnpm build`
5. **Make your changes**
6. **Test your changes** thoroughly
7. **Commit with clear messages**
8. **Push to your fork** and submit a pull request

#### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/mediaproc.git
cd mediaproc

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Link CLI globally for testing
cd plugins/image
pnpm link --global
cd ../..

# Test your changes
mediaproc --version
mediaproc image --help
```

#### Code Style

- **TypeScript**: All code must be in TypeScript
- **Strict mode**: Follow strict TypeScript rules
- **ESM**: Use ES modules (import/export)
- **Formatting**: Follow existing code style
- **Comments**: Add comments for complex logic
- **Types**: Provide comprehensive type definitions

#### Commit Messages

Follow conventional commits:

```
feat(image): add AVIF format support
fix(video): resolve memory leak in transcoding
docs(readme): update installation instructions
refactor(core): simplify plugin loading logic
test(audio): add tests for normalize command
chore(deps): update dependencies
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

#### Pull Request Guidelines

- **Keep PRs focused**: One feature/fix per PR
- **Write clear descriptions**: Explain what and why
- **Link related issues**: Reference issue numbers
- **Update documentation**: Add/update docs as needed
- **Add tests**: Include tests for new features
- **Ensure CI passes**: All checks must be green
- **Request review**: Tag relevant maintainers

**PR Template:**

```markdown
## Description
Brief description of changes

## Related Issues
Closes #123

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manually tested on Linux
- [ ] Manually tested on macOS
- [ ] Manually tested on Windows

## Documentation
- [ ] Updated README
- [ ] Added inline comments
- [ ] Updated docs/

## Screenshots
(if applicable)
```

## �� Plugin Development

### Creating a New Plugin

1. **Create plugin folder**: `mkdir -p plugins/myplugin`
2. **Initialize package**: `cd plugins/myplugin && pnpm init`
3. **Add dependencies**:

```json
{
  "name": "@mediaproc/myplugin",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "dependencies": {
    "@mediaproc/cli": "workspace:*",
    "chalk": "^5.3.0",
    "commander": "^11.1.0"
  }
}
```

4. **Create source structure**:

```
src/
├── index.ts
├── register.ts
├── types.ts
├── cli.ts
└── commands/
    └── mycommand.ts
```

5. **Implement registration**:

```typescript
// src/register.ts
import { Command } from 'commander';

export const name = 'myplugin';
export const version = '1.0.0';

export function register(program: Command): void {
  const cmd = program
    .command('myplugin')
    .description('My plugin description');
  
  cmd
    .command('mycommand <input>')
    .description('Command description')
    .option('-o, --output <path>', 'Output path')
    .action(async (input, options) => {
      // Implementation
    });
}
```

6. **Add to registry**: Update `src/plugin-registry.ts` in root
7. **Write tests**: Add tests in `src/__tests__/`
8. **Document**: Update plugin README

### Plugin Best Practices

- **Error handling**: Use try/catch and provide clear error messages
- **Progress indicators**: Use ora for long-running operations
- **Validation**: Validate all inputs before processing
- **Type safety**: Use TypeScript strictly
- **Documentation**: Document all functions and commands
- **Performance**: Handle large files efficiently
- **Memory**: Stream large files instead of loading into memory
- **Cleanup**: Remove temporary files after processing

## 📝 Documentation

### Updating Documentation

- **README.md**: Keep root README up to date
- **docs/**: Add detailed guides for complex features
- **Code comments**: Document complex logic
- **JSDoc**: Add JSDoc for public APIs
- **Examples**: Provide usage examples

### Documentation Style

- **Clear and concise**: Avoid jargon
- **Examples**: Show, don't just tell
- **Structure**: Use headers and lists
- **Code blocks**: Include language tags
- **Links**: Link to related documentation

## 🧪 Testing

### Writing Tests

```typescript
// src/__tests__/mycommand.test.ts
import { describe, it, expect } from 'vitest';
import { myCommand } from '../commands/mycommand.js';

describe('myCommand', () => {
  it('should process input correctly', async () => {
    const result = await myCommand('input.txt');
    expect(result).toBeDefined();
  });
  
  it('should handle errors gracefully', async () => {
    await expect(myCommand('invalid.txt')).rejects.toThrow();
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm --filter @mediaproc/image test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

## 🤝 Community

### Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

### Getting Help

- **GitHub Discussions**: Ask questions and share ideas
- **GitHub Issues**: Report bugs and request features
- **Discord** (coming soon): Real-time community support

### Recognition

Contributors are recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- GitHub contributor graph
- Social media shoutouts

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Your contributions make MediaProc better for everyone. We appreciate your time and effort!

---

**Questions?** Open a discussion on GitHub or reach out to maintainers.
