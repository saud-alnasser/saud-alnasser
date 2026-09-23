// Every string the interface shows, in both languages, keyed by locale. Content
// (names, summaries, dates) comes from src/content/; this file holds only the
// chrome around it: navigation labels, headings, status wordings, control
// labels. The Arabic is reviewed here without touching a template.
//
// Exports other pages and endpoints rely on:
//   Locale                  'en' | 'ar'
//   locales                 the locales with their direction and own name
//   strings[locale]         the UI strings for one locale
//   formatDate(locale, iso) a YYYY, YYYY-MM, or YYYY-MM-DD date for display
//   formatPeriod(locale, p) "2024", "2022-2026", or "2024-Present": years alone
//   plural(locale, n, forms) the form of a noun that goes with a count

export type Locale = 'en' | 'ar';

// A noun that takes a count, in the forms the language distinguishes. Arabic
// has six; English needs two. `other` is the fallback every language ends in.
export type PluralForms = { other: string } & Partial<Record<Intl.LDMLPluralRule, string>>;

export const locales: ReadonlyArray<{
  code: Locale;
  dir: 'ltr' | 'rtl';
  // The language's name in itself, which is what a switch shows.
  name: string;
  // The Open Graph locale, in its language_TERRITORY form.
  ogLocale: string;
}> = [
  { code: 'en', dir: 'ltr', name: 'English', ogLocale: 'en_US' },
  { code: 'ar', dir: 'rtl', name: 'العربية', ogLocale: 'ar_SA' },
];

export function isLocale(value: unknown): value is Locale {
  return locales.some((l) => l.code === value);
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ar' : 'en';
}

export function localeInfo(locale: Locale) {
  return locales.find((l) => l.code === locale)!;
}

const en = {
  skipToContent: 'Skip to content',
  nav: {
    label: 'Site',
    home: 'Home',
    work: 'Work',
    education: 'Education',
    cv: 'CV',
    resume: 'Resume',
    // The language menu's accessible name.
    language: 'Language',
  },
  theme: {
    switchTo: 'Switch to',
    dark: 'Dark theme',
    light: 'Light theme',
  },
  // A card's fold: the control that shows or hides a list too long for the
  // card. {count} is the number and {noun} the form of the list's noun that
  // goes with it, from `nouns`.
  fold: {
    show: 'Show {count} {noun}',
    hide: 'Hide {count} {noun}',
    nouns: {
      courses: { one: 'course', other: 'courses' } as PluralForms,
      highlights: { one: 'highlight', other: 'highlights' } as PluralForms,
    },
  },
  titleSeparator: ' - ',
  // Between items of an inline list: technologies, courses, keywords.
  listSeparator: ', ',
  pages: {
    work: {
      title: 'Work',
      description: 'Projects and work experience of {name}.',
    },
    education: {
      title: 'Education',
      description: 'Studies and certificates of {name}.',
    },
  },
  home: {
    contact: 'Contact',
    location: 'Location',
    sections: 'On this site',
    // One line per section card, saying what that section holds. The card
    // for a section that lives on another page leads to its heading there;
    // the skills card leads to the skills higher up this page, which is why
    // its line says where it is going.
    experience: 'Employment and practical training.',
    projects: 'Finished projects and what they are built with.',
    education: 'Schools and university, in order of time.',
    courses: 'Online courses completed, each with its certificate.',
    certifications: 'Credentials that are not course completions.',
    skills: 'What I work with, higher up this page.',
    cv: 'The whole record: experience, education and self-study, skills, languages, projects, and any certification held.',
    resume: 'The short one to send with an application: the summary, the work, and selected projects.',
    // What a section card says it holds: "19 projects", "26 courses". The
    // count comes from the collection the section renders, never from this
    // file. {count} is the number and {noun} the form of the section's noun
    // that goes with it, from `nouns`.
    counts: {
      line: '{count} {noun}',
      nouns: {
        projects: { one: 'project', other: 'projects' } as PluralForms,
        experience: { one: 'position', other: 'positions' } as PluralForms,
        education: { one: 'institution', other: 'institutions' } as PluralForms,
        courses: { one: 'course', other: 'courses' } as PluralForms,
        certifications: { one: 'certification', other: 'certifications' } as PluralForms,
        skills: { one: 'skill group', other: 'skill groups' } as PluralForms,
      },
    },
  },
  sections: {
    projects: 'Projects',
    experience: 'Experience',
    studies: 'Studies',
    courses: 'Courses',
    certifications: 'Certifications',
    skills: 'Skills',
  },
  project: {
    repository: 'Repository',
    live: 'Live site',
    technologies: 'Technologies',
  },
  experience: {
    training: 'Practical training',
    highlights: 'Highlights',
  },
  education: {
    // The statuses worth a line of their own. A completed degree is not among
    // them: its end date has already said so, and the word only repeated it.
    status: {
      'certificate-pending': 'Course work completed, certificate pending',
      'in-progress': 'In progress',
    },
    courses: 'Courses',
    // The one node on the timeline that is not an institution: the phase of
    // online courses between school and university. It stands for the
    // courses section, so `count` says how many courses, with `noun` in the
    // form the number takes, and `link` leads to that section.
    onlineCourses: {
      name: 'Online courses',
      count: '{count} {noun}',
      noun: { one: 'course', other: 'courses' } as PluralForms,
      link: 'View the courses',
    },
  },
  // A certificate card and the dialog it opens. `open` is what the card says
  // it does, so the link is named by what happens rather than by its address;
  // `document` names the PDF behind the preview, and `close` the control that
  // dismisses the dialog.
  certificate: {
    open: 'View certificate',
    document: 'Open the PDF',
    close: 'Close',
  },
  // The two document pages. Their section headings are the ones resume
  // parsers expect; the other headings reuse the site's own, above. The row
  // at the top of each page shares these labels, because both pages offer the
  // same control and differ only in which document it downloads.
  cv: {
    title: 'Curriculum vitae',
    description:
      'The curriculum vitae of {name}: the whole record of experience, education and self-study, skills, languages, projects, and any certification held, with PDF and JSON Resume downloads.',
    // The accessible name of the row a document page opens with, which holds
    // the one control that downloads that page's own document.
    documents: 'Documents',
    // The download control's name and its hover tooltip, which are the same
    // words. {document} is the title of the document being downloaded, so the
    // control says which of the two it is rather than only that it is a PDF.
    downloadPdf: 'Download {document} as PDF',
    // The form the download control opens at the marked address, where the
    // browser runs script; everywhere else that control downloads the
    // published PDF. The site publishes no contact detail, so a document that
    // carries one is made in that browser from what is typed here: `note` says
    // that a print dialog is what opens next, because a print dialog nobody
    // asked for reads as a bug, and `plain` is the way out that produces the
    // published document instead.
    form: {
      title: 'Add your contact details',
      note: 'What you type goes into this document in your browser and is sent nowhere, stored nowhere, and kept by nobody. Generating opens your print dialog: choose Save as PDF as the destination.',
      email: 'Email address',
      phone: 'Phone number',
      optional: 'Both are optional. Leave one empty and the document carries the other.',
      generate: 'Generate the document',
      plain: 'Download without contact details',
      close: 'Close',
    },
    summary: 'Summary',
    // The template names these two sections; the other headings on the page
    // are the site's own, above.
    experience: 'Work experience',
    skills: 'Key skills',
    languages: 'Languages',
    certifications: 'Certifications',
    // The one entry the CV's education section prints for the online
    // courses, in the timeline's place for them: the title, then `through`
    // over the count of courses read from the content, the noun in the form
    // the count takes from `education.onlineCourses.noun`, and the providers
    // joined in the language's own way, then the authored topics under
    // `topics`. What the entry says is src/content/self-study.yaml's.
    selfStudy: {
      title: 'Self-study',
      through: '{count} online {noun} at {providers}',
      topics: 'Topics',
    },
  },
  // The resume page. Everything else it shows is the CV's, above.
  resume: {
    title: 'Resume',
    description:
      'The short resume of {name}: the summary, experience, education, key skills, and selected projects, with a PDF download.',
  },
  period: {
    present: 'Present',
  },
};

export type Strings = typeof en;

// Drafted by an agent and awaiting Saud's review. Nothing here is published
// before he has read it.
const ar: Strings = {
  skipToContent: 'انتقل إلى المحتوى',
  nav: {
    label: 'الموقع',
    home: 'الرئيسية',
    work: 'الأعمال',
    education: 'التعليم',
    cv: 'السيرة الذاتية',
    resume: 'السيرة المختصرة',
    language: 'اللغة',
  },
  theme: {
    switchTo: 'التبديل إلى',
    dark: 'الوضع الداكن',
    light: 'الوضع الفاتح',
  },
  fold: {
    show: 'عرض {count} {noun}',
    hide: 'إخفاء {count} {noun}',
    // The counted noun in the form Arabic gives each range: one, two, three
    // to ten, eleven to ninety-nine, and the rest.
    nouns: {
      courses: { one: 'مقرر', two: 'مقرران', few: 'مقررات', many: 'مقرراً', other: 'مقرر' },
      highlights: { one: 'مهمة', two: 'مهمتان', few: 'مهام', many: 'مهمة', other: 'مهمة' },
    },
  },
  titleSeparator: ' - ',
  listSeparator: '، ',
  pages: {
    work: {
      title: 'الأعمال',
      description: 'مشاريع {name} وخبراته العملية.',
    },
    education: {
      title: 'التعليم',
      description: 'دراسة {name} وشهاداته.',
    },
  },
  home: {
    contact: 'التواصل',
    location: 'الموقع الجغرافي',
    sections: 'في هذا الموقع',
    experience: 'الوظائف والتدريب العملي.',
    projects: 'المشاريع المكتملة وما بُنيت به.',
    education: 'المدارس والجامعة بترتيب الزمن.',
    courses: 'دورات إلكترونية مكتملة، مع شهادة كل دورة.',
    certifications: 'شهادات ليست إتمام دورات.',
    skills: 'ما أعمل به، أعلى هذه الصفحة.',
    cv: 'السجل الكامل: الخبرة العملية والتعليم والتعلم الذاتي والمهارات واللغات والمشاريع وما يحمله من شهادات.',
    resume: 'النسخة المختصرة لمرافقة طلب التوظيف: الملخص والخبرة العملية ومشاريع مختارة.',
    counts: {
      line: '{count} {noun}',
      // The counted noun of each section, in the forms Arabic gives each
      // range: one, two, three to ten, eleven to ninety-nine, and the rest.
      nouns: {
        projects: { one: 'مشروع', two: 'مشروعان', few: 'مشاريع', many: 'مشروعاً', other: 'مشروع' },
        experience: { one: 'وظيفة', two: 'وظيفتان', few: 'وظائف', many: 'وظيفة', other: 'وظيفة' },
        education: { one: 'جهة تعليمية', two: 'جهتان تعليميتان', few: 'جهات تعليمية', many: 'جهة تعليمية', other: 'جهة تعليمية' },
        courses: { one: 'دورة', two: 'دورتان', few: 'دورات', many: 'دورةً', other: 'دورة' },
        certifications: { one: 'شهادة', two: 'شهادتان', few: 'شهادات', many: 'شهادةً', other: 'شهادة' },
        skills: {
          one: 'مجموعة مهارات',
          two: 'مجموعتا مهارات',
          few: 'مجموعات مهارات',
          many: 'مجموعة مهارات',
          other: 'مجموعة مهارات',
        },
      },
    },
  },
  sections: {
    projects: 'المشاريع',
    experience: 'الخبرة العملية',
    studies: 'الدراسة',
    courses: 'الدورات',
    certifications: 'الشهادات',
    skills: 'المهارات',
  },
  project: {
    repository: 'المستودع',
    live: 'الموقع المنشور',
    technologies: 'التقنيات',
  },
  experience: {
    training: 'تدريب عملي',
    highlights: 'أبرز المهام',
  },
  education: {
    status: {
      'certificate-pending': 'اكتملت المقررات الدراسية، ولم تصدر الشهادة بعد',
      'in-progress': 'قيد الدراسة',
    },
    courses: 'المقررات',
    onlineCourses: {
      name: 'الدورات الإلكترونية',
      count: '{count} {noun}',
      // The counted noun in the form Arabic gives each range, as `fold` above.
      noun: { one: 'دورة', two: 'دورتان', few: 'دورات', many: 'دورةً', other: 'دورة' },
      link: 'عرض الدورات',
    },
  },
  certificate: {
    open: 'عرض الشهادة',
    document: 'فتح ملف PDF',
    close: 'إغلاق',
  },
  cv: {
    title: 'السيرة الذاتية',
    description:
      'سيرة {name} الذاتية: السجل الكامل للخبرة العملية والتعليم والتعلم الذاتي والمهارات واللغات والمشاريع وما يحمله من شهادات، مع تنزيلها بصيغة PDF وبصيغة JSON Resume.',
    documents: 'المستندات',
    downloadPdf: 'تنزيل {document} بصيغة PDF',
    form: {
      title: 'أضف بيانات التواصل',
      note: 'ما تكتبه يُضاف إلى هذا المستند داخل متصفحك، ولا يُرسل إلى أي جهة ولا يُحفظ في أي مكان. عند الإنشاء تُفتح نافذة الطباعة: اختر الحفظ بصيغة PDF.',
      email: 'البريد الإلكتروني',
      phone: 'رقم الجوال',
      optional: 'كلاهما اختياري. اترك أحدهما فارغًا ويحمل المستند الآخر.',
      generate: 'إنشاء المستند',
      plain: 'تنزيل بدون بيانات التواصل',
      close: 'إغلاق',
    },
    summary: 'الملخص',
    experience: 'الخبرة العملية',
    skills: 'المهارات الأساسية',
    languages: 'اللغات',
    certifications: 'الشهادات',
    selfStudy: {
      title: 'التعلم الذاتي',
      // The counted noun takes the form Arabic gives each range, as the
      // timeline node's does, and the adjective stays singular after it.
      through: '{count} {noun} إلكترونية في {providers}',
      topics: 'الموضوعات',
    },
  },
  resume: {
    title: 'السيرة المختصرة',
    description:
      'السيرة المختصرة لـ{name}: الملخص والخبرة العملية والتعليم والمهارات الأساسية ومشاريع مختارة، مع تنزيلها بصيغة PDF.',
  },
  period: {
    present: 'الآن',
  },
};

export const strings: Record<Locale, Strings> = { en, ar };

// Fills "{name}" and similar slots in a string.
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}

// Dates are authored once, in the JSON Resume form, and only their display is
// per language. Both languages use the Gregorian calendar and Latin digits, so
// a year reads the same in both and matches what the content file says.
const dateLocale: Record<Locale, string> = {
  en: 'en-GB',
  ar: 'ar-SA-u-ca-gregory-nu-latn',
};

export function formatDate(locale: Locale, iso: string | number): string {
  // A bare year read straight from YAML is a number; the content contract
  // stringifies it, but a caller outside the build may not have.
  const parts = String(iso).split('-').map(Number);
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year!, (month ?? 1) - 1, day ?? 1));
  const options: Intl.DateTimeFormatOptions =
    parts.length === 3
      ? { year: 'numeric', month: 'short', day: 'numeric' }
      : parts.length === 2
        ? { year: 'numeric', month: 'short' }
        : { year: 'numeric' };
  return new Intl.DateTimeFormat(dateLocale[locale], { ...options, timeZone: 'UTC' }).format(date);
}

// The form of a noun that goes with a count, by the language's own rules:
// plural('ar', 21, nouns.courses) is the form for eleven to ninety-nine.
export function plural(locale: Locale, count: number, forms: PluralForms): string {
  return forms[new Intl.PluralRules(locale).select(count)] ?? forms.other;
}

// A period prints as years: the one year the work fell in, or the start's
// year and the end's joined by a hyphen, or the start's year and the present
// where there is no end. The content keeps the month, because the ordering
// and the JSON Resume documents read it; a reader of a page or a document
// needs the year, and a resume parser reads "2022-2026" as a range. A hyphen
// and not an en dash: between two numbers a hyphen is a number separator to
// the bidi algorithm, so the Arabic pages show the range in one
// left-to-right piece with the start first, the same as the English.
export function formatPeriod(locale: Locale, period: { start: string | number; end?: string | number }): string {
  const start = year(period.start);
  const end = period.end ? year(period.end) : strings[locale].period.present;
  return start === end ? start : `${start}-${end}`;
}

// The year of a YYYY, YYYY-MM, or YYYY-MM-DD date, which is its first four
// characters. A bare year read straight from YAML is a number, as formatDate
// says, so it is stringified first.
function year(iso: string | number): string {
  return String(iso).slice(0, 4);
}
