// Project-level settings. REPO_URL powers the "Report a problem" links (GitHub issues).
export const APP_VERSION = '0.6.0';
export const REPO_URL = 'https://github.com/Sivaramakrishnan-03/Learn-ML';
export function issueUrl(title: string, body: string) {
  const u = new URL(REPO_URL.replace(/\/$/, '') + '/issues/new');
  u.searchParams.set('title', title);
  u.searchParams.set('body', body);
  return u.toString();
}
