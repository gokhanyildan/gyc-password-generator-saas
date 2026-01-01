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
    const chkAvoidAmbiguous = getElement('chkAvoidAmbiguous');
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
    const visibilityToggle = getElement('visibilityToggle');
    const eyeIcon = getElement('eyeIcon');
    const eyeOffIcon = getElement('eyeOffIcon');

    // Early exit if critical elements are missing
    if (!tabString || !tabPassphrase || !tabAnalyze || !stringOptions || 
        !passphraseOptions || !analysisPanel || !generateBtn || !passwordOutput) {
        console.error('Critical DOM elements missing. Application cannot initialize.');
        return;
    }

    let activeMode = 'string';
    let wordlist = null;
    let isPasswordVisible = true;

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
        
        // Remove ambiguous characters if checkbox is checked
        if (chkAvoidAmbiguous && chkAvoidAmbiguous.checked) {
            const ambiguousChars = 'Il1O0';
            valid = valid.split('').filter(char => !ambiguousChars.includes(char)).join('');
        }
        
        // BUG FIX: If no characters are selected, return null instead of forcing a fallback
        if (!valid || valid.length === 0) {
            return null; 
        }
        
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
        const sep = separatorInput.value || '-';
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
        
        const val = activeMode === 'string' 
            ? generateString() 
            : generatePassphraseSync();
            
        // If val is null (invalid config), just clear output, don't show angry red errors on startup
        if (val === null) {
            passwordOutput.value = '';
            updateStrength('');
        } else {
            passwordOutput.value = val || '';
            updateStrength(val || '');
        }
    }

    // Calculate entropy in bits
    function calculateEntropy(value) {
        if (!value || value.length === 0) return 0;
        
        // For string passwords: entropy = length * log2(character_set_size)
        if (activeMode === 'string') {
            let charsetSize = 0;
            const sets = {
                lower: /[a-z]/.test(value) ? 26 : 0,
                upper: /[A-Z]/.test(value) ? 26 : 0,
                nums: /[0-9]/.test(value) ? 10 : 0,
                syms: /[^A-Za-z0-9]/.test(value) ? 33 : 0 // Approximate symbol count
            };
            charsetSize = sets.lower + sets.upper + sets.nums + sets.syms;
            if (charsetSize === 0) charsetSize = 26; // Fallback to lowercase only
            return Math.round(value.length * Math.log2(charsetSize));
        }
        
        // For passphrases: entropy = word_count * log2(wordlist_size)
        // Estimate based on word count (assuming ~2000 word wordlist)
        if (activeMode === 'passphrase') {
            const words = value.split(/[^a-zA-Z]+/).filter(w => w.length >= 3);
            const wordlistSize = wordlist && wordlist.length > 0 ? wordlist.length : fallbackWordlist.length;
            const baseEntropy = words.length * Math.log2(wordlistSize);
            
            // Add entropy for numbers and symbols if present
            let extraEntropy = 0;
            if (/[0-9]/.test(value)) extraEntropy += Math.log2(10000); // 4-digit number
            if (/[^A-Za-z0-9]/.test(value)) extraEntropy += Math.log2(8); // Symbol from set of 8
            
            return Math.round(baseEntropy + extraEntropy);
        }
        
        // For analyze mode: estimate based on character diversity
        const len = value.length;
        const charsetSize = new Set(value.split('')).size;
        return Math.round(len * Math.log2(Math.max(charsetSize, 26)));
    }

    function updateStrength(value) {
        if (!strengthBar || !strengthText) return;

        let score = 0;
        let label = 'None';
        const entropy = calculateEntropy(value);
        
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
        // Display entropy next to strength rating
        strengthText.textContent = value ? `${label} (${entropy} bits)` : label;
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
           const res = await fetch('./wordlist.txt');
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
        const sep = separatorInput ? (separatorInput.value || '-') : '-';
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

        const originalText = generateBtn.textContent;
        generateBtn.textContent = 'Generating...';
        generateBtn.disabled = true;

        try {
            // Clear previous error styles
            passwordOutput.classList.remove('border-red-500', 'text-red-500', 'placeholder-red-500');
            passwordOutput.classList.add('text-emerald-400'); // Restore default color

            const val = activeMode === 'string' 
                ? generateString() 
                : await generatePassphrase();

            // BUG FIX: Handle empty selection error
            if (val === null) {
                passwordOutput.value = ''; // Clear value
                passwordOutput.placeholder = 'Please select at least one option!';
                
                // Add error styling (Red border and text)
                passwordOutput.classList.remove('text-emerald-400');
                passwordOutput.classList.add('border-red-500', 'placeholder-red-500');
                
                // Shake animation (optional visual feedback)
                passwordOutput.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-5px)' },
                    { transform: 'translateX(5px)' },
                    { transform: 'translateX(0)' }
                ], { duration: 200, iterations: 2 });
                
                updateStrength(''); // Clear strength bar
            } else {
                // Success path
                if (passwordOutput) {
                    passwordOutput.value = val || '';
                    updateStrength(val || '');
                }
            }
        } catch (err) {
            console.error('Error generating password:', err);
            if (passwordOutput) {
                passwordOutput.value = '';
                updateStrength('');
            }
        } finally {
            if (generateBtn) {
                generateBtn.textContent = originalText;
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
    
    // Password visibility toggle
    if (visibilityToggle && passwordOutput && eyeIcon && eyeOffIcon) {
        visibilityToggle.addEventListener('click', () => {
            isPasswordVisible = !isPasswordVisible;
            
            if (isPasswordVisible) {
                passwordOutput.type = 'text';
                eyeIcon.classList.remove('hidden');
                eyeOffIcon.classList.add('hidden');
            } else {
                passwordOutput.type = 'password';
                eyeIcon.classList.add('hidden');
                eyeOffIcon.classList.remove('hidden');
            }
        });
    }
    
    if (copyBtn && passwordOutput && copyTooltip) {
        copyBtn.addEventListener('click', () => {
            if (!passwordOutput.value) return;
            
            navigator.clipboard.writeText(passwordOutput.value).then(() => {
                copyTooltip.textContent = 'Copied!';
                copyTooltip.classList.remove('opacity-0');
                setTimeout(() => {
                    if (copyTooltip) {
                        copyTooltip.classList.add('opacity-0');
                    }
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

    // Hotkeys: Enter or Spacebar to generate (unless in analyze mode or typing in input)
    document.addEventListener('keydown', (e) => {
        // Don't trigger if user is typing in the password input (analyze mode)
        if (document.activeElement === passwordOutput && activeMode === 'analyze') {
            return;
        }
        
        // Don't trigger if user is typing in separator input
        if (document.activeElement === separatorInput) {
            return;
        }
        
        // Generate on Enter or Spacebar
        if (e.key === 'Enter' || e.key === ' ') {
            // Prevent default behavior (form submission, page scroll)
            e.preventDefault();
            
            // Only generate if not in analyze mode
            if (activeMode !== 'analyze' && generateBtn) {
                generate();
            }
        }
    });

    // Initialize: Set mode but don't auto-generate - wait for user to click Generate
    setMode('string');
    
    // Initialize password visibility state
    if (passwordOutput && eyeIcon && eyeOffIcon) {
        passwordOutput.type = isPasswordVisible ? 'text' : 'password';
        if (!isPasswordVisible) {
            eyeIcon.classList.add('hidden');
            eyeOffIcon.classList.remove('hidden');
        }
    }
    
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
