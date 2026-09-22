import { Plugin } from 'obsidian';
import { VaultDocuments } from './obsidian/documents';
import { WorkspaceConnection } from './application/workspace/connection';
import { normalizeSettings, SettingsWorkflow } from './application/workspace/settings';
import { Controller, localToday } from './obsidian/controller';
import { MoneyView } from './obsidian/MoneyView';
import { MoneySettings } from './obsidian/MoneySettings';
export default class MoneyManager extends Plugin {
  private controller: Controller | null = null;
  private batch: number | null = null;
  private paths = new Set<string>();
  async onload() {
    const raw: unknown = await this.loadData();
    const settings = new SettingsWorkflow(normalizeSettings(raw), (value) => this.saveData(value));
    const documents = new VaultDocuments(this.app.vault);
    const connection = new WorkspaceConnection(documents, settings, localToday);
    const controller = new Controller(this.app, documents, connection, settings);
    controller.configured = raw !== null && raw !== undefined;
    this.controller = controller;
    controller.goAccounts = () => {
      void this.open('accounts');
    };
    const settingsTab = new MoneySettings(this.app, this, controller);
    this.addSettingTab(settingsTab);
    this.registerView('money-manager', (leaf) => new MoneyView(leaf, controller));
    this.addCommand({
      id: 'open-money-manager',
      name: 'Open',
      callback: () => {
        void this.open();
      },
    });
    this.addCommand({
      id: 'add-entry',
      name: 'Add entry',
      callback: () => {
        if (controller.configured) controller.addEntry();
        else void this.open();
      },
    });
    this.addRibbonIcon('wallet', 'Open Money Manager', () => {
      void this.open();
    });
    this.registerEvent(this.app.vault.on('create', (file) => this.enqueue(file.path)));
    this.registerEvent(this.app.vault.on('modify', (file) => this.enqueue(file.path)));
    this.registerEvent(this.app.vault.on('delete', (file) => this.enqueue(file.path)));
    this.registerEvent(
      this.app.vault.on('rename', (file, old) => {
        this.enqueue(old);
        this.enqueue(file.path);
      }),
    );
    this.app.workspace.onLayoutReady(() => {
      if (this.controller === controller && controller.configured) void connection.index.refresh();
    });
    this.registerDomEvent(document, 'visibilitychange', () => {
      if (!document.hidden && controller.configured) void connection.index.refresh();
    });
    this.register(() => {
      settingsTab.hide();
      controller.dispose();
      connection.dispose();
    });
  }
  private enqueue(path: string) {
    if (
      !this.controller?.configured ||
      !path.startsWith(`${this.controller.connection.index.root}/`)
    )
      return;
    this.paths.add(path);
    if (this.batch !== null) return;
    this.batch = window.setTimeout(() => {
      this.batch = null;
      const paths = [...this.paths];
      this.paths.clear();
      if (this.controller) void this.controller.connection.index.refreshPaths(paths);
    }, 60);
  }
  async open(mode?: 'accounts') {
    const existing = this.app.workspace.getLeavesOfType('money-manager')[0];
    const leaf = existing ?? this.app.workspace.getLeaf('tab');
    if (!existing || mode)
      await leaf.setViewState({
        type: 'money-manager',
        active: true,
        state: mode ? { mode } : undefined,
      });
    await this.app.workspace.revealLeaf(leaf);
  }
  onunload() {
    if (this.batch !== null) window.clearTimeout(this.batch);
    this.paths.clear();
    this.controller = null;
    for (const leaf of this.app.workspace.getLeavesOfType('money-manager')) {
      if (leaf.view instanceof MoneyView) void leaf.view.onClose();
    }
  }
}
