document.addEventListener('DOMContentLoaded', () => {
    const tabString = document.getElementById('tabString');
    const tabPassphrase = document.getElementById('tabPassphrase');
    const tabAnalyze = document.getElementById('tabAnalyze');
    const stringOptions = document.getElementById('stringOptions');
    const passphraseOptions = document.getElementById('passphraseOptions');
    const analysisPanel = document.getElementById('analysisPanel');
    const analysisWarnings = document.getElementById('analysisWarnings');
    const analysisSuggestions = document.getElementById('analysisSuggestions');
    const lengthRange = document.getElementById('lengthRange');
    const lengthValue = document.getElementById('lengthValue');
    const wordsCountRange = document.getElementById('wordsCountRange');
    const wordsCountValue = document.getElementById('wordsCountValue');
    const chkLowercase = document.getElementById('chkLowercase');
    const chkUppercase = document.getElementById('chkUppercase');
    const chkNumbers = document.getElementById('chkNumbers');
    const chkSymbols = document.getElementById('chkSymbols');
    const separatorInput = document.getElementById('separatorInput');
    const chkCapitalize = document.getElementById('chkCapitalize');
    const chkPassNumbers = document.getElementById('chkPassNumbers');
    const chkPassSymbols = document.getElementById('chkPassSymbols');
    const generateBtn = document.getElementById('generateBtn');
    const passwordOutput = document.getElementById('passwordOutput');
    const copyBtn = document.getElementById('copyBtn');
    const copyTooltip = document.getElementById('copyTooltip');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    let activeMode = 'string';
    let wordlist = null;

    function setMode(mode) {
        activeMode = mode;
        tabString.classList.toggle('text-white', mode === 'string');
        tabString.classList.toggle('font-semibold', mode === 'string');
        tabPassphrase.classList.toggle('text-white', mode === 'passphrase');
        tabPassphrase.classList.toggle('font-semibold', mode === 'passphrase');
        tabAnalyze.classList.toggle('text-white', mode === 'analyze');
        tabAnalyze.classList.toggle('font-semibold', mode === 'analyze');
        stringOptions.classList.toggle('hidden', mode !== 'string');
        passphraseOptions.classList.toggle('hidden', mode !== 'passphrase');
        analysisPanel.classList.toggle('hidden', mode !== 'analyze');
        generateBtn.classList.toggle('hidden', mode === 'analyze');
        passwordOutput.readOnly = false;
        passwordOutput.placeholder = mode === 'analyze' ? 'Type a password to analyze...' : 'Generate or Type to test...';
        if (mode === 'analyze') updateAnalysis(passwordOutput.value || '');
    }

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

    function updateStrength(value) {
        let score = 0;
        let label = 'None';
        if (typeof zxcvbn === 'function') {
            const res = zxcvbn(value || '');
            score = res.score;
            if (activeMode === 'analyze') updateAnalysisResult(res);
        } else {
            const len = (value || '').length;
            const v = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].reduce((a, r) => a + (r.test(value) ? 1 : 0), 0);
            score = Math.min(4, (len >= 12 ? 2 : len >= 8 ? 1 : 0) + Math.max(0, v - 1));
            if (activeMode === 'analyze') updateAnalysis(value);
        }
        let width = '0%';
        if (!value) label = 'None', width = '0%';
        else if (score === 0 || score === 1) label = 'Weak', width = '25%';
        else if (score === 2) label = 'Fair', width = '50%';
        else if (score === 3) label = 'Strong', width = '75%';
        else label = 'Very Strong', width = '100%';
        strengthBar.style.width = width;
        strengthText.textContent = label;
    }

    function updateAnalysisResult(res) {
        const warning = res.feedback && res.feedback.warning ? res.feedback.warning : '';
        const suggestions = res.feedback && Array.isArray(res.feedback.suggestions) ? res.feedback.suggestions : [];
        analysisWarnings.textContent = warning ? `Warning: ${warning}` : '';
        analysisSuggestions.innerHTML = suggestions.length ? suggestions.map(s => `<li>${s}</li>`).join('') : '';
        if (!warning && suggestions.length === 0 && (res.password || '').length) {
            analysisWarnings.textContent = 'No specific feedback.';
        }
    }

    function updateAnalysis(value) {
        analysisWarnings.textContent = '';
        analysisSuggestions.innerHTML = '';
        if (typeof zxcvbn === 'function') {
            updateAnalysisResult(zxcvbn(value || ''));
        }
    }

    function generateString() {
        const length = parseInt(lengthRange.value, 10);
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

    async function ensureWordlist() {
        if (wordlist && wordlist.length > 0) return wordlist;
        try {
            const res = await fetch('https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt');
            const txt = await res.text();
            wordlist = txt.split('\n').map(w => w.trim()).filter(w => w.length >= 3 && /^[a-z]+$/.test(w));
        } catch {
            wordlist = ['alpha','bravo','charlie','delta','echo','foxtrot','golf','hotel','india','juliet','kilo','lima','mike','november','oscar','papa','quebec','romeo','sierra','tango','uniform','victor','whiskey','xray','yankee','zulu','cloud','river','stone','light','shadow','ember','crystal','silver','gold','iron','copper','wolf','eagle','tiger','lion','bear','leaf','oak','pine','maple','jade','onyx','pearl','amber','storm','wind','rain','snow','fire','earth','sky'];
        }
        return wordlist;
    }

    async function generatePassphrase() {
        const words = await ensureWordlist();
        const count = parseInt(wordsCountRange.value, 10);
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

    async function generate() {
        if (activeMode === 'analyze') return;
        const original = generateBtn.textContent;
        generateBtn.textContent = 'Generating...';
        generateBtn.disabled = true;
        try {
            const val = activeMode === 'string' ? generateString() : await generatePassphrase();
            passwordOutput.value = val;
            updateStrength(val);
        } finally {
            generateBtn.textContent = original;
            generateBtn.disabled = false;
        }
    }

    tabString.addEventListener('click', () => setMode('string'));
    tabPassphrase.addEventListener('click', () => setMode('passphrase'));
    tabAnalyze.addEventListener('click', () => setMode('analyze'));
    lengthRange && lengthRange.addEventListener('input', e => { lengthValue.textContent = e.target.value; });
    wordsCountRange && wordsCountRange.addEventListener('input', e => { wordsCountValue.textContent = e.target.value; });
    copyBtn.addEventListener('click', () => {
        if (!passwordOutput.value) return;
        navigator.clipboard.writeText(passwordOutput.value).then(() => {
            copyTooltip.classList.remove('opacity-0');
            setTimeout(() => { copyTooltip.classList.add('opacity-0'); }, 1500);
        });
    });
    passwordOutput.addEventListener('input', e => { updateStrength(e.target.value); });
    generateBtn.addEventListener('click', generate);
    setMode('string');
    generate();
});
