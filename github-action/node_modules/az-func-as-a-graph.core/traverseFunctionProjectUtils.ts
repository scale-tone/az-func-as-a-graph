
export function cleanupFunctionName(name: string): string {

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

export function removeNamespace(name: string): string {

    if (!name) {
        return name;
    }

    const dotPos = name.lastIndexOf('.');
    if (dotPos >= 0) {
        name = name.substring(dotPos + 1);
    }

    return name.trim();
}

// Primitive way of getting a line number out of symbol position
export function posToLineNr(code: string | undefined, pos: number): number {
    if (!code) {
        return 0;
    }
    const lineBreaks = code.substr(0, pos).match(/(\r\n|\r|\n)/g);
    return !lineBreaks ? 1 : lineBreaks.length + 1;
}

// Complements regex's inability to keep up with nested brackets
export function getCodeInBrackets(str: string, startFrom: number, openingBracket: string, closingBracket: string, mustHaveSymbols: string = ''): { code: string, openBracketPos: number } {

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

// Complements regex's inability to keep up with nested brackets
export function getCodeInBracketsReverse(str: string, openingBracket: string, closingBracket: string): { code: string, openBracketPos: number } {

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
                if (bracketCount <= 0 ) {
                    return { code: str.substring(0, closingBracketPos + 1), openBracketPos: i };
                }
                
                break;
        }
    }
    return { code: '', openBracketPos: -1 };
}
