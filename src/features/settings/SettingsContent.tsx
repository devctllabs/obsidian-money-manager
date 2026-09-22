import { CategoryWorkflow } from '../../application/categories/category-workflow';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Accent } from '../ui/Accent';
import { ChevronIcon } from '../ui/Icons';
import { RateEditor } from './RateEditor';
import { RateWorkflow } from '../../application/rates/rate-workflow';
import { rebase } from '../../domain/rates';
import { CategorySettings } from './CategorySettings';
import { Configuration } from './Configuration';
import type { ShellController } from '../shell/controller';
import type { SettingsSection } from './sections';
export function SettingsContent({
  controller,
  initialSection,
}: {
  controller: ShellController;
  initialSection?: SettingsSection;
}) {
  const ratesSection = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (initialSection !== 'manual-rates') return;
    const section = ratesSection.current;
    if (!section) return;
    section.open = true;
    section.scrollIntoView({ block: 'start' });
    section.querySelector<HTMLElement>('summary')?.focus();
  }, [initialSection]);
  const snapshot = useSyncExternalStore(
    controller.connection.subscribe,
    controller.connection.getSnapshot,
  );
  const currencies = Object.values(snapshot.accounts).map((account) => account.currency);
  const categoryCount =
    Object.keys(snapshot.categories.expense).length +
    Object.keys(snapshot.categories.income).length;
  return (
    <Accent appearance={controller.settings.current.appearance}>
      <div className="mm-settings-surface">
        <header className="mm-page-heading">
          <h1>Settings</h1>
          <p>Workspace, appearance and the way you organize your money.</p>
        </header>
        <Configuration
          createWorkspace={(root, reference) => controller.setup(root, reference)}
          reference={snapshot.rates?.reference}
          folders={controller.host.folders?.()}
          settings={controller.settings.current}
          reconnect={(root) => controller.connect(root)}
          save={async (settings) => {
            await controller.settings.update(settings);
            await controller.connection.index.refresh();
          }}
        />
        <details className="mm-settings-section">
          <summary className="mm-settings-disclosure">
            <span>
              <strong>Categories</strong>
              <small>Expense and income labels and colors</small>
            </span>
            <span className="mm-muted">{categoryCount}</span>
            <ChevronIcon direction="right" />
          </summary>
          <CategorySettings
            categories={snapshot.categories}
            create={(flow, name) => controller.editCategory(flow, undefined, name)}
            save={(flow, key, update) =>
              new CategoryWorkflow(controller.documents, controller.connection.index).edit(flow, {
                key,
                ...update,
              })
            }
            remove={controller.deleteCategory}
          />
        </details>
        <details className="mm-settings-section" ref={ratesSection}>
          <summary className="mm-settings-disclosure" tabIndex={-1}>
            <span>
              <strong>Manual rates</strong>
              <small>Current valuations and reference currency</small>
            </span>
            <span className="mm-muted">{snapshot.rates?.reference ?? 'Unavailable'}</span>
            <ChevronIcon direction="right" />
          </summary>
          <RateEditor
            rates={snapshot.rates}
            currencies={currencies}
            save={(expected, next) =>
              new RateWorkflow(controller.documents, controller.connection.index).save(
                expected,
                next,
              )
            }
            proposal={(table, reference) => rebase(table, reference, currencies)}
          />
        </details>
      </div>
    </Accent>
  );
}
