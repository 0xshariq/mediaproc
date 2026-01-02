# Plugin Terminology Guide

## 🔑 Key Terms

### Official Plugins

**Definition:** Plugins maintained by the MediaProc core team and published under the `@mediaproc/*` namespace.

**Characteristics:**

- Published as `@mediaproc/image`, `@mediaproc/video`, etc.
- Professionally maintained and tested
- Follow MediaProc API standards
- Listed in the official registry
- Regular updates and bug fixes

**How to identify:**

- Package name starts with `@mediaproc/`
- Listed in `mediaproc plugins` command
- Marked with "★ OFFICIAL" in `mediaproc list`

**Examples:**

- `@mediaproc/image` - Image processing
- `@mediaproc/video` - Video processing
- `@mediaproc/audio` - Audio processing
- `@mediaproc/document` - Document processing
- `@mediaproc/stream` - Streaming processing
- `@mediaproc/pipeline` - Pipeline processing
- `@mediaproc/3d` - 3d processing
- `@mediaproc/ai` - AI processing


### Community Plugins

**Definition:** Plugins developed by the community following the naming convention `mediaproc-*`.

**Characteristics:**

- Published as `mediaproc-plugin-name`
- Community-maintained
- May follow MediaProc conventions
- Available on npm

**How to identify:**

- Package name starts with `mediaproc-`
- Not in official registry
- Marked with "🌐 COMMUNITY" in plugin listings

**Examples:**

- `mediaproc-custom-filter`
- `mediaproc-social-media`

### Third-Party Plugins

**Definition:** Any compatible npm package that implements the MediaProc plugin interface.

**Characteristics:**

- Any npm package name
- Must export a `register(program)` function
- May not follow naming conventions
- Independent development

**How to identify:**

- No specific naming pattern
- Works with MediaProc if compatible
- Marked with "📦 THIRD-PARTY" in listings

**Examples:**

- `any-compatible-package`
- `custom-image-processor`

## ❌ Common Misconceptions

### "Built-in Plugin"

**WRONG:** ~~"Built-in plugins are pre-installed with the CLI"~~

**CORRECT:** There are **NO built-in plugins**. All plugins must be explicitly installed by the user.

**Why the confusion?**

- The term "built-in" was previously used in documentation
- This has been corrected to "Official Plugins"
- Official plugins are NOT pre-installed

### "Bundled with CLI"

**WRONG:** ~~"Some plugins come bundled with @mediaproc/cli"~~

**CORRECT:** The CLI package is lightweight and contains **NO plugin code**. All plugins are separate packages.

**Analogy:**

- Think of it like VS Code: The editor is separate from extensions
- You install VS Code, then install the extensions you want
- Same with MediaProc: Install CLI, then install the plugins you need

## ✅ Correct Understanding

### Installation Flow

```bash
# Step 1: Install CLI (no plugins included)
npm install -g @mediaproc/cli

# Step 2: CLI is empty - no plugins loaded
mediaproc --help
# Shows only core commands: convert, info, optimize, add, remove, list, plugins

# Step 3: Browse available plugins
mediaproc plugins
# Shows all official plugins (all marked "Not installed")

# Step 4: Install the plugins YOU want
mediaproc add image    # Install official image plugin
mediaproc add video    # Install official video plugin

# Step 5: Now plugins are available
mediaproc list
# Shows installed plugins

# Step 6: Use installed plugins
mediaproc image resize photo.jpg -w 1920
mediaproc video transcode movie.mp4
```

### Plugin States

A plugin can be in one of these states:

1. **Available** - Listed in registry, not installed
2. **Installed** - In package.json, may not be loaded
3. **Loaded** - Currently available for use
4. **Not Installed** - Not in package.json, not available

### Checking Plugin Status

```bash
# See ALL available plugins (installed or not)
mediaproc plugins

# See ONLY installed plugins
mediaproc list

# See plugins in package.json but not loaded
mediaproc list
# Shows "⚠️ Installed but Not Loaded" section
```

## 🎯 Best Practices

### For Users

1. **Install only what you need**

   ```bash
   mediaproc add image    # If you process images
   mediaproc add video    # If you process videos
   ```

2. **Check what's installed**

   ```bash
   mediaproc list
   ```

3. **Browse before installing**
   ```bash
   mediaproc plugins      # See all options
   ```

### For Developers

1. **Use correct terminology**

   - ✅ "Official plugin"
   - ✅ "Install the image plugin"
   - ❌ "Built-in plugin"
   - ❌ "Bundled plugin"

2. **Document installation**

   ```bash
   # In your README
   npm install -g @mediaproc/cli
   mediaproc add image    # ← Always show this step
   ```

3. **Don't assume plugins exist**
   - Check if plugin is loaded before use
   - Provide clear error messages if missing
   - Guide users to `mediaproc add <plugin>`

## 📚 Quick Reference

| Term                   | What It Means                | Example                       |
| ---------------------- | ---------------------------- | ----------------------------- |
| **Official Plugin**    | Maintained by MediaProc team | `@mediaproc/image`            |
| **Community Plugin**   | Maintained by community      | `mediaproc-custom`            |
| **Third-Party Plugin** | Any compatible package       | `any-package`                 |
| **Installed Plugin**   | In package.json              | Check with `mediaproc list`   |
| **Loaded Plugin**      | Currently available          | Commands work                 |
| **Available Plugin**   | Can be installed             | Listed in `mediaproc plugins` |

## 🔗 Related Documentation

- [Plugin Architecture](./plugin-architecture.md) - Detailed architecture overview
- [Plugin Integration Guide](./plugin-integration-guide.md) - Build your own plugin
- [Plugin System](./plugin-system.md) - Technical implementation details

## ❓ FAQ

**Q: Why aren't any plugins pre-installed?**

A: To keep the CLI lightweight and give users complete control over what they install. Users only install what they need.

**Q: How do I get started quickly?**

A: Install the image plugin to start processing images immediately:

```bash
npm install -g @mediaproc/cli
mediaproc add image
mediaproc image resize photo.jpg -w 800
```

**Q: Can I use plugins standalone?**

A: Yes! Each plugin can be used independently:

```bash
npm install -g @mediaproc/image
mediaproc-image resize photo.jpg -w 800
```

**Q: What's the difference between official and community plugins?**

A: Official plugins (`@mediaproc/*`) are maintained by the core team with guaranteed quality and support. Community plugins (`mediaproc-*`) are maintained by the community.

**Q: How do I publish a community plugin?**

A: Name it `mediaproc-yourname`, follow the plugin interface, and publish to npm. See the [Plugin Integration Guide](./plugin-integration-guide.md).
