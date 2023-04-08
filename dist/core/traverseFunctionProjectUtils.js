"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCodeInBracketsReverse = exports.getCodeInBrackets = exports.posToLineNr = exports.removeNamespace = exports.cleanupFunctionName = void 0;
function cleanupFunctionName(name) {
    if (!name) {
        return name;
    }
    const nameofMatch = new RegExp(`nameof\\s*\\(\\s*([\\w\\.]+)\\s*\\)`).exec(name);
    if (!!nameofMatch) {
        return removeNamespace(nameofMatch[1]);
    }
    name = name.trim();
    if (name.startsWith('"')) {
        return name.replace(/^"/, '').replace(/"$/, '');
    }
    return removeNamespace(name);
}
exports.cleanupFunctionName = cleanupFunctionName;
function removeNamespace(name) {
    if (!name) {
        return name;
    }
    const dotPos = name.lastIndexOf('.');
    if (dotPos >= 0) {
        name = name.substring(dotPos + 1);
    }
    return name.trim();
}
exports.removeNamespace = removeNamespace;
// Primitive way of getting a line number out of symbol position
function posToLineNr(code, pos) {
    if (!code) {
        return 0;
    }
    const lineBreaks = code.substr(0, pos).match(/(\r\n|\r|\n)/g);
    return !lineBreaks ? 1 : lineBreaks.length + 1;
}
exports.posToLineNr = posToLineNr;
// Complements regex's inability to keep up with nested brackets
function getCodeInBrackets(str, startFrom, openingBracket, closingBracket, mustHaveSymbols = '') {
    var bracketCount = 0, openBracketPos = -1, mustHaveSymbolFound = !mustHaveSymbols;
    for (var i = startFrom; i < str.length; i++) {
        switch (str[i]) {
            case openingBracket:
                if (bracketCount <= 0) {
                    openBracketPos = i;
                }
                bracketCount++;
                break;
            case closingBracket:
                bracketCount--;
                if (bracketCount <= 0 && mustHaveSymbolFound) {
                    return { code: str.substring(startFrom, i + 1), openBracketPos: openBracketPos - startFrom };
                }
                break;
        }
        if (bracketCount > 0 && mustHaveSymbols.includes(str[i])) {
            mustHaveSymbolFound = true;
        }
    }
    return { code: '', openBracketPos: -1 };
}
exports.getCodeInBrackets = getCodeInBrackets;
// Complements regex's inability to keep up with nested brackets
function getCodeInBracketsReverse(str, openingBracket, closingBracket) {
    var bracketCount = 0, closingBracketPos = 0;
    for (var i = str.length - 1; i >= 0; i--) {
        switch (str[i]) {
            case closingBracket:
                if (bracketCount <= 0) {
                    closingBracketPos = i;
                }
                bracketCount++;
                break;
            case openingBracket:
                bracketCount--;
                if (bracketCount <= 0) {
                    return { code: str.substring(0, closingBracketPos + 1), openBracketPos: i };
                }
                break;
        }
    }
    return { code: '', openBracketPos: -1 };
}
exports.getCodeInBracketsReverse = getCodeInBracketsReverse;
//# sourceMappingURL=traverseFunctionProjectUtils.js.map