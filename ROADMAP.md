# AI-Powered Hacker News Submission Extension - Hackathon Roadmap

## Overview
Enhance the existing "Submit to Hacker News" Chrome extension with Chrome's built-in AI APIs for the Google Chrome Built-in AI Challenge 2025. Focus on 2-3 key features that demonstrate innovative AI integration while maintaining the extension's core user experience.

## Hackathon Goals
- **Win "Most Helpful - Chrome Extension"** ($14,000) - Show tangible user experience improvements
- **Win "Best Multimodal AI Application"** ($9,000) - Demonstrate advanced AI capabilities
- **Secure Honorable Mention** ($1,000) - Minimum viable enhancement

## Current Progress
- **AI Service Module**: Implemented `chromium/ai-service.js` with Writer, Rewriter, and Proofreader wrappers, availability checks, and download progress events.
- **Popup UI**: Added AI buttons (AI Generate, Rewrite, Proofread) with status indicator; integrated gating and helpful tooltips per API availability.
- **Integration**: Wired AI actions in `chromium/popup.js` with error handling and non-blocking UI updates.
- **Manifest**: Added `trial_tokens` placeholders for origin trials (Writer/Rewriter/Proofreader); no unsupported permissions.
- **Build Hygiene**: Created `scripts/inject-trial-tokens.js` and `npm run build:chromium` to inject tokens from environment variables and package the extension.
- **Docs**: Updated `CONTRIBUTING.md` to document origin trial tokens, injection workflow, and local testing.
- **UX Enhancements**: Compact click-to-apply suggestions list; keyboard navigation (↑/↓/Enter) for suggestions; minimal inline availability note.
- **Proofreading Hint**: Debounced inline correction suggestion with one-click “Apply” and a subtle fade-in micro-interaction.
- **Preview Guarding**: Safe local preview without extension APIs; falls back to sample title/URL.
 - **Accessibility & Feedback**: Added aria labels/roles for AI actions and suggestions; ephemeral toast confirms applied actions unobtrusively.

## Selected Features (Priority Order)

### 🔥 Phase 1: AI-Powered Title Generation (Writer API)
**Timeline:** Week 1-2
**API:** Writer API
**Why:** Direct enhancement of core functionality, high user impact

**Status:** Initial integration complete (single suggestion); multi-suggestion UI pending

**Implementation:**
- Add "Generate AI Titles" button next to title input
- Use Writer API to create 3-5 HN-appropriate title variations
- Allow users to select/edit generated titles
- Include loading states and error handling

**User Flow:**
1. User opens extension on article
2. Clicks "Generate AI Titles"
3. Extension analyzes page content
4. Shows 3-5 title suggestions
5. User selects or edits preferred title

**Technical Requirements:**
- Register origin trial for extension ID and inject Writer token via build script
- Implement async title generation with non-blocking UI
- Handle API errors gracefully
- Add caching or memoization if repeated generation is needed

### 🔥 Phase 2: Grammar & Style Checking (Proofreader API)
**Timeline:** Week 2-3
**API:** Proofreader API
**Why:** Ensures HN guideline compliance, quality assurance

**Status:** Integrated; UI feedback and debounced checks planned

**Implementation:**
- Real-time proofreading of custom titles
- Highlight grammar/style issues
- Suggest HN-appropriate corrections (no caps, no exclamation points)
- Show before/after comparisons

**User Flow:**
1. User types/edits title
2. Extension automatically checks grammar
3. Shows suggestions for HN-style improvements
4. User can accept/reject suggestions

**Technical Requirements:**
- Register origin trial for extension ID and inject Proofreader token via build script
- Implement debounced real-time checks
- Provide inline visual feedback and accept/apply actions
- Integrate with existing title input and cleaning logic

### 🔥 Phase 3: Smart Title Rewriting (Rewriter API)
**Timeline:** Week 3-4
**API:** Rewriter API
**Why:** Complements existing title cleaning with AI intelligence

**Status:** Integrated; expand prompts and suggestion variants

**Implementation:**
- "Rewrite for HN" button for clickbait/promotional titles
- Transform titles to community-appropriate versions
- Preserve meaning while improving engagement

**User Flow:**
1. User sees original vs cleaned title
2. Clicks "AI Rewrite" for additional suggestions
3. Extension provides rewritten versions
4. User selects best option

**Technical Requirements:**
- Register origin trial for extension ID and inject Rewriter token via build script
- Use context-aware rewriting prompts tuned for HN guidelines
- Provide multiple suggestion options and simple selection UI

## Stretch Goals (If Time Permits)

### 📈 Phase 4: Content Summarization (Summarizer API)
**Timeline:** Week 4-5
**API:** Summarizer API
**Why:** Helps users decide if content is worth submitting

**Implementation:**
- "Summarize Article" feature
- Extract key points for submission decision
- Show if content fits HN guidelines

### 📈 Phase 5: Multimodal Enhancement (Prompt API)
**Timeline:** Week 5-6
**API:** Prompt API
**Why:** Advanced feature for rich content

**Implementation:**
- Analyze images/videos for better titles
- Suggest appropriate tags ([video], [pdf])
- Enhanced content understanding

## Technical Architecture

### Manifest Updates
```json
{
  "manifest_version": 3,
  "trial_tokens": [
    "<WRITER_TRIAL_TOKEN>",
    "<REWRITER_TRIAL_TOKEN>",
    "<PROOFREADER_TRIAL_TOKEN>"
  ]
}
```
Notes:
- Use origin trial tokens registered for `chrome-extension://<YOUR_EXTENSION_ID>`; inject locally via `scripts/inject-trial-tokens.js`.
- Do not add unsupported AI permissions; the built-in APIs are available via the Chrome integration.

### File Structure Changes
```
chromium/
├── popup.html (add AI feature buttons)
├── popup.js (add AI API calls)
├── ai-service.js (new: centralized AI API handling)
└── manifest.json (add origin trial tokens)

scripts/
└── inject-trial-tokens.js (injects tokens from env vars)

package.json
└── build:chromium (injects tokens and creates zip)
```

### Error Handling Strategy
- Graceful degradation when APIs unavailable
- Clear user feedback for API failures
- Fallback to existing functionality

## Hackathon Submission Requirements

### 📹 Demo Video (3 minutes max)
- Show extension on real websites
- Demonstrate AI features in action
- Highlight before/after improvements
- Explain technical implementation

### 📝 Description
- **Problem:** Manual title optimization is time-consuming and error-prone
- **Solution:** AI-powered assistance for HN submissions
- **APIs Used:** Writer, Proofreader, Rewriter (primary)
- **Impact:** Faster, better-quality submissions following HN guidelines

### 🏆 Judging Criteria Focus
- **Functionality:** Reliable AI integration with error handling
- **Purpose:** Clear improvement to HN submission workflow
- **Content:** Creative AI application for content creation
- **UX:** Intuitive AI features that don't complicate the interface
- **Technical Execution:** Clean integration of multiple AI APIs

## Timeline & Milestones

### Week 1: Foundation
- [x] Set up Chrome AI API scaffolding (availability checks, progress)
- [x] Create AI service module
- [x] Add origin trial tokens field and injection workflow
- [x] Basic Writer API integration (single suggestion)

### Week 2: Core Features
- [x] Complete Writer multi-suggestion generation and selection UI
- [x] Add Proofreader API integration (button + action)
- [x] UI updates for AI features (buttons, status, gating)
- [ ] Testing on various websites

### Week 3: Polish & Testing
- [x] Implement Rewriter API (button + action)
- [x] Baseline error handling and fallbacks
- [ ] Performance optimization (debounce, caching, prompt tuning)
- [ ] Cross-browser testing

### Week 4: Submission Prep
- [ ] Create demo video
- [ ] Write submission description
- [ ] Final testing and bug fixes
- [ ] Submit to hackathon

## Immediate Next Steps (Hackathon Focus)
- **Multi-suggestion UI**: Return 3–5 Writer variants; polish selection with keyboard navigation; consider a tiny selector modal if time permits (current inline list is compact and effective).
- **Proofreading UX**: Debounced checks with inline messages; one-click “Apply correction” preserving HN style rules.
- **Rewrite Variants**: Provide 2–3 Rewriter options with prompts tuned for HN tone (no fluff, precise wording).
- **Availability UX**: Show a short inline note when AI is disabled, prompting users to enable trials or wait for download.
- **Micro-Interactions**: Subtle fade-in for hints; focused input behavior; minimal highlight on selection.
- **Accessibility**: Ensure keyboard-only usability is smooth; review focus order; test with screen readers.
- **Prompt Tuning**: Refine system prompts to enforce HN guidelines (title case, no sensationalism, remove site names).
- **Demo Script**: Prepare 3 real sites (technical blog, GitHub repo, PDF) and demonstrate generate → rewrite → proofread → submit flow.
- **Test Matrix**: Validate long titles, special chars, non-English content, redirects, dynamic pages.
- **Stability & Performance**: Ensure no UI blocking; add debounce for proofreading; consider caching title analysis.
- **Submission Assets**: Capture screenshots/GIFs; write concise technical description; highlight UX improvements.

## Success Metrics
- [ ] All selected AI features working reliably
- [ ] No breaking changes to existing functionality
- [ ] Positive user feedback on AI enhancements
- [ ] Clean, maintainable code
- [ ] Comprehensive documentation
- [ ] Demo video clearly shows before/after value
- [ ] Fast, responsive UI with downloads handled gracefully

## Risk Mitigation
- **API Availability:** Implement fallbacks for when AI APIs fail
- **Performance:** Ensure AI calls don't block UI
- **Privacy:** All processing happens client-side
- **Scope Creep:** Focus on 2-3 features, implement stretch goals only if ahead of schedule

## Resources
- [Chrome Built-in AI Documentation](https://developer.chrome.com/docs/ai/)
- [Early Preview Program](https://developer.chrome.com/docs/ai/built-in)
- [Hackathon Rules](https://googlechromeai.devpost.com/)

---

**Remember:** Quality implementation of 2-3 features > mediocre implementation of 5 features. Focus on user experience and reliable AI integration.