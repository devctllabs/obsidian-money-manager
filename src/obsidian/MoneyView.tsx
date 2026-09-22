import { Accent } from '../features/ui/Accent';
import { normalizeViewState, type ViewState } from '../application/reports/view-state';
import { ItemView, type WorkspaceLeaf } from 'obsidian';
import { createRoot, type Root } from 'react-dom/client';
import { useSyncExternalStore } from 'react';
import { localToday } from './controller';
import type { Controller } from './controller';
import { MoneySurface } from '../features/shell/MoneySurface';
import { SettingsContent } from '../features/settings/SettingsContent';
import { WorkspaceSetup } from '../features/settings/WorkspaceSetup';
import { ErrorBoundary } from '../features/ui/ErrorBoundary';
import type { SettingsSection } from '../features/settings/sections';
export class MoneyView extends ItemView {
  private root: Root | null = null;
  private settingsSection: SettingsSection | undefined;
  private state: ViewState = normalizeViewState(null, localToday(), {});
  constructor(
    leaf: WorkspaceLeaf,
    private readonly controller: Controller,
  ) {
    super(leaf);
  }
  getViewType() {
    return 'money-manager';
  }
  getDisplayText() {
    return 'Money Manager';
  }
  getIcon() {
    return 'wallet';
  }
  async onOpen() {
    this.root = createRoot(this.contentEl);
    this.renderView();
  }
  async onClose() {
    this.root?.unmount();
    this.root = null;
  }
  getState() {
    return { ...this.state };
  }
  async setState(state: unknown, result: { history: boolean }) {
    this.settingsSection = undefined;
    this.state = normalizeViewState(
      state,
      localToday(),
      this.controller.connection.getSnapshot().accounts,
      this.controller.connection.getSnapshot().phase === 'ready',
    );
    this.renderView();
    await super.setState(this.getState(), result);
  }
  private renderView() {
    this.root?.render(
      <div className="money-manager mm-view-root">
        <ErrorBoundary>
          <ConnectedView
            controller={this.controller}
            state={this.state}
            change={this.changeState}
            settings={this.openSettings}
            settingsSection={this.settingsSection}
          />
        </ErrorBoundary>
      </div>,
    );
  }
  private readonly changeState = (state: ViewState) => {
    this.state = state;
    if (state.mode !== 'settings') this.settingsSection = undefined;
    this.renderView();
    this.app.workspace.requestSaveLayout();
  };
  private readonly openSettings = (section?: SettingsSection) => {
    if (this.state.mode === 'settings' && section === undefined) return;
    this.settingsSection = section;
    this.changeState({ ...this.state, mode: 'settings' });
  };
}
function ConnectedView({
  controller,
  state,
  change,
  settings,
  settingsSection,
}: {
  controller: Controller;
  state: ViewState;
  change: (state: ViewState) => void;
  settings: (section?: SettingsSection) => void;
  settingsSection?: SettingsSection;
}) {
  const snapshot = useSyncExternalStore(
    controller.connection.subscribe,
    controller.connection.getSnapshot,
  );
  if (!controller.configured)
    return (
      <WorkspaceSetup
        folders={controller.host.folders?.()}
        root={controller.settings.current.workspaceRoot}
        setup={(root, reference) => controller.setup(root, reference)}
        connect={(root) => controller.connect(root)}
      />
    );
  const query = normalizeViewState(state, localToday(), snapshot.accounts);
  return (
    <Accent appearance={controller.settings.current.appearance}>
      <MoneySurface
        pickerMode={controller.host.pickerMode}
        addEntry={() => controller.addEntry()}
        refresh={() => controller.connection.index.refresh()}
        overview={{
          query,
          change: (next) => change({ ...next, mode: state.mode }),
          edit: controller.addEntry,
          remove: controller.deleteEntry,
        }}
        snapshot={snapshot}
        mode={state.mode}
        setMode={(mode) => change({ ...state, mode })}
        settings={settings}
        settingsSurface={
          <SettingsContent controller={controller} initialSection={settingsSection} />
        }
        openDocument={controller.openDocument}
        accounts={{
          create: controller.createAccount,
          edit: controller.editAccount,
          remove: controller.deleteAccount,
          reconcile: (key) => controller.reconcile(key),
          editCheckpoint: (row) => controller.reconcile(row.entry.account, row),
          deleteCheckpoint: controller.deleteCheckpoint,
        }}
      />
    </Accent>
  );
}
