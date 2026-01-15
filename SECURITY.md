# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

**Note**: MediaProc is currently in early development. Security updates will be provided for the latest version only.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

If you discover a security vulnerability, please send an email to:

**security@mediaproc.dev** (coming soon)

For now, please contact: **0xshariq** via GitHub

Include the following information:

- **Type of vulnerability** (e.g., command injection, path traversal, XSS)
- **Full description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** of the vulnerability
- **Suggested fix** (if any)
- **Your contact information** (for follow-up)

### What to Expect

1. **Acknowledgment**: We'll acknowledge receipt within 48 hours
2. **Investigation**: We'll investigate and validate the report
3. **Communication**: We'll keep you updated on progress
4. **Fix**: We'll develop and test a fix
5. **Disclosure**: We'll coordinate disclosure timing with you
6. **Credit**: We'll credit you in the security advisory (if desired)

### Disclosure Policy

- **Coordinated disclosure**: We believe in responsible disclosure
- **Timeline**: We aim to fix critical issues within 30 days
- **Public disclosure**: After fix is released and users have time to update
- **Security advisories**: Published on GitHub Security Advisories

## Security Best Practices

### For Users

1. **Keep Updated**: Always use the latest version
2. **Validate Inputs**: Don't process untrusted files without inspection
3. **Limit Permissions**: Run MediaProc with minimal necessary permissions
4. **Review Plugins**: Only install plugins from trusted sources
5. **Check Dependencies**: Audit dependencies regularly

### For Plugin Developers

1. **Input Validation**: Always validate and sanitize user inputs
2. **Path Traversal**: Prevent directory traversal attacks
3. **Command Injection**: Never pass user input directly to shell commands
4. **Temp Files**: Use secure temp directories and clean up
5. **Dependencies**: Keep dependencies updated and audited
6. **Secrets**: Never hardcode secrets or credentials

## Known Security Considerations

### Command Injection

MediaProc uses `execa` to execute system commands (e.g., FFmpeg, ImageMagick). All user inputs are properly sanitized and passed as arguments, not shell commands.

**Bad (vulnerable):**

```typescript
exec(`ffmpeg -i ${userInput} output.mp4`); // DON'T DO THIS
```

**Good (safe):**

```typescript
execa("ffmpeg", ["-i", userInput, "output.mp4"]); // ✓ Safe
```

### Path Traversal

All file paths are validated to prevent directory traversal:

```typescript
import path from "path";

function validatePath(userPath: string): string {
  const normalized = path.normalize(userPath);
  const resolved = path.resolve(normalized);

  // Ensure path is within allowed directories
  if (!resolved.startsWith(process.cwd())) {
    throw new Error("Path traversal detected");
  }

  return resolved;
}
```

### File Processing Limits

To prevent DoS attacks:

- **File size limits**: Configurable max file size
- **Memory limits**: Stream large files instead of loading into memory
- **Timeout limits**: Operations have maximum execution time
- **Concurrency limits**: Limit parallel operations

### Plugin Security

- **Sandboxing** (planned): Plugins will run in isolated environments
- **Permissions** (planned): Granular permission system for plugins
- **Code review**: Core plugins are reviewed before release
- **Auditing** (planned): Security audits for popular community plugins

## Security Updates

Security updates are announced via:

- GitHub Security Advisories
- Release notes
- npm advisory database
- Social media (when available)

Subscribe to releases on GitHub to stay informed.

## Vulnerability Disclosure Timeline

Example timeline for critical vulnerabilities:

- **Day 0**: Vulnerability reported
- **Day 1**: Acknowledgment sent to reporter
- **Day 2-7**: Investigation and validation
- **Day 7-14**: Fix development and testing
- **Day 14**: Security release published
- **Day 14-30**: Users notified, grace period for updates
- **Day 30+**: Public disclosure with details

## Bug Bounty

We don't currently have a bug bounty program, but we recognize and credit security researchers who responsibly disclose vulnerabilities.

**Recognition includes:**

- Credit in security advisory
- Mention in CHANGELOG
- GitHub contributor badge
- Social media shoutout

## Security Hall of Fame

We maintain a list of security researchers who have helped make MediaProc more secure:

_(Coming soon - be the first!)_

## Contact

For security-related questions or concerns:

- **Email**: security@mediaproc.dev (coming soon)
- **GitHub**: @0xshariq
- **PGP Key**: (coming soon)

---

**Thank you for helping keep MediaProc and its users safe!**
