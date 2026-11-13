import { Component, ReactNode } from 'react';
import { issueUrl, APP_VERSION } from '../config';

/** Catches crashes in a page so one broken animation or chapter never blanks the whole app. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidUpdate(prev: { resetKey?: string }) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: undefined }); }
  render() {
    const e = this.state.error;
    if (!e) return this.props.children;
    const body = `**Page:** ${location.hash}\n**Version:** ${APP_VERSION}\n**Browser:** ${navigator.userAgent}\n\n**Error:**\n\`\`\`\n${e.message}\n${(e.stack ?? '').split('\n').slice(0, 6).join('\n')}\n\`\`\`\n\n**What I was doing:**\n`;
    return (
      <div className="card" style={{ borderColor: 'var(--red)' }}>
        <h2>⚠️ Something went wrong on this page</h2>
        <p className="muted">The rest of the app still works. Try another tab or topic.</p>
        <pre className="code" style={{ maxHeight: 160 }}>{e.message}</pre>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => this.setState({ error: undefined })}>Try again</button>
          <a className="btn" href={issueUrl(`Crash: ${location.hash}`, body)} target="_blank" rel="noreferrer">🐞 Report this problem</a>
        </div>
      </div>
    );
  }
}
