import { Modal, type App } from 'obsidian';
import { createRoot, type Root } from 'react-dom/client';
import type { ReactNode } from 'react';
export class ReactModal extends Modal {
  private root: Root | null = null;
  private previous: HTMLElement | null = null;
  constructor(
    app: App,
    private readonly title: string,
    private readonly renderContent: (close: () => void) => ReactNode,
    private readonly disposed: () => void,
  ) {
    super(app);
  }
  onOpen() {
    this.previous = this.containerEl.ownerDocument.activeElement as HTMLElement | null;
    this.setTitle(this.title);
    this.modalEl.addClass('money-manager', 'mm-host-modal');
    this.contentEl.addClass('money-manager');
    this.root = createRoot(this.contentEl);
    this.root.render(this.renderContent(() => this.close()));
  }
  onClose() {
    this.root?.unmount();
    this.root = null;
    this.contentEl.empty();
    this.previous?.focus();
    this.disposed();
  }
}
