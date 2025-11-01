(() => {
  // Minimal, dependency-free AI service wrapper for Chrome built-in AI APIs.
  // Exposes: window.aiService with availability checks and helpers.

  const handlers = [];
  const emit = (type, payload) => {
    handlers.forEach((h) => {
      try { h({ type, payload }); } catch (_) {}
    });
  };

  // Cache sessions for performance; reuse across calls
  const sessionCache = {
    writer: null,
    rewriter: null,
    proofreader: null,
    summarizer: null,
  };

  const availabilityOf = async (name, API) => {
    const supported = name in self;
    const info = { api: name, supported, status: 'unavailable' };
    if (supported && typeof API.availability === 'function') {
      try {
        info.status = await API.availability();
      } catch (e) {
        info.status = 'error';
        info.error = String(e && e.message ? e.message : e);
      }
    }
    return info;
  };

  const createWithMonitor = async (name, API, options = {}) => {
    if (!(name in self)) throw new Error(`${name} API not supported`);
    // If availability is clearly unavailable, surface early
    if (typeof API.availability === 'function') {
      const status = await API.availability();
      if (status === 'unavailable' || status === 'error') {
        throw new Error(`${name} API ${status}`);
      }
    }
    const monitored = {
      monitor(m) {
        if (!m || typeof m.addEventListener !== 'function') return;
        m.addEventListener('downloadprogress', (e) => {
          // e.loaded is 0..1
          emit('download', { api: name, loaded: e.loaded });
        });
      },
      ...options,
    };
    return API.create(monitored);
  };

  const retry = async (fn, attempts = 2, delayMs = 400) => {
    try {
      return await fn();
    } catch (e) {
      if (attempts <= 0) throw e;
      await new Promise((r) => setTimeout(r, delayMs));
      return retry(fn, attempts - 1, Math.min(delayMs * 2, 1600));
    }
  };

  const aiService = {
    on(listener) { handlers.push(listener); },

    // Check availability for known APIs
    async availability() {
      return {
        writer: await availabilityOf('Writer', self.Writer || {}),
        rewriter: await availabilityOf('Rewriter', self.Rewriter || {}),
        proofreader: await availabilityOf('Proofreader', self.Proofreader || {}),
        summarizer: await availabilityOf('Summarizer', self.Summarizer || {}),
      };
    },

    // Factory helpers
    async createWriter(options = {}) {
      if (sessionCache.writer) return sessionCache.writer;
      // Ensure writer sessions always attest an explicit output language
      const merged = Object.assign({
        outputLanguage: 'en',
        expectedOutputLanguages: ['en'],
      }, options);
      const session = await retry(() => createWithMonitor('Writer', self.Writer, merged));
      sessionCache.writer = session;
      return session;
    },
    async createRewriter(options = {}) {
      if (sessionCache.rewriter) return sessionCache.rewriter;
      // Ensure rewriter sessions default to explicit output language as well
      const merged = Object.assign({
        outputLanguage: 'en',
        expectedOutputLanguages: ['en'],
      }, options);
      const session = await retry(() => createWithMonitor('Rewriter', self.Rewriter, merged));
      sessionCache.rewriter = session;
      return session;
    },
    async createProofreader(options = {}) {
      if (sessionCache.proofreader) return sessionCache.proofreader;
      const session = await retry(() => createWithMonitor('Proofreader', self.Proofreader, options));
      sessionCache.proofreader = session;
      return session;
    },
    async createSummarizer(options = {}) {
      if (sessionCache.summarizer) return sessionCache.summarizer;
      const session = await retry(() => createWithMonitor('Summarizer', self.Summarizer, options));
      sessionCache.summarizer = session;
      return session;
    },

    // High-level helpers tailored for HN titles
    async writeTitle(seed, sharedContext = 'Hacker News submission title') {
      const writer = await this.createWriter({
        sharedContext,
        format: 'plain-text',
        tone: 'neutral',
        length: 'short',
        language: 'en',
        outputLanguage: 'en',
        expectedOutputLanguages: ['en'],
      });
      const prompt = [
        'Generate a Hacker News submission title following HN guidelines.',
        'Based on this seed:',
        `"${seed}"`,
        'Hacker News Title Rules:',
        '- Do not include site name (it will appear automatically)',
        '- No uppercase, exclamation points, or promotional language',
        '- Use original title unless misleading or clickbait',
        '- Remove gratuitous numbers: "10 Ways" → "How To", "7 Tips" → "Tips for"',
        '- Avoid clickbait and sensationalism',
        '- Keep to ~60–80 characters',
        '- Use title case for better readability on HN',
        '- Add [video], [pdf], [audio] tags when appropriate',
        'Return plain text only, no quotes or markdown.',
      ].join('\n');
      const output = await writer.write(prompt);
      return typeof output === 'string' ? output : (output && output.output) || seed;
    },

    async writeTitleVariants(seed, count = 3, sharedContext = 'Hacker News submission title') {
      const writer = await this.createWriter({
        sharedContext,
        format: 'plain-text',
        tone: 'neutral',
        length: 'short',
        language: 'en',
        outputLanguage: 'en',
        expectedOutputLanguages: ['en'],
      });
      const prompt = [
        `Generate exactly ${count} alternative Hacker News submission titles, one per line.`,
        'Based on this seed:',
        `"${seed}"`,
        'Hacker News Title Rules for ALL variants:',
        '- Do not include site name (it will appear automatically)',
        '- No uppercase, exclamation points, or promotional language',
        '- Use original title unless misleading or clickbait',
        '- Remove gratuitous numbers: "10 Ways" → "How To", "7 Tips" → "Tips for"',
        '- Avoid clickbait and sensationalism',
        '- Keep titles ~60–80 characters',
        '- Use title case for better readability on HN',
        '- Add [video], [pdf], [audio] tags when appropriate',
        '- Prefer informative phrasing',
        '- Return plain text lines only; no numbering, bullets, or quotes.',
      ].join('\n');
      const output = await writer.write(prompt);
      const text = typeof output === 'string' ? output : (output && output.output) || '';
      const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      // Ensure we have up to count suggestions
      return lines.slice(0, count);
    },

    async rewriteTitle(input, opts = {}) {
      const rewriter = await this.createRewriter({
        sharedContext: 'Hacker News submission title',
        format: 'plain-text',
        tone: opts.tone || 'as-is',
        length: opts.length || 'as-is',
        outputLanguage: 'en',
        expectedOutputLanguages: ['en'],
      });
      const output = await rewriter.rewrite(input);
      return typeof output === 'string' ? output : (output && output.output) || input;
    },

    async proofreadTitle(input) {
      try {
        // Prefer the Proofreader API when available and configured
        const proofreader = await this.createProofreader({
          expectedInputLanguages: ['en'],
        });
        const res = await proofreader.proofread(input);
        let corrected = (res && res.corrected) ? res.corrected : input;

        // Apply HN-specific formatting after proofreading
        corrected = corrected.trim();

        // Convert to title case for HN (but preserve acronyms)
        corrected = corrected.replace(/\b\w+/g, (word) => {
          // Keep known acronyms in uppercase
          const acronyms = ['HTML', 'CSS', 'JSON', 'HTTP', 'HTTPS', 'API', 'SDK', 'AI', 'ML', 'UI', 'UX', 'JS', 'TS', 'SQL', 'OS', 'URL', 'ID', 'XML', 'SVG'];
          if (acronyms.includes(word.toUpperCase())) return word.toUpperCase();
          // Capitalize first letter, lowercase the rest
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        });

        // Remove excessive punctuation
        corrected = corrected.replace(/!+$/, '');
        corrected = corrected.replace(/[?]+$/, '');

        return corrected;
      } catch (e) {
        // Graceful fallback: use Rewriter to lightly proofread if Proofreader is unavailable
        const rewriter = await this.createRewriter({
          sharedContext: 'Proofread and correct grammar for a Hacker News submission title without changing meaning',
          format: 'plain-text',
          tone: 'as-is',
          length: 'as-is',
        });
        const output = await rewriter.rewrite(input);
        let corrected = typeof output === 'string' ? output : (output && output.output) || input;

        // Apply the same HN-specific formatting
        corrected = corrected.trim();
        corrected = corrected.replace(/\b\w+/g, (word) => {
          const acronyms = ['HTML', 'CSS', 'JSON', 'HTTP', 'HTTPS', 'API', 'SDK', 'AI', 'ML', 'UI', 'UX', 'JS', 'TS', 'SQL', 'OS', 'URL', 'ID', 'XML', 'SVG'];
          if (acronyms.includes(word.toUpperCase())) return word.toUpperCase();
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        });
        corrected = corrected.replace(/!+$/, '');
        corrected = corrected.replace(/[?]+$/, '');
        return corrected;
      }
    },

    async rewriteTitleVariants(input, count = 3) {
      const rewriter = await this.createRewriter({
        sharedContext: 'Hacker News submission title',
        format: 'plain-text',
        tone: 'as-is',
        length: 'as-is',
        outputLanguage: 'en',
        expectedOutputLanguages: ['en'],
      });
      
      const prompt = [
        `Generate exactly ${count} alternative versions of this title, one per line, optimized for Hacker News.`,
        'Original title:',
        `"${input}"`,
        'Rules for all variants:',
        '- Remove site names (e.g., " - Site Name" at the end)',
        '- Be concise, informative, and neutral',
        '- Avoid clickbait language or promotional tone',
        '- Keep to ~60–80 characters',
        '- Maintain the core meaning of the original',
        '- Prefer title case for better HN readability',
        '- Add [video], [pdf], [audio] tags when appropriate',
        'Return plain text lines only; no numbering, bullets, or quotes.',
      ].join('\n');
      
      const output = await rewriter.rewrite(prompt);
      const text = typeof output === 'string' ? output : (output && output.output) || '';
      const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      // Ensure we have up to count suggestions
      return lines.slice(0, count);
    },
  };

  window.aiService = aiService;
})();