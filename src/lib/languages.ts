// The one place a language's printed level is built, read by the document
// component for the page and by the JSON Resume mapper for `fluency`, so the
// two carry the same string by construction rather than by two copies of a
// template. The dist check and the browser tests import this file the way
// they import shown.ts, with Node stripping the types, so nothing here may
// need a runtime import.

export interface LanguageTest {
  name: string;
  score: string;
  // ISO, as the content contract stringifies it. A bare year read straight
  // from YAML by a script is a number, which is why it is stringified below,
  // as src/lib/order.ts does for a period.
  date: string | number;
}

// "Working proficiency, STEP 85 (2022)": the level as authored, then the test
// where one was taken, after the locale's own list separator. The year alone
// and not the date, as a period prints (formatPeriod in src/lib/i18n.ts): the
// month of a language test is nothing a reader needs, while the year is what
// tells a reader how old the score is.
export function levelLine(level: string, test: LanguageTest | undefined, separator: string): string {
  if (!test) return level;
  return `${level}${separator}${test.name} ${test.score} (${String(test.date).slice(0, 4)})`;
}
