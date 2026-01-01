document.addEventListener('DOMContentLoaded', () => {
    // Safe element getter with error handling
    function getElement(id) {
        const el = document.getElementById(id);
        if (!el) {
            console.error(`Element with id "${id}" not found`);
        }
        return el;
    }

    // Get all elements with null checks
    const tabString = getElement('tabString');
    const tabPassphrase = getElement('tabPassphrase');
    const tabAnalyze = getElement('tabAnalyze');
    const stringOptions = getElement('stringOptions');
    const passphraseOptions = getElement('passphraseOptions');
    const analysisPanel = getElement('analysisPanel');
    const analysisWarnings = getElement('analysisWarnings');
    const analysisSuggestions = getElement('analysisSuggestions');
    const lengthRange = getElement('lengthRange');
    const lengthValue = getElement('lengthValue');
    const wordsCountRange = getElement('wordsCountRange');
    const wordsCountValue = getElement('wordsCountValue');
    const chkLowercase = getElement('chkLowercase');
    const chkUppercase = getElement('chkUppercase');
    const chkNumbers = getElement('chkNumbers');
    const chkSymbols = getElement('chkSymbols');
    const separatorInput = getElement('separatorInput');
    const chkCapitalize = getElement('chkCapitalize');
    const chkPassNumbers = getElement('chkPassNumbers');
    const chkPassSymbols = getElement('chkPassSymbols');
    const generateBtn = getElement('generateBtn');
    const passwordOutput = getElement('passwordOutput');
    const copyBtn = getElement('copyBtn');
    const copyTooltip = getElement('copyTooltip');
    const strengthBar = getElement('strengthBar');
    const strengthText = getElement('strengthText');

    // Early exit if critical elements are missing
    if (!tabString || !tabPassphrase || !tabAnalyze || !stringOptions || 
        !passphraseOptions || !analysisPanel || !generateBtn || !passwordOutput) {
        console.error('Critical DOM elements missing. Application cannot initialize.');
        return;
    }

    let activeMode = 'string';
    let wordlist = null;

    // Fallback wordlist for immediate generation
    const fallbackWordlist = ['alpha','bravo','charlie','delta','echo','foxtrot','golf','hotel','india','juliet','kilo','lima','mike','november','oscar','papa','quebec','romeo','sierra','tango','uniform','victor','whiskey','xray','yankee','zulu','cloud','river','stone','light','shadow','ember','crystal','silver','gold','iron','copper','wolf','eagle','tiger','lion','bear','leaf','oak','pine','maple','jade','onyx','pearl','amber','storm','wind','rain','snow','fire','earth','sky'];

    function secureRandomInt(max) {
        if (max <= 0) return 0;
        const arr = new Uint32Array(1);
        const limit = Math.floor(0x100000000 / max) * max;
        let x;
        do {
            crypto.getRandomValues(arr);
            x = arr[0];
        } while (x >= limit);
        return x % max;
    }

    function generateString() {
        if (!lengthRange || !chkLowercase || !chkUppercase || !chkNumbers || !chkSymbols) {
            console.error('Required elements for string generation missing');
            return '';
        }

        const length = parseInt(lengthRange.value, 10) || 12;
        let valid = '';
        const sets = {
            lower: 'abcdefghijklmnopqrstuvwxyz',
            upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            nums: '0123456789',
            syms: '!@#$%^&*()_+~`|}{[]:;?><,./-='
        };
        
        if (chkLowercase.checked) valid += sets.lower;
        if (chkUppercase.checked) valid += sets.upper;
        if (chkNumbers.checked) valid += sets.nums;
        if (chkSymbols.checked) valid += sets.syms;
        
        if (!valid) valid = sets.lower;
        
        let out = '';
        for (let i = 0; i < length; i++) {
            const idx = secureRandomInt(valid.length);
            out += valid[idx];
        }
        return out;
    }

    // Synchronous passphrase generation using fallback wordlist
    function generatePassphraseSync() {
        if (!wordsCountRange || !separatorInput || !chkPassNumbers || !chkPassSymbols || !chkCapitalize) {
            console.error('Required elements for passphrase generation missing');
            return '';
        }

        const words = fallbackWordlist;
        if (!words || words.length === 0) {
            console.error('Wordlist is empty');
            return '';
        }

        const count = parseInt(wordsCountRange.value, 10) || 4;
        const sep = separatorInput.value || '';
        const addNum = chkPassNumbers.checked;
        const addSym = chkPassSymbols.checked;
        const cap = chkCapitalize.checked;
        const chosen = [];
        
        for (let i = 0; i < count; i++) {
            let w = words[secureRandomInt(words.length)];
            if (cap) w = w.charAt(0).toUpperCase() + w.slice(1);
            chosen.push(w);
        }
        
        let out = chosen.join(sep);
        if (addNum) out += sep + String(secureRandomInt(10000));
        if (addSym) {
            const syms = '!@#$%^&*';
            out += sep + syms[secureRandomInt(syms.length)];
        }
        return out;
    }

    // Immediate synchronous generation for startup - NO async, NO button state changes
    function generateImmediate() {
        if (!passwordOutput) return;
        
        // Generate immediately using sync functions - use fallback wordlist
        const val = activeMode === 'string' 
            ? generateString() 
            : generatePassphraseSync();
        
        if (passwordOutput) {
            passwordOutput.value = val || '';
            updateStrength(val || '');
        }
    }

    function updateStrength(value) {
        if (!strengthBar || !strengthText) return;

        let score = 0;
        let label = 'None';
        
        if (typeof zxcvbn === 'function') {
            try {
                const res = zxcvbn(value || '');
                score = res.score || 0;
                if (activeMode === 'analyze' && analysisWarnings && analysisSuggestions) {
                    updateAnalysisResult(res);
                }
            } catch (err) {
                console.error('Error in zxcvbn:', err);
                score = 0;
            }
        } else {
            const len = (value || '').length;
            const v = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].reduce((a, r) => a + (r.test(value) ? 1 : 0), 0);
            score = Math.min(4, (len >= 12 ? 2 : len >= 8 ? 1 : 0) + Math.max(0, v - 1));
            if (activeMode === 'analyze' && analysisWarnings && analysisSuggestions) {
                updateAnalysis(value);
            }
        }

        let width = '0%';
        if (!value) {
            label = 'None';
            width = '0%';
        } else if (score === 0 || score === 1) {
            label = 'Weak';
            width = '25%';
        } else if (score === 2) {
            label = 'Fair';
            width = '50%';
        } else if (score === 3) {
            label = 'Strong';
            width = '75%';
        } else {
            label = 'Very Strong';
            width = '100%';
        }

        strengthBar.style.width = width;
        strengthText.textContent = label;
    }

    function updateAnalysisResult(res) {
        if (!analysisWarnings || !analysisSuggestions) return;

        try {
            const warning = res.feedback && res.feedback.warning ? res.feedback.warning : '';
            const suggestions = res.feedback && Array.isArray(res.feedback.suggestions) ? res.feedback.suggestions : [];
            
            analysisWarnings.textContent = warning ? `Warning: ${warning}` : '';
            analysisSuggestions.innerHTML = suggestions.length 
                ? suggestions.map(s => `<li>${s}</li>`).join('') 
                : '';
            
            if (!warning && suggestions.length === 0 && (res.password || '').length) {
                analysisWarnings.textContent = 'No specific feedback.';
            }
        } catch (err) {
            console.error('Error updating analysis result:', err);
        }
    }

    function updateAnalysis(value) {
        if (!analysisWarnings || !analysisSuggestions) return;

        analysisWarnings.textContent = '';
        analysisSuggestions.innerHTML = '';
        
        if (typeof zxcvbn === 'function') {
            try {
                updateAnalysisResult(zxcvbn(value || ''));
            } catch (err) {
                console.error('Error in zxcvbn analysis:', err);
            }
        }
    }

    // Safe tab state management
    function setMode(mode) {
        if (!mode || (mode !== 'string' && mode !== 'passphrase' && mode !== 'analyze')) {
            console.error('Invalid mode:', mode);
            return;
        }

        activeMode = mode;

        // Reset all tabs to inactive state
        const allTabs = [tabString, tabPassphrase, tabAnalyze];
        allTabs.forEach(tab => {
            if (tab) {
                tab.classList.remove('text-white', 'font-semibold', 'bg-emerald-500/20');
                tab.classList.add('text-gray-300');
            }
        });

        // Set active tab
        let activeTab = null;
        if (mode === 'string' && tabString) {
            activeTab = tabString;
        } else if (mode === 'passphrase' && tabPassphrase) {
            activeTab = tabPassphrase;
        } else if (mode === 'analyze' && tabAnalyze) {
            activeTab = tabAnalyze;
        }

        if (activeTab) {
            activeTab.classList.remove('text-gray-300');
            activeTab.classList.add('text-white', 'font-semibold', 'bg-emerald-500/20');
        }

        // Show/hide option panels
        if (stringOptions) {
            stringOptions.classList.toggle('hidden', mode !== 'string');
        }
        if (passphraseOptions) {
            passphraseOptions.classList.toggle('hidden', mode !== 'passphrase');
        }
        if (analysisPanel) {
            analysisPanel.classList.toggle('hidden', mode !== 'analyze');
        }
        if (generateBtn) {
            generateBtn.classList.toggle('hidden', mode === 'analyze');
        }

        // CRITICAL: Update password input readonly state
        if (passwordOutput) {
            if (mode === 'analyze') {
                // In analyze mode: MUST be editable - remove ALL readonly restrictions
                passwordOutput.removeAttribute('readonly');
                passwordOutput.removeAttribute('readOnly');
                passwordOutput.readOnly = false;
                passwordOutput.disabled = false;
                passwordOutput.value = '';
                passwordOutput.placeholder = 'Type a password to analyze...';
                // Clear strength meter when switching to analyze mode
                if (strengthBar && strengthText) {
                    strengthBar.style.width = '0%';
                    strengthText.textContent = 'None';
                }
                // Force focus and ensure it's interactive
                requestAnimationFrame(() => {
                    if (passwordOutput) {
                        passwordOutput.focus();
                        // Double-check readonly is removed
                        passwordOutput.readOnly = false;
                        passwordOutput.removeAttribute('readonly');
                    }
                });
                updateAnalysis('');
            } else {
                // In string/passphrase mode: set readonly to prevent editing generated passwords
                passwordOutput.readOnly = true;
                passwordOutput.placeholder = 'Generate or Type to test...';
            }
        }
    }

    async function ensureWordlist() {
        if (wordlist && wordlist.length > 0) return wordlist;
        try {
            const res = await fetch('https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt');
            if (!res.ok) throw new Error('Failed to fetch wordlist');
            const txt = await res.text();
            wordlist = txt.split('\n').map(w => w.trim()).filter(w => w.length >= 3 && /^[a-z]+$/.test(w));
            if (wordlist.length === 0) throw new Error('Empty wordlist');
        } catch (err) {
            console.warn('Using fallback wordlist:', err);
            wordlist = fallbackWordlist;
        }
        return wordlist;
    }

    async function generatePassphrase() {
        if (!wordsCountRange || !separatorInput || !chkPassNumbers || !chkPassSymbols || !chkCapitalize) {
            console.error('Required elements for passphrase generation missing');
            return '';
        }

        const words = await ensureWordlist();
        if (!words || words.length === 0) {
            console.error('Wordlist is empty');
            return '';
        }

        const count = parseInt(wordsCountRange.value, 10) || 4;
        const sep = separatorInput ? (separatorInput.value || '') : '';
        const addNum = chkPassNumbers.checked;
        const addSym = chkPassSymbols.checked;
        const cap = chkCapitalize.checked;
        const chosen = [];
        
        for (let i = 0; i < count; i++) {
            let w = words[secureRandomInt(words.length)];
            if (cap) w = w.charAt(0).toUpperCase() + w.slice(1);
            chosen.push(w);
        }
        
        let out = chosen.join(sep);
        if (addNum) out += sep + String(secureRandomInt(10000));
        if (addSym) {
            const syms = '!@#$%^&*';
            out += sep + syms[secureRandomInt(syms.length)];
        }
        return out;
    }

    async function generate() {
        if (activeMode === 'analyze' || !generateBtn || !passwordOutput) return;
        
        const original = generateBtn.textContent;
        generateBtn.textContent = 'Generating...';
        generateBtn.disabled = true;
        
        try {
            const val = activeMode === 'string' 
                ? generateString() 
                : await generatePassphrase();
            
            if (passwordOutput) {
                passwordOutput.value = val || '';
                updateStrength(val || '');
            }
        } catch (err) {
            console.error('Error generating password:', err);
            if (passwordOutput) {
                passwordOutput.value = '';
                updateStrength('');
            }
        } finally {
            if (generateBtn) {
                generateBtn.textContent = original;
                generateBtn.disabled = false;
            }
        }
    }

    // Event listeners with null checks
    if (tabString) {
        tabString.addEventListener('click', () => setMode('string'));
    }
    if (tabPassphrase) {
        tabPassphrase.addEventListener('click', () => setMode('passphrase'));
    }
    if (tabAnalyze) {
        tabAnalyze.addEventListener('click', () => setMode('analyze'));
    }
    
    if (lengthRange && lengthValue) {
        lengthRange.addEventListener('input', e => {
            if (lengthValue) lengthValue.textContent = e.target.value;
        });
    }
    
    if (wordsCountRange && wordsCountValue) {
        wordsCountRange.addEventListener('input', e => {
            if (wordsCountValue) wordsCountValue.textContent = e.target.value;
        });
    }
    
    if (copyBtn && passwordOutput && copyTooltip) {
        copyBtn.addEventListener('click', () => {
            if (!passwordOutput.value) return;
            navigator.clipboard.writeText(passwordOutput.value).then(() => {
                copyTooltip.classList.remove('opacity-0');
                setTimeout(() => {
                    if (copyTooltip) copyTooltip.classList.add('opacity-0');
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        });
    }
    
    if (passwordOutput) {
        passwordOutput.addEventListener('input', e => {
            updateStrength(e.target.value);
        });
    }
    
    if (generateBtn) {
        generateBtn.addEventListener('click', generate);
    }

    // Initialize: Set mode but don't auto-generate - wait for user to click Generate
    setMode('string');
    
    // Clear password output on startup
    if (passwordOutput) {
        passwordOutput.value = '';
        updateStrength('');
    }
    
    // Pre-fetch wordlist in background for future use (non-blocking)
    ensureWordlist().catch(err => {
        console.warn('Background wordlist fetch failed, will use fallback:', err);
    });
});
