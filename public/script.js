document.addEventListener('DOMContentLoaded', () => {
    const lengthRange = document.getElementById('lengthRange');
    const lengthValue = document.getElementById('lengthValue');
    const chkLowercase = document.getElementById('chkLowercase');
    const chkUppercase = document.getElementById('chkUppercase');
    const chkNumbers = document.getElementById('chkNumbers');
    const chkSymbols = document.getElementById('chkSymbols');
    const generateBtn = document.getElementById('generateBtn');
    const passwordOutput = document.getElementById('passwordOutput');
    const copyBtn = document.getElementById('copyBtn');
    const copyTooltip = document.getElementById('copyTooltip');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    lengthRange.addEventListener('input', (e) => {
        lengthValue.textContent = e.target.value;
        updateStrength(passwordOutput.value);
    });

    copyBtn.addEventListener('click', () => {
        if (!passwordOutput.value) return;
        navigator.clipboard.writeText(passwordOutput.value).then(() => {
            copyTooltip.classList.remove('opacity-0');
            setTimeout(() => {
                copyTooltip.classList.add('opacity-0');
            }, 1500);
        });
    });

    passwordOutput.addEventListener('input', (e) => {
        updateStrength(e.target.value);
    });

    function updateStrength(value) {
        const length = value.length;
        const hasLower = /[a-z]/.test(value);
        const hasUpper = /[A-Z]/.test(value);
        const hasNum = /[0-9]/.test(value);
        const hasSym = /[^A-Za-z0-9]/.test(value);
        let score = 0;
        if (length >= 4) score += 1;
        if (length >= 8) score += 1;
        if (length >= 12) score += 1;
        const variety = [hasLower, hasUpper, hasNum, hasSym].filter(Boolean).length;
        score += Math.max(0, variety - 1);
        let width = 0;
        let color = 'bg-red-500';
        let label = 'None';
        if (length === 0) { width = 0; color = 'bg-red-500'; label = 'None'; }
        else if (score <= 2) { width = '25%'; color = 'bg-red-500'; label = 'Weak'; }
        else if (score <= 3) { width = '50%'; color = 'bg-yellow-500'; label = 'Medium'; }
        else if (score <= 4) { width = '75%'; color = 'bg-emerald-500'; label = 'Strong'; }
        else { width = '100%'; color = 'bg-emerald-600'; label = 'Very Strong'; }
        strengthBar.style.width = typeof width === 'number' ? `${width}%` : width;
        strengthBar.className = `h-full ${color} transition-all duration-300`;
        strengthText.textContent = label;
    }

    async function generatePassword() {
        const originalText = generateBtn.textContent;
        generateBtn.textContent = 'Generating...';
        generateBtn.disabled = true;
        try {
            const length = lengthRange.value;
            const useLowercase = chkLowercase.checked;
            const useUppercase = chkUppercase.checked;
            const useNumbers = chkNumbers.checked;
            const useSymbols = chkSymbols.checked;
            const response = await fetch(`/api/generate?length=${length}&lowercase=${useLowercase}&uppercase=${useUppercase}&numbers=${useNumbers}&symbols=${useSymbols}`);
            const data = await response.json();
            if (data.success) {
                passwordOutput.value = data.password;
                updateStrength(data.password);
            } else {
                passwordOutput.value = 'Error generating';
                updateStrength('');
            }
        } catch (error) {
            passwordOutput.value = 'Server Offline';
            updateStrength('');
        } finally {
            generateBtn.textContent = originalText;
            generateBtn.disabled = false;
        }
    }

    generateBtn.addEventListener('click', generatePassword);
    generatePassword();
});
