document.addEventListener('DOMContentLoaded', async () => {
  const pageTitle = document.getElementById('pageTitle');
  const pageUrl = document.getElementById('pageUrl');
  const submitButton = document.getElementById('submitButton');
  const buttonText = document.getElementById('buttonText');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const errorMessage = document.getElementById('errorMessage');
  const titleInput = document.getElementById('titleInput');
  const titleToggle = document.getElementById('titleToggle');
  const toggleButton = document.getElementById('toggleButton');
  const originalTitleShow = document.getElementById('originalTitleShow');
  const cleanedTitleShow = document.getElementById('cleanedTitleShow');
  const duplicateWarning = document.getElementById('duplicateWarning');
  const duplicateTitle = document.getElementById('duplicateTitle');
  const duplicateStats = document.getElementById('duplicateStats');
  const guidelinesLink = document.getElementById('guidelinesLink');
  const guidelinesTooltip = document.getElementById('guidelinesTooltip');
  const checkingStatus = document.getElementById('checkingStatus');
  const titleSection = document.querySelector('.title-section');
  const tooltipOverlay = document.getElementById('tooltipOverlay');
  const tooltipClose = document.getElementById('tooltipClose');
  const aiGenerateBtn = document.getElementById('aiGenerateBtn');
  const aiRewriteBtn = document.getElementById('aiRewriteBtn');
  const aiProofreadBtn = document.getElementById('aiProofreadBtn');
  const aiStatus = document.getElementById('aiStatus');
  const aiStatusText = document.getElementById('aiStatusText');
  const aiAvailabilityNote = document.getElementById('aiAvailabilityNote');
  const aiSuggestions = document.getElementById('aiSuggestions');
  const aiSuggestionsList = document.getElementById('aiSuggestionsList');
  const toast = document.getElementById('toast');

  let currentTab = null;
  let isPlaceholderMode = true;
  let originalTitle = '';
  let cleanedTitle = '';
  let usingCleanedTitle = false;
  let existingSubmission = null;
  let suggestionIndex = -1; // keyboard navigation index

  const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  };

  const hideError = () => {
    errorMessage.style.display = 'none';
  };

  const showToast = (message = 'Applied') => {
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = '1';
    // Auto-hide
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 1500);
  };

  const setAIStatus = (message) => {
    if (!aiStatus) return;
    if (message && message.length > 0) {
      aiStatusText.textContent = message;
      aiStatus.style.display = 'block';
    } else {
      aiStatusText.textContent = '';
      aiStatus.style.display = 'none';
    }
  };

  const setAIAvailabilityNote = (message) => {
    if (!aiAvailabilityNote) return;
    if (message && message.length > 0) {
      aiAvailabilityNote.textContent = message;
      aiAvailabilityNote.style.display = 'block';
    } else {
      aiAvailabilityNote.textContent = '';
      aiAvailabilityNote.style.display = 'none';
    }
  };

  // Highlight selected AI action button
  const markSelected = (selectedBtn) => {
    [aiGenerateBtn, aiRewriteBtn, aiProofreadBtn].forEach((btn) => {
      if (!btn) return;
      if (btn === selectedBtn) btn.classList.add('selected');
      else btn.classList.remove('selected');
    });
  };

  const renderSuggestions = (items) => {
    if (!aiSuggestions || !aiSuggestionsList) return;
    aiSuggestionsList.innerHTML = '';
    const suggestions = Array.isArray(items) ? items : [];
    if (!suggestions.length) {
      aiSuggestions.style.display = 'none';
      return;
    }
    suggestionIndex = -1;
    suggestions.forEach((s) => {
      const li = document.createElement('li');
      li.style.border = '1px solid #e2e8f0';
      li.style.borderRadius = '8px';
      li.style.background = '#ffffff';
      li.style.padding = '8px';
      li.style.cursor = 'pointer';
      li.setAttribute('role', 'option');
      const text = document.createElement('div');
      text.textContent = s;
      text.style.fontSize = '13px';
      text.style.color = '#0f172a';
      li.addEventListener('click', () => {
        titleInput.value = s;
        titleInput.classList.remove('placeholder');
        aiSuggestions.style.display = 'none';
        isPlaceholderMode = false;
        showToast('Applied suggestion');
        titleInput.focus();
        const end = titleInput.value.length;
        try { titleInput.setSelectionRange(end, end); } catch (_) {}
      });
      li.appendChild(text);
      aiSuggestionsList.appendChild(li);
    });
    aiSuggestionsList.setAttribute('role', 'listbox');
    aiSuggestions.style.display = 'block';
  };

  // Efficient duplicate check using HN's from endpoint
  const checkForDuplicate = async (url) => {
    try {
      // Extract root domain for HN's /from endpoint (HN strips subdomains)
      const domain = new URL(url).hostname.replace(/^www\./, '');
      const rootDomain = domain.split('.').slice(-2).join('.'); // Get last 2 parts (e.g., hn.wbnns.com → wbnns.com)
      
      // Use HN's efficient /from endpoint - single request instead of 1000+
      const fromUrl = `https://news.ycombinator.com/from?site=${encodeURIComponent(rootDomain)}`;
      const response = await fetch(fromUrl);
      
      if (!response.ok) return null;
      
      const html = await response.text();
      
      // Parse the HTML to find submissions matching our exact URL
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const submissions = [];
      const rows = doc.querySelectorAll('tr.athing');
      
      const normalizedUrl = url.replace(/\/$/, '').toLowerCase();
      
      for (const row of rows) {
        const titleLink = row.querySelector('.titleline > a');
        const scoreElement = row.nextElementSibling?.querySelector('.score');
        const commentsLink = row.nextElementSibling?.querySelector('a[href*="item?id="]:last-of-type');
        
        if (!titleLink) continue;
        
        const submissionUrl = titleLink.href.replace(/\/$/, '').toLowerCase();
        
        if (submissionUrl === normalizedUrl) {
          const id = row.id;
          const title = titleLink.textContent.trim();
          const scoreText = scoreElement?.textContent || '0 points';
          const score = parseInt(scoreText.match(/\d+/)?.[0] || '0');
          const commentsText = commentsLink?.textContent || '0 comments';
          const descendants = parseInt(commentsText.match(/\d+/)?.[0] || '0');
          
          submissions.push({
            id: id,
            title: title,
            score: score,
            descendants: descendants,
            time: Date.now() / 1000 // Approximate timestamp
          });
        }
      }
      
      // Return highest-scoring match if any found
      if (submissions.length === 0) return null;
      
      return submissions.reduce((best, current) => 
        current.score > best.score ? current : best
      );
      
    } catch (error) {
      console.error('Duplicate check failed:', error);
      return null;
    }
  };
  
  // Show duplicate warning with actual HN title
  const showDuplicateWarning = (submission) => {
    duplicateWarning.classList.add('show');
    
    // Show the actual HN submission title
    duplicateTitle.textContent = submission.title;
    
    const timeAgo = getTimeAgo(submission.time);
    duplicateStats.textContent = `${submission.score} points, ${submission.descendants} comments, ${timeAgo}`;
    
    // Update button to view discussion
    buttonText.textContent = 'View Discussion';
    
    // Store the submission ID for the button click
    submitButton.dataset.duplicateId = submission.id;
    
    // Keep title section hidden when duplicate found
    titleSection.classList.add('hidden');
  };
  
  // Helper to format time ago
  const getTimeAgo = (timestamp) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // Clean title according to HN guidelines
  const cleanTitleForHN = (title, url) => {
    if (!title) return '';
    
    let cleaned = title.trim();
    
    // Remove site name from title if it matches domain
    if (url) {
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        const siteName = domain.split('.')[0];
        
        // Remove common site name patterns
        const sitePatterns = [
          new RegExp(`\\s*[-–—|]\\s*${siteName}\\s*$`, 'i'),
          new RegExp(`^${siteName}\\s*[-–—|:]\\s*`, 'i'),
          new RegExp(`\\s*\\(${siteName}\\)\\s*$`, 'i')
        ];
        
        sitePatterns.forEach(pattern => {
          cleaned = cleaned.replace(pattern, '');
        });
      } catch (e) {
        // Invalid URL, continue
      }
    }
    
    // Remove gratuitous numbers and adjectives, convert to HN-friendly format
    const numberPatterns = [
      /^\d+\s+Amazing\s+/i,
      /^\d+\s+Incredible\s+/i,
      /^\d+\s+Best\s+/i,
      /^\d+\s+Top\s+/i,
      /^\d+\s+Essential\s+/i,
      /^\d+\s+Must-Know\s+/i,
      /^\d+\s+Ways?\s+[Tt]o\s+/i,
      /^\d+\s+Tips?\s+[Ff]or\s+/i,
      /^\d+\s+Reasons?\s+[Ww]hy\s+/i,
      /^\d+\s+Things?\s+/i,
      /^\d+\s+Ideas?\s+[Ff]or\s+/i,
      /^\d+\s+Methods?\s+[Ff]or\s+/i,
      /^\d+\s+Strategies?\s+[Ff]or\s+/i,
      /^\d+\s+[Ff]acts?\s+[Aa]bout\s+/i
    ];
    
    numberPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, (match) => {
        if (pattern.source.includes('Ways?\\s+[Tt]o')) {
          return 'How to ';
        }
        if (pattern.source.includes('Tips?\\s+[Ff]or')) {
          return 'Tips for ';
        }
        if (pattern.source.includes('Reasons?\\s+[Ww]hy')) {
          return 'Why ';
        }
        if (pattern.source.includes('Ideas?\\s+[Ff]or')) {
          return 'Ideas for ';
        }
        if (pattern.source.includes('Methods?\\s+[Ff]or')) {
          return 'Methods for ';
        }
        if (pattern.source.includes('Strategies?\\s+[Ff]or')) {
          return 'Strategies for ';
        }
        if (pattern.source.includes('Facts?\\s+[Aa]bout')) {
          return 'Facts about ';
        }
        return '';
      });
    });
    
    // Remove excessive punctuation and promotional language
    cleaned = cleaned.replace(/!+$/, ''); // Remove trailing exclamation marks
    cleaned = cleaned.replace(/[?]+$/, ''); // Multiple question marks
    cleaned = cleaned.replace(/\s*[-–—]\s*The\s+Ultimate\s+Guide\s*$/i, ''); // Remove "The Ultimate Guide" suffix
    
    // Convert to title case for better HN readability (but preserve acronyms)
    cleaned = cleaned.replace(/\b\w+/g, (word) => {
      // Keep known acronyms in uppercase
      const acronyms = ['HTML', 'CSS', 'JSON', 'HTTP', 'HTTPS', 'API', 'SDK', 'AI', 'ML', 'UI', 'UX', 'JS', 'TS', 'CSS', 'SQL', 'OS', 'URL', 'ID', 'JSON', 'XML', 'SVG'];
      if (acronyms.includes(word.toUpperCase())) return word.toUpperCase();
      // Capitalize first letter, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    
    // Remove leading/trailing whitespace and double spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  };

  // Initialize the extension
  try {
    // Detect extension environment
    const tabsApi = (typeof browser !== 'undefined' && browser?.tabs)
      ? browser.tabs
      : ((typeof chrome !== 'undefined' && chrome?.tabs) ? chrome.tabs : null);
    let defaultTitle;
    
    if (!tabsApi) {
      // Preview fallback (non-extension environment)
      currentTab = { url: 'https://example.com/preview-article', title: 'Preview: Example Article Title' };
      originalTitle = currentTab.title || '';
      cleanedTitle = cleanTitleForHN(originalTitle, currentTab.url);
      const shouldUseCleaned = cleanedTitle && cleanedTitle !== originalTitle && cleanedTitle.length > 0;
      const displayTitle = shouldUseCleaned ? cleanedTitle : originalTitle;
      usingCleanedTitle = shouldUseCleaned;
      pageTitle.textContent = originalTitle || 'Untitled';
      pageUrl.textContent = currentTab.url || '';
      if (shouldUseCleaned) {
        titleToggle.classList.add('show');
        originalTitleShow.textContent = originalTitle;
        cleanedTitleShow.textContent = cleanedTitle;
        toggleButton.addEventListener('click', () => {
          usingCleanedTitle = !usingCleanedTitle;
          const newTitle = usingCleanedTitle ? cleanedTitle : originalTitle;
          titleInput.value = newTitle;
          titleInput.classList.add('placeholder');
          isPlaceholderMode = true;
          toggleButton.textContent = usingCleanedTitle ? 'use original instead' : 'use cleaned version';
          if (usingCleanedTitle) {
            originalTitleShow.className = 'title-original';
            cleanedTitleShow.className = 'title-cleaned';
          } else {
            originalTitleShow.className = 'title-cleaned';
            cleanedTitleShow.className = 'title-original';
          }
        });
      }
      titleSection.classList.remove('hidden');
      defaultTitle = displayTitle || 'Enter title or leave blank to use above';
      titleInput.value = defaultTitle;
      titleInput.classList.add('placeholder');
      isPlaceholderMode = true;
    } else {
      // Extension environment
      const [tab] = await tabsApi.query({ active: true, currentWindow: true });
      if (!tab) {
        pageTitle.textContent = 'Error: No active tab';
        pageUrl.textContent = '';
        submitButton.disabled = true;
        return;
      }
      currentTab = tab;

    // Store and process titles
    originalTitle = tab.title || '';
    cleanedTitle = cleanTitleForHN(originalTitle, tab.url);
    
    // Determine which title to show
    const shouldUseCleaned = cleanedTitle && cleanedTitle !== originalTitle && cleanedTitle.length > 0;
    const displayTitle = shouldUseCleaned ? cleanedTitle : originalTitle;
    usingCleanedTitle = shouldUseCleaned;
    
    // Display the page info
    pageTitle.textContent = originalTitle || 'Untitled';
    pageUrl.textContent = tab.url || '';
    
    // Show title toggle if titles are different
    if (shouldUseCleaned) {
      titleToggle.classList.add('show');
      originalTitleShow.textContent = originalTitle;
      cleanedTitleShow.textContent = cleanedTitle;
      
      toggleButton.addEventListener('click', () => {
        usingCleanedTitle = !usingCleanedTitle;
        const newTitle = usingCleanedTitle ? cleanedTitle : originalTitle;
        
        titleInput.value = newTitle;
        titleInput.classList.add('placeholder');
        isPlaceholderMode = true;
        
        toggleButton.textContent = usingCleanedTitle ? 'use original instead' : 'use cleaned version';
        
        // Update the comparison display
        if (usingCleanedTitle) {
          originalTitleShow.className = 'title-original';
          cleanedTitleShow.className = 'title-cleaned';
        } else {
          originalTitleShow.className = 'title-cleaned';
          cleanedTitleShow.className = 'title-original';
        }
      });
    }
    
    // Set up placeholder-style behavior for title input
    defaultTitle = displayTitle || 'Enter title or leave blank to use above';
    titleInput.value = defaultTitle;
    titleInput.classList.add('placeholder');
    isPlaceholderMode = true;
    
    // Start duplicate check in background (don't block UI)
    if (currentTab.url && !currentTab.url.startsWith('chrome://') && !currentTab.url.startsWith('moz-extension://') && !currentTab.url.includes('localhost')) {
      // Show checking status and hide title section
      checkingStatus.classList.add('show');
      titleSection.classList.add('hidden');
      
      checkForDuplicate(currentTab.url).then(result => {
        // Hide checking status
        checkingStatus.classList.remove('show');
        
        if (result) {
          existingSubmission = result;
          showDuplicateWarning(result);
        } else {
          // Show title section if no duplicate found
          titleSection.classList.remove('hidden');
        }
      }).catch(error => {
        console.error('Duplicate check failed:', error);
        // Hide checking status and show title section on error
        checkingStatus.classList.remove('show');
        titleSection.classList.remove('hidden');
      });
    } else {
      // For local URLs or preview, just show the title section immediately
      titleSection.classList.remove('hidden');
    }
    }
    
    // Auto-focus the title input
    setTimeout(() => {
      titleInput.focus();
      titleInput.select(); // Select all text for easy replacement
    }, 100);

    // Wire AI assistance buttons (graceful degradation)
    const aiAvailable = typeof window.aiService !== 'undefined';
    let proofreaderCanAuto = false;
    if (!aiAvailable) {
      // Disable buttons if AI service is missing
      [aiGenerateBtn, aiRewriteBtn, aiProofreadBtn].forEach((btn) => {
        if (btn) btn.disabled = true;
      });
      setAIAvailabilityNote('Built-in AI unavailable. Ensure origin trials are active and models download on first use.');
    } else {
      // Per-API availability gating
      try {
        const avail = await window.aiService.availability();
        const gate = (btn, info, label) => {
          if (!btn) return;
          const supported = info && info.supported;
          const status = info && info.status;
          if (!supported || status === 'unavailable' || status === 'error') {
            // Special case: Proofread can fall back to Rewriter
            if (label === 'Proofread' && avail.rewriter && avail.rewriter.supported && ['ready','downloadable'].includes(avail.rewriter.status)) {
              btn.disabled = false;
              btn.title = 'Proofread via rewrite fallback';
            } else {
              btn.disabled = true;
              btn.title = `${label} unavailable (${status || 'unsupported'})`;
            }
          } else {
            btn.disabled = false;
            btn.title = status === 'downloadable' ? `${label} will download on first use` : `${label} ready`;
          }
        };

        gate(aiGenerateBtn, avail.writer, 'AI Generate');
        gate(aiRewriteBtn, avail.rewriter, 'Rewrite');
        gate(aiProofreadBtn, avail.proofreader, 'Proofread');

        proofreaderCanAuto = !!(avail.proofreader && avail.proofreader.supported && ['ready','downloadable'].includes(avail.proofreader.status));

        const disabled = [
          { label: 'Writer', info: avail.writer },
          { label: 'Rewriter', info: avail.rewriter },
          { label: 'Proofreader', info: avail.proofreader },
        ].filter(({ info }) => !info.supported || info.status === 'unavailable' || info.status === 'error');
        if (disabled.length) {
          const msgs = disabled.map(({ label, info }) => `${label}: ${info.status || 'unsupported'}`);
          setAIAvailabilityNote(`Some AI features are unavailable — ${msgs.join('; ')}.`);
        } else if (avail.writer.status === 'downloadable' || avail.rewriter.status === 'downloadable' || avail.proofreader.status === 'downloadable') {
          setAIAvailabilityNote('Models will download on first AI use; please wait for completion.');
        } else {
          setAIAvailabilityNote('');
        }
      } catch (e) {
        console.warn('AI availability check failed:', e);
      }

      // Progress monitor
      window.aiService.on((evt) => {
        if (evt.type === 'download' && typeof evt.payload?.loaded === 'number') {
          const pct = Math.round(evt.payload.loaded * 100);
          // Only show download status if no active action status is visible
          const hasActiveStatus = aiStatus && aiStatus.style.display !== 'none' && aiStatusText && aiStatusText.textContent && !/No changes needed/i.test(aiStatusText.textContent);
          if (!hasActiveStatus) {
            setAIStatus(`Downloading model… ${pct}%`);
            if (pct >= 100) setAIStatus('Model ready');
          }
        }
      });

      const getCurrentTitleSeed = () => {
        if (isPlaceholderMode || titleInput.value.trim() === '' || titleInput.value === defaultTitle) {
          return usingCleanedTitle ? cleanedTitle : originalTitle;
        }
        return titleInput.value.trim();
      };

      // Debounced inline proofreading hint
      let proofreadTimer = null;
      const scheduleProofread = () => {
        if (!proofreaderCanAuto) return;
        if (proofreadTimer) clearTimeout(proofreadTimer);
        proofreadTimer = setTimeout(async () => {
          try {
            const input = titleInput.value.trim();
            if (!input || input === defaultTitle) return;
            const corrected = await window.aiService.proofreadTitle(input);
            if (corrected && corrected.trim() && corrected.trim() !== input.trim()) {
              // Compact hint with apply action
              aiStatusText.textContent = `Suggestion: "${corrected.trim()}"`;
              const applyBtn = document.createElement('button');
              applyBtn.textContent = 'Apply';
              applyBtn.className = 'submit-button';
              applyBtn.style.padding = '4px 8px';
              applyBtn.style.fontSize = '12px';
              applyBtn.style.marginLeft = '8px';
              applyBtn.addEventListener('click', () => {
                titleInput.value = corrected.trim();
                titleInput.classList.remove('placeholder');
                aiStatusText.textContent = '';
                aiStatus.style.display = 'none';
                aiStatus.classList.remove('hint-fade');
                showToast('Applied correction');
                titleInput.focus();
                const end = titleInput.value.length;
                try { titleInput.setSelectionRange(end, end); } catch (_) {}
              });
              // Reset status area and append button
               aiStatus.classList.remove('hint-fade'); // restart animation
               void aiStatus.offsetWidth;
              aiStatus.style.display = 'block';
              // Clear previous button if any
              while (aiStatus.childNodes.length > 1) aiStatus.removeChild(aiStatus.lastChild);
              aiStatus.appendChild(applyBtn);
               aiStatus.classList.add('hint-fade');
            } else {
              setAIStatus('');
            }
          } catch (_) {
            // Silently ignore proofreading failures for minimal UX
          }
        }, 600);
      };

      if (aiGenerateBtn) {
        aiGenerateBtn.addEventListener('click', async () => {
          try {
            markSelected(aiGenerateBtn);
            setAIStatus('Generating title…');
            const seed = getCurrentTitleSeed();
            const variants = await window.aiService.writeTitleVariants(seed, 3, 'Hacker News submission title');
            if (Array.isArray(variants) && variants.length > 0) {
              renderSuggestions(variants);
            } else {
              const output = await window.aiService.writeTitle(seed, 'Hacker News submission title');
              if (output && output.trim().length > 0) {
                titleInput.value = output.trim();
                titleInput.classList.remove('placeholder');
                isPlaceholderMode = false;
              }
              renderSuggestions([]);
            }
            setAIStatus('');
          } catch (e) {
            console.error('AI Generate failed:', e);
            showError('AI Generate unavailable. Ensure Chrome built-in AI and origin trial token.');
            setAIStatus('');
          }
        });
      }

      if (aiRewriteBtn) {
        aiRewriteBtn.addEventListener('click', async () => {
          try {
            markSelected(aiRewriteBtn);
            setAIStatus('Rewriting title…');
            const input = getCurrentTitleSeed();
            
            // Get multiple rewrite variants with different tones
            const variants = await window.aiService.rewriteTitleVariants(input, 3);
            if (Array.isArray(variants) && variants.length > 0) {
              // Auto-apply the first suggestion for immediate feedback
              const best = variants[0].trim();
              if (best.length > 0 && best !== input.trim()) {
                titleInput.value = best;
                titleInput.classList.remove('placeholder');
                isPlaceholderMode = false;
                showToast('Applied best rewrite');
              }
              renderSuggestions(variants);
            } else {
              // Fallback to single rewrite if variants fail
              const output = await window.aiService.rewriteTitle(input, { tone: 'as-is', length: 'shorter' });
              if (output && output.trim().length > 0) {
                titleInput.value = output.trim();
                titleInput.classList.remove('placeholder');
                isPlaceholderMode = false;
                showToast('Applied rewrite');
              }
              renderSuggestions([]);
            }
            setAIStatus('');
          } catch (e) {
            console.error('AI Rewrite failed:', e);
            showError('AI Rewrite unavailable. Ensure Chrome built-in AI and origin trial token.');
            setAIStatus('');
          }
        });
      }

      if (aiProofreadBtn) {
        aiProofreadBtn.addEventListener('click', async () => {
          try {
            markSelected(aiProofreadBtn);
            setAIStatus('Proofreading title…');
            const input = getCurrentTitleSeed();
            const corrected = await window.aiService.proofreadTitle(input);
            if (corrected && corrected.trim().length > 0 && corrected.trim() !== input.trim()) {
              titleInput.value = corrected.trim();
              titleInput.classList.remove('placeholder');
              isPlaceholderMode = false;
              showToast('Applied proofreading');
              setAIStatus('');
            } else {
              // Positive affirmation when no corrections are required
              setAIStatus('No changes needed');
              setTimeout(() => setAIStatus(''), 1500);
            }
          } catch (e) {
            console.error('AI Proofread failed:', e);
            showError('AI Proofread unavailable. Ensure Chrome built-in AI and origin trial token.');
            setAIStatus('');
          }
        });
      }
    }


    // Set up the submit button click handler
    submitButton.addEventListener('click', () => {
      if (!currentTab) return;
      
      // Check if this is a "View Discussion" click for a duplicate
      if (submitButton.dataset.duplicateId) {
        const discussionUrl = `https://news.ycombinator.com/item?id=${submitButton.dataset.duplicateId}`;
        const createTab = (u) => {
          if (typeof browser !== 'undefined' && browser?.tabs) {
            browser.tabs.create({ url: u });
          } else if (typeof chrome !== 'undefined' && chrome?.tabs) {
            chrome.tabs.create({ url: u });
          } else {
            console.log('Preview mode: would open', u);
          }
        };
        showToast('Opening discussion…');
        createTab(discussionUrl);
        try { window.close(); } catch (_) {}
        return;
      }
      
      // Normal submission flow
      // Use custom title from input, fallback to cleaned or original title
      // Don't use placeholder text as the title
      let customTitle;
      if (isPlaceholderMode || titleInput.value.trim() === '') {
        customTitle = cleanedTitle || currentTab.title || 'Untitled';
      } else {
        customTitle = titleInput.value.trim();
      }
      const hackerNewsUrl = `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(currentTab.url)}&t=${encodeURIComponent(customTitle)}`;
      
      // Open Hacker News submission page in a new tab
      const createTab = (u) => {
        if (typeof browser !== 'undefined' && browser?.tabs) {
          browser.tabs.create({ url: u });
        } else if (typeof chrome !== 'undefined' && chrome?.tabs) {
          chrome.tabs.create({ url: u });
        } else {
          console.log('Preview mode: would open', u);
        }
      };
      showToast('Opening Hacker News…');
      createTab(hackerNewsUrl);
      
      // Close the popup
      window.close();
    });
    
    // Handle placeholder behavior
    titleInput.addEventListener('focus', () => {
      if (isPlaceholderMode) {
        titleInput.value = '';
        titleInput.classList.remove('placeholder');
        isPlaceholderMode = false;
      }
    });
    
    titleInput.addEventListener('blur', () => {
      if (titleInput.value.trim() === '') {
        titleInput.value = defaultTitle;
        titleInput.classList.add('placeholder');
        isPlaceholderMode = true;
      }
    });
    
      titleInput.addEventListener('input', () => {
        // Auto-resize textarea
        titleInput.style.height = 'auto';
        titleInput.style.height = titleInput.scrollHeight + 'px';
      
      // Remove placeholder styling when typing
        if (isPlaceholderMode && titleInput.value !== defaultTitle) {
          titleInput.classList.remove('placeholder');
          isPlaceholderMode = false;
        }

        // Schedule proofreading suggestion
        scheduleProofread();
      });
    
    titleInput.addEventListener('keydown', (e) => {
      // Clear placeholder text on first keypress (except special keys)
      if (isPlaceholderMode && !['Enter', 'Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(e.key)) {
        titleInput.value = '';
        titleInput.classList.remove('placeholder');
        isPlaceholderMode = false;
      }

      // Keyboard navigation for suggestions
      const items = aiSuggestionsList ? Array.from(aiSuggestionsList.querySelectorAll('li')) : [];
      const hasSuggestions = aiSuggestions && aiSuggestions.style.display !== 'none' && items.length > 0;
      const clearSelection = () => {
        items.forEach((el) => el.classList.remove('selected'));
      };
      const applySelection = () => {
        if (!hasSuggestions || suggestionIndex < 0 || suggestionIndex >= items.length) return;
        const text = items[suggestionIndex].innerText || items[suggestionIndex].textContent || '';
        if (text.trim().length > 0) {
          titleInput.value = text.trim();
          titleInput.classList.remove('placeholder');
          isPlaceholderMode = false;
          aiSuggestions.style.display = 'none';
          showToast('Applied suggestion');
          titleInput.focus();
          const end = titleInput.value.length;
          try { titleInput.setSelectionRange(end, end); } catch (_) {}
        }
      };
      if (hasSuggestions) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          suggestionIndex = (suggestionIndex + 1) % items.length;
          clearSelection();
          items[suggestionIndex].classList.add('selected');
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          suggestionIndex = (suggestionIndex - 1 + items.length) % items.length;
          clearSelection();
          items[suggestionIndex].classList.add('selected');
        } else if (e.key === 'Enter' && !(e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          applySelection();
        }
      }

      // Esc clears the proofreading hint area
      if (e.key === 'Escape') {
        aiStatusText.textContent = '';
        aiStatus.style.display = 'none';
        aiStatus.classList.remove('hint-fade');
      }

      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        // Cmd/Ctrl + Enter submits
        submitButton.click();
      }
    });
    
    // Setup guidelines modal
    const showGuidelines = () => {
      guidelinesTooltip.classList.add('show');
      tooltipOverlay.classList.add('show');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };
    
    const hideGuidelines = () => {
      guidelinesTooltip.classList.remove('show');
      tooltipOverlay.classList.remove('show');
      document.body.style.overflow = 'auto';
    };
    
    guidelinesLink.addEventListener('click', (e) => {
      e.preventDefault();
      showGuidelines();
    });
    
    tooltipClose.addEventListener('click', hideGuidelines);
    tooltipOverlay.addEventListener('click', hideGuidelines);
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && guidelinesTooltip.classList.contains('show')) {
        hideGuidelines();
      }
    });

  } catch (error) {
    console.error('Error initializing extension:', error);
    showError('Failed to load page information. Please try again.');
    pageTitle.textContent = 'Error loading page info';
    pageUrl.textContent = '';
    submitButton.disabled = true;
  }
});