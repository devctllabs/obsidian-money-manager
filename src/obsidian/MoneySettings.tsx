import { PluginSettingTab, type App, type Plugin } from 'obsidian';
import { createRoot, type Root } from 'react-dom/client';
import type { Controller } from './controller';
import { SettingsContent } from '../features/settings/SettingsContent';
export class MoneySettings extends PluginSettingTab {
  private root: Root | null = null;
  constructor(
    app: App,
    plugin: Plugin,
    private readonly controller: Controller,
  ) {
    super(app, plugin);
  }
  display() {
    this.hide();
    this.containerEl.empty();
    this.containerEl.addClass('money-manager');
    this.root = createRoot(this.containerEl);
    this.root.render(<SettingsContent controller={this.controller} />);
  }
  hide() {
    this.root?.unmount();
    this.root = null;
  }
}
