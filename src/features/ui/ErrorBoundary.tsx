import { Component, type ReactNode } from 'react';
import { InlineNotice } from './InlineNotice';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <InlineNotice tone="error">
          This view could not be displayed. Close and reopen Money Manager. Your Markdown remains
          available.
        </InlineNotice>
      );
    return this.props.children;
  }
}
