// Whether an entry appears, decided once for every output: the pages, the
// document component behind the CV and the resume, the JSON Resume document,
// the dist check, the content mechanism test, and the browser tests all read
// these rather than each keeping a copy of the condition. The scripts and the tests import this file the way they
// import order.ts, with Node stripping the types, so nothing here may need a
// runtime import: the vocabularies come in as types only.

import type { CertificateKind, ProjectStatus, Visibility } from '../content.config';

// A project is shown when it is not hidden and its work is finished. A hidden
// project stays in the source and out of every output, as the first effort
// allowed; an unfinished one is kept the same way, so nothing on a hiring
// document claims more than the content states (src/content/README.md,
// "projects/").
export function isShown(project: { visibility: Visibility; status: ProjectStatus }): boolean {
  return project.visibility !== 'hidden' && project.status === 'completed';
}

// The one project marked `featured` among those shown, or undefined when none
// is. Two marked is a mistake the build stops on, naming both files, since
// the page has room to put only one forward. The schema already refuses the
// mark on a project that is not shown; checking it again here keeps the
// answer right for a caller handed the whole collection.
export function featuredProject<
  E extends { id: string; filePath?: string; data: { featured?: boolean; visibility: Visibility; status: ProjectStatus } },
>(projects: E[]): E | undefined {
  const marked = projects.filter((project) => project.data.featured === true && isShown(project.data));
  if (marked.length > 1) {
    const files = marked.map((project) => project.filePath ?? `src/content/projects/${project.id}.yaml`);
    throw new Error(`only one project can be featured, and ${files.length} are: ${files.join(' and ')}`);
  }
  return marked[0];
}

// An entry marked for the short resume. Absent means no.
export function onResume(entry: { resume?: boolean }): boolean {
  return entry.resume === true;
}

// The two halves of the certificates collection: an online course completion,
// and a credential that is not one.
export function isCourse(certificate: { kind: CertificateKind }): boolean {
  return certificate.kind === 'course';
}

export function isCertification(certificate: { kind: CertificateKind }): boolean {
  return certificate.kind === 'certification';
}
