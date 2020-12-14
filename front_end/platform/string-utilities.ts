// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export const escapeCharacters = (inputString: string, charsToEscape: string): string => {
  let foundChar = false;
  for (let i = 0; i < charsToEscape.length; ++i) {
    if (inputString.indexOf(charsToEscape.charAt(i)) !== -1) {
      foundChar = true;
      break;
    }
  }

  if (!foundChar) {
    return String(inputString);
  }

  let result = '';
  for (let i = 0; i < inputString.length; ++i) {
    if (charsToEscape.indexOf(inputString.charAt(i)) !== -1) {
      result += '\\';
    }
    result += inputString.charAt(i);
  }

  return result;
};

export const enum FormatterType {
  STRING = 'string',
  SPECIFIER = 'specifier',
}

export interface FormatterToken {
  type: FormatterType;
  value?: string|{description: string};
  specifier?: string;
  precision?: number;
  substitutionIndex?: number;
}

export const tokenizeFormatString = function(
    formatString: string, formatters: Record<string, Function>): FormatterToken[] {
  const tokens: FormatterToken[] = [];

  function addStringToken(str: string): void {
    if (!str) {
      return;
    }
    if (tokens.length && tokens[tokens.length - 1].type === FormatterType.STRING) {
      tokens[tokens.length - 1].value += str;
    } else {
      tokens.push({
        type: FormatterType.STRING,
        value: str,
      });
    }
  }

  function addSpecifierToken(specifier: string, precision: number, substitutionIndex: number): void {
    tokens.push({type: FormatterType.SPECIFIER, specifier, precision, substitutionIndex, value: undefined});
  }

  function addAnsiColor(code: number): void {
    type ColorType = 'color'|'colorLight'|'bgColor'|'bgColorLight';

    const types: Record<number, ColorType> = {3: 'color', 9: 'colorLight', 4: 'bgColor', 10: 'bgColorLight'};
    const colorCodes = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'lightGray', '', 'default'];
    const colorCodesLight =
        ['darkGray', 'lightRed', 'lightGreen', 'lightYellow', 'lightBlue', 'lightMagenta', 'lightCyan', 'white', ''];
    const colors: Record<ColorType, string[]> =
        {color: colorCodes, colorLight: colorCodesLight, bgColor: colorCodes, bgColorLight: colorCodesLight};
    const type = types[Math.floor(code / 10)] as ColorType;
    if (!type) {
      return;
    }
    const color = colors[type][code % 10];
    if (!color) {
      return;
    }
    tokens.push({
      type: FormatterType.SPECIFIER,
      specifier: 'c',
      value: {description: (type.startsWith('bg') ? 'background : ' : 'color: ') + color},
      precision: undefined,
      substitutionIndex: undefined,
    });
  }

  let textStart = 0;
  let substitutionIndex = 0;
  const re =
      new RegExp(`%%|%(?:(\\d+)\\$)?(?:\\.(\\d*))?([${Object.keys(formatters).join('')}])|\\u001b\\[(\\d+)m`, 'g');
  for (let match = re.exec(formatString); !!match; match = re.exec(formatString)) {
    const matchStart = match.index;
    if (matchStart > textStart) {
      addStringToken(formatString.substring(textStart, matchStart));
    }

    if (match[0] === '%%') {
      addStringToken('%');
    } else if (match[0].startsWith('%')) {
      const [, substitionString, precisionString, specifierString] = match;
      if (substitionString && Number(substitionString) > 0) {
        substitutionIndex = Number(substitionString) - 1;
      }
      const precision = precisionString ? Number(precisionString) : -1;
      addSpecifierToken(specifierString, precision, substitutionIndex);
      ++substitutionIndex;
    } else {
      const code = Number(match[4]);
      addAnsiColor(code);
    }
    textStart = matchStart + match[0].length;
  }
  addStringToken(formatString.substring(textStart));
  return tokens;
};

type FormatterFunction<T> = (input: string|{description: string}|undefined|T, token: FormatterToken) => unknown;

export const format = function<T, U>(
    formatString: string, substitutions: ArrayLike<U>|null, formatters: Record<string, FormatterFunction<U>>,
    initialValue: T, append: (initialValue: T, newString?: string) => T, tokenizedFormat?: FormatterToken[]): {
  formattedResult: T,
  unusedSubstitutions: ArrayLike<U>|null,
} {
  if (!formatString || ((!substitutions || !substitutions.length) && formatString.search(/\u001b\[(\d+)m/) === -1)) {
    return {formattedResult: append(initialValue, formatString), unusedSubstitutions: substitutions};
  }

  function prettyFunctionName(): string {
    return 'String.format("' + formatString + '", "' + Array.prototype.join.call(substitutions, '", "') + '")';
  }

  function warn(msg: string): void {
    console.warn(prettyFunctionName() + ': ' + msg);
  }

  function error(msg: string): void {
    console.error(prettyFunctionName() + ': ' + msg);
  }

  let result = initialValue;
  const tokens = tokenizedFormat || tokenizeFormatString(formatString, formatters);
  const usedSubstitutionIndexes: Record<number, boolean> = {};
  const actualSubstitutions: ArrayLike<U> = substitutions || [];

  for (const token of tokens) {
    if (token.type === FormatterType.STRING) {
      result = append(result, token.value as string);
      continue;
    }

    if (token.type !== FormatterType.SPECIFIER) {
      error('Unknown token type "' + token.type + '" found.');
      continue;
    }

    if (!token.value && token.substitutionIndex !== undefined &&
        token.substitutionIndex >= actualSubstitutions.length) {
      // If there are not enough substitutions for the current substitutionIndex
      // just output the format specifier literally and move on.
      error(
          'not enough substitution arguments. Had ' + actualSubstitutions.length + ' but needed ' +
          (token.substitutionIndex + 1) + ', so substitution was skipped.');
      result = append(
          result,
          '%' + ((token.precision !== undefined && token.precision > -1) ? token.precision : '') + token.specifier);
      continue;
    }

    if (!token.value && token.substitutionIndex !== undefined) {
      usedSubstitutionIndexes[token.substitutionIndex] = true;
    }

    if (token.specifier === undefined || !(token.specifier in formatters)) {
      // Encountered an unsupported format character, treat as a string.
      warn('unsupported format character \u201C' + token.specifier + '\u201D. Treating as a string.');
      const stringToAppend = (token.value || token.substitutionIndex === undefined) ?
          '' :
          String(actualSubstitutions[token.substitutionIndex]);
      result = append(result, stringToAppend);
      continue;
    }

    const formatter = formatters[token.specifier];
    const valueToFormat = token.value ||
        (token.substitutionIndex !== undefined ? actualSubstitutions[token.substitutionIndex] : undefined);
    const stringToAppend = formatter(valueToFormat, token);

    result = append(
        result,
        stringToAppend as string,
    );
  }

  const unusedSubstitutions = [];
  for (let i = 0; i < actualSubstitutions.length; ++i) {
    if (i in usedSubstitutionIndexes) {
      continue;
    }
    unusedSubstitutions.push(actualSubstitutions[i]);
  }

  return {formattedResult: result, unusedSubstitutions: unusedSubstitutions};
};

export const standardFormatters = {
  d: function(substitution: unknown): number {
    return (!isNaN(substitution as number) ? substitution as number : 0);
  },

  f: function(substitution: unknown, token: FormatterToken): string {
    if (substitution && typeof substitution === 'number' && token.precision !== undefined && token.precision > -1) {
      substitution = substitution.toFixed(token.precision);
    }
    const precision =
        (token.precision !== undefined && token.precision > -1) ? Number(0).toFixed(token.precision) : '0';
    return !isNaN(substitution as number) ? substitution as string : precision;
  },

  s: function(substitution: unknown): string {
    return substitution as string;
  },
};

export const vsprintf = function(formatString: string, substitutions: unknown[]): string {
  return format(formatString, substitutions, standardFormatters, '', (a, b) => a + b).formattedResult;
};

export const sprintf = function(format: string, ...varArg: unknown[]): string {
  return vsprintf(format, varArg);
};


export const toBase64 = (inputString: string): string => {
  /* note to the reader: we can't use btoa here because we need to
   * support Unicode correctly. See the test cases for this function and
   * also
   * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem
   */

  function encodeBits(b: number): number {
    return b < 26 ? b + 65 : b < 52 ? b + 71 : b < 62 ? b - 4 : b === 62 ? 43 : b === 63 ? 47 : 65;
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(inputString.toString());
  const n = data.length;
  let encoded = '';
  if (n === 0) {
    return encoded;
  }
  let shift;
  let v = 0;
  for (let i = 0; i < n; i++) {
    shift = i % 3;
    v |= data[i] << (16 >>> shift & 24);
    if (shift === 2) {
      encoded += String.fromCharCode(
          encodeBits(v >>> 18 & 63), encodeBits(v >>> 12 & 63), encodeBits(v >>> 6 & 63), encodeBits(v & 63));
      v = 0;
    }
  }
  if (shift === 0) {
    encoded += String.fromCharCode(encodeBits(v >>> 18 & 63), encodeBits(v >>> 12 & 63), 61, 61);
  } else if (shift === 1) {
    encoded += String.fromCharCode(encodeBits(v >>> 18 & 63), encodeBits(v >>> 12 & 63), encodeBits(v >>> 6 & 63), 61);
  }
  return encoded;
};

export const findIndexesOfSubString = (inputString: string, searchString: string): number[] => {
  const matches = [];
  let i = inputString.indexOf(searchString);
  while (i !== -1) {
    matches.push(i);
    i = inputString.indexOf(searchString, i + searchString.length);
  }
  return matches;
};

export const findLineEndingIndexes = (inputString: string): number[] => {
  const endings = findIndexesOfSubString(inputString, '\n');
  endings.push(inputString.length);
  return endings;
};

export const isWhitespace = (inputString: string): boolean => {
  return /^\s*$/.test(inputString);
};

export const trimURL = (url: string, baseURLDomain?: string): string => {
  let result = url.replace(/^(https|http|file):\/\//i, '');
  if (baseURLDomain) {
    if (result.toLowerCase().startsWith(baseURLDomain.toLowerCase())) {
      result = result.substr(baseURLDomain.length);
    }
  }
  return result;
};

export const collapseWhitespace = (inputString: string): string => {
  return inputString.replace(/[\s\xA0]+/g, ' ');
};

export const reverse = (inputString: string): string => {
  return inputString.split('').reverse().join('');
};

export const replaceControlCharacters = (inputString: string): string => {
  // Replace C0 and C1 control character sets with replacement character.
  // Do not replace '\t', \n' and '\r'.
  return inputString.replace(/[\0-\x08\x0B\f\x0E-\x1F\x80-\x9F]/g, '\uFFFD');
};

export const countWtf8Bytes = (inputString: string): number => {
  let count = 0;
  for (let i = 0; i < inputString.length; i++) {
    const c = inputString.charCodeAt(i);
    if (c <= 0x7F) {
      count++;
    } else if (c <= 0x07FF) {
      count += 2;
    } else if (c < 0xD800 || 0xDFFF < c) {
      count += 3;
    } else {
      if (c <= 0xDBFF && i + 1 < inputString.length) {
        // The current character is a leading surrogate, and there is a
        // next character.
        const next = inputString.charCodeAt(i + 1);
        if (0xDC00 <= next && next <= 0xDFFF) {
          // The next character is a trailing surrogate, meaning this
          // is a surrogate pair.
          count += 4;
          i++;
          continue;
        }
      }
      count += 3;
    }
  }
  return count;
};

export const stripLineBreaks = (inputStr: string): string => {
  return inputStr.replace(/(\r)?\n/g, '');
};

export const toTitleCase = (inputStr: string): string => {
  return inputStr.substring(0, 1).toUpperCase() + inputStr.substring(1);
};

export const removeURLFragment = (inputStr: string): string => {
  const url = new URL(inputStr);
  url.hash = '';
  return url.toString();
};

export const regexSpecialCharacters = function(): string {
  return '^[]{}()\\.^$*+?|-,';
};

export const filterRegex = function(query: string): RegExp {
  const toEscape = regexSpecialCharacters();
  let regexString = '';
  for (let i = 0; i < query.length; ++i) {
    let c = query.charAt(i);
    if (toEscape.indexOf(c) !== -1) {
      c = '\\' + c;
    }
    if (i) {
      regexString += '[^\\0' + c + ']*';
    }
    regexString += c;
  }
  return new RegExp(regexString, 'i');
};

export const createSearchRegex = function(query: string, caseSensitive: boolean, isRegex: boolean): RegExp {
  const regexFlags = caseSensitive ? 'g' : 'gi';
  let regexObject;

  if (isRegex) {
    try {
      regexObject = new RegExp(query, regexFlags);
    } catch (e) {
      // Silent catch.
    }
  }

  if (!regexObject) {
    regexObject = self.createPlainTextSearchRegex(query, regexFlags);
  }

  return regexObject;
};

export const caseInsensetiveComparator = function(a: string, b: string): number {
  a = a.toUpperCase();
  b = b.toUpperCase();
  if (a === b) {
    return 0;
  }
  return a > b ? 1 : -1;
};
