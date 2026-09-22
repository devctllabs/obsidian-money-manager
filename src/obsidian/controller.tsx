import { Platform, TFolder, type App } from 'obsidian';
import type { MoneyDocuments } from '../application/workspace/workspace';
import type { WorkspaceConnection } from '../application/workspace/connection';
import type { SettingsWorkflow } from '../application/workspace/settings';
import { ShellController } from '../features/shell/controller';
import { ReactModal } from './ReactModal';
export { localToday } from '../features/shell/controller';

export class Controller extends ShellController {
  private readonly modals: Set<ReactModal>;
  constructor(
    app: App,
    documents: MoneyDocuments,
    connection: WorkspaceConnection,
    settings: SettingsWorkflow,
  ) {
    const modals = new Set<ReactModal>();
    super(
      {
        pickerMode: Platform.isMobile ? 'native' : 'desktop',
        folders: () =>
          app.vault
            .getAllLoadedFiles()
            .filter((file) => file instanceof TFolder)
            .map((folder) => folder.path),
        dialog: (title, render) => {
          const modal = new ReactModal(app, title, render, () => modals.delete(modal));
          modals.add(modal);
          modal.open();
        },
        openDocument: (path) => {
          void app.workspace.openLinkText(path, '', false);
        },
      },
      documents,
      connection,
      settings,
    );
    this.modals = modals;
  }
  dispose() {
    for (const modal of [...this.modals]) modal.close();
    this.modals.clear();
  }
}
