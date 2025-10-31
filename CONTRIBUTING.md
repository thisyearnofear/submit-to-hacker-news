# Contributing to Submit to Hacker News

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- **Check existing issues** first to avoid duplicates
- **Use issue templates** when available
- **Provide clear reproduction steps** for bugs
- **Include browser version** and extension version

### Suggesting Features  
- **Search existing feature requests** first
- **Explain the use case** and why it would benefit users
- **Consider HN community guidelines** - features should align with HN culture
- **Keep it focused** - one feature per issue

### Code Contributions

#### Getting Started
1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a branch** for your changes
4. **Load the extension** in your browser for testing
5. **Make your changes**
6. **Test thoroughly**
7. **Submit a pull request**

#### Development Setup
```bash
# Clone your fork
git clone https://github.com/yourusername/submit-to-hacker-news.git
cd submit-to-hacker-news

# Create a feature branch
git checkout -b feature/your-feature-name
```

**Note**: The extension is available on [Chrome Web Store](https://chromewebstore.google.com/detail/submit-to-hacker-news/alleeofhkkjaiaelnpobphljpfelfiin) and [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/submit-to-hacker-news/) for regular users. For development and testing, use the manual installation below.

#### Testing Your Changes
- **Load in Chrome**: Go to `chrome://extensions/`, enable Developer mode, click "Load unpacked", select the `chromium/` folder
- **Load in Firefox**: Go to `about:debugging`, click "Load Temporary Add-on", select `firefox/manifest.json`
- **Test on various websites**: Try different content types (blogs, GitHub repos, PDFs, videos)
- **Test edge cases**: Long titles, special characters, non-English content
- **Test duplicate detection**: Try URLs you know have been submitted to HN

### Chrome Built-in AI (Origin Trials)
- **APIs**: Writer, Rewriter, Proofreader integrate with Chrome’s on-device models. Prompt and Summarizer are stable in Chrome ≥138; Writer/Rewriter are in origin trials (Chrome 137–148), Proofreader in origin trials (Chrome 141–145/Early Preview).
- **Register origin trial**: Use your extension ID (`chrome-extension://<ID>`) when registering; obtain tokens per API.
- **Inject tokens locally**: Set environment variables and run the injection script before testing:
  - `CHROME_TRIAL_TOKEN_WRITER="<token>"`
  - `CHROME_TRIAL_TOKEN_REWRITER="<token>"`
  - `CHROME_TRIAL_TOKEN_PROOFREADER="<token>"`
  - Inject: `node scripts/inject-trial-tokens.js`
  - Or build: `npm run build:chromium` (injects tokens and creates a zip)
- **Do not commit tokens**: Tokens are not secrets but should not be committed. The build step injects tokens from environment variables.
- **Model download & availability**: Gemini Nano downloads on first use; the popup shows status and disables AI buttons when APIs are unavailable. If status is `downloadable`, the first use will trigger a background download.

## 📝 Code Style

### JavaScript
- **Use modern ES6+** features (async/await, const/let, arrow functions)
- **No external dependencies** - keep it vanilla JavaScript
- **Comment complex logic** especially HN API interactions
- **Use descriptive variable names**
- **Handle errors gracefully**

### HTML/CSS
- **Semantic HTML** with proper ARIA attributes
- **Mobile-first CSS** with responsive design
- **Use CSS custom properties** for theming
- **Follow BEM methodology** for class names when appropriate

### Example Code Style
```javascript
// Good: Clear, documented async function
const checkForDuplicate = async (url) => {
  try {
    const normalizedUrl = url.replace(/\/$/, '').toLowerCase();
    
    // Get story lists in parallel for performance
    const [topResponse, newResponse] = await Promise.all([
      fetch('https://hacker-news.firebaseio.com/v0/topstories.json'),
      fetch('https://hacker-news.firebaseio.com/v0/newstories.json')
    ]);
    
    // Process results...
    return result;
  } catch (error) {
    console.error('Duplicate check failed:', error);
    return null;
  }
};
```

## 🎯 Development Principles

### User Experience First
- **Performance matters** - keep the extension fast and responsive
- **Don't block the UI** - use background processing for API calls
- **Provide feedback** - show loading states and clear error messages
- **Respect user intent** - don't be overly aggressive with "helpful" changes

### HN Community Alignment
- **Follow HN guidelines** - our title optimization should match community standards
- **Respect the culture** - don't add features that go against HN's philosophy
- **Quality over quantity** - prefer fewer, well-designed features

### Technical Excellence
- **Browser compatibility** - support both Chrome (Manifest V3) and Firefox (Manifest V2)
- **Error handling** - gracefully handle network failures, API changes, etc.
- **Security first** - never expose or log sensitive data
- **Clean code** - readable, maintainable, well-structured

## 🧪 Testing Guidelines

### Manual Testing Checklist
- [ ] Extension loads in both Chrome and Firefox
- [ ] Keyboard shortcut works (`Ctrl+Shift+H` / `Cmd+Shift+H`)
- [ ] Title optimization works on various websites
- [ ] Duplicate detection finds existing submissions
- [ ] Guidelines tooltip displays correctly
- [ ] Error handling works (try with network disabled)
- [ ] All buttons and links work as expected
- [ ] Extension respects HN's API rate limits

### Test Cases
**Title Optimization:**
- "10 Amazing Python Tips - TechBlog.com" → "Python Tips"
- "How to Build APIs!!!" → "How to Build APIs"
- "THE BEST JavaScript FRAMEWORKS" → "The Best JavaScript Frameworks"

**Duplicate Detection:**
- Submit a popular GitHub repository (likely to have been submitted)
- Try recent tech blog posts
- Test with URLs that have multiple HN submissions

**Edge Cases:**
- Very long titles
- Titles with special characters or emojis
- Non-English content
- URLs that redirect
- Pages that load content dynamically

## 📋 Pull Request Process

### Before Submitting
- [ ] **Test in both browsers** (Chrome and Firefox)
- [ ] **Update documentation** if needed
- [ ] **Add/update tests** if applicable
- [ ] **Check for console errors**
- [ ] **Verify no sensitive data** is logged or exposed

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] Tested edge cases
- [ ] No console errors

## Screenshots (if applicable)
[Include screenshots of UI changes]
```

### Review Process
1. **Automated checks** (if any) must pass
2. **Manual review** by maintainers
3. **Testing** in real browser environments
4. **Discussion** and iteration if needed
5. **Merge** when approved

## 🌟 Recognition

Contributors will be:
- **Listed in README** acknowledgments
- **Tagged in release notes** for significant contributions
- **Credited in commit messages** when appropriate

## ❓ Questions?

- **General questions**: Open a [Discussion](https://github.com/yourusername/submit-to-hacker-news/discussions)
- **Bug reports**: Use the [Bug Report](https://github.com/yourusername/submit-to-hacker-news/issues/new?template=bug_report.md) template
- **Feature requests**: Use the [Feature Request](https://github.com/yourusername/submit-to-hacker-news/issues/new?template=feature_request.md) template

## 📚 Resources

- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)
- [Firefox Extension Development](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Hacker News API Documentation](https://github.com/HackerNews/API)
- [HN Guidelines](https://news.ycombinator.com/newsguidelines.html)

---

**Thank you for contributing to make HN submissions better for everyone!** 🚀