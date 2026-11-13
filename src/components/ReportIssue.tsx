import { issueUrl, APP_VERSION } from '../config';

/** "Report a mistake" link: opens a pre-filled GitHub issue for this page. */
export function ReportIssue({ topicId, tab }: { topicId: string; tab: string }) {
  const body = `**Topic:** ${topicId}\n**Tab:** ${tab}\n**Page:** ${location.hash}\n**Version:** ${APP_VERSION}\n\n**What is wrong or unclear?**\n\n**What should it say instead (if you know)?**\n`;
  return <a className="btn no-print" href={issueUrl(`[${topicId}] Mistake or unclear explanation (${tab})`, body)} target="_blank" rel="noreferrer">🐞 Report a mistake or unclear part</a>;
}
