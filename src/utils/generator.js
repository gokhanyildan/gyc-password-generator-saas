const crypto = require('crypto');
const CHAR_SETS = { lowercase: 'abcdefghijklmnopqrstuvwxyz', uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', numbers: '0123456789', symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=' };
function generatePassword({ length = 12, useLowercase = true, useUppercase = true, useNumbers = true, useSymbols = true }) { let validChars = '';
 if (useLowercase) validChars += CHAR_SETS.lowercase; if (useUppercase) validChars += CHAR_SETS.uppercase; if (useNumbers) validChars += CHAR_SETS.numbers; if (useSymbols) validChars += CHAR_SETS.symbols;
 if (validChars.length === 0) validChars = CHAR_SETS.lowercase;
 let password = ''; const validCharsLength = validChars.length;
 for (let i = 0; i < length; i++) { const randomIndex = crypto.randomInt(0, validCharsLength); password += validChars[randomIndex]; }
 return password; }
 module.exports = { generatePassword };
