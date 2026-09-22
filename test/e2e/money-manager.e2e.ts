import { browser, expect } from '@wdio/globals';
async function read(path: string) {
  return browser.executeObsidian(async ({ app, obsidian }, filePath) => {
    const file = app.vault.getAbstractFileByPath(filePath);
    return file instanceof obsidian.TFile ? app.vault.read(file) : '';
  }, path);
}
async function chooseCurrency(label: string, code: string) {
  const id = await browser.execute(
    (text: string) =>
      [...document.querySelectorAll('.mm-currency-field > label')].find(
        (node) => node.textContent === text,
      )?.id,
    label,
  );
  await click(`button[aria-labelledby="${id}"]`);
  await browser.$('input[aria-label="Search currencies"]').setValue(code);
  await browser.keys('Enter');
}
async function click(selector: string) {
  const element = browser.$(selector);
  await element.waitForDisplayed();
  await browser.executeAsync(
    (target, done) => {
      target.scrollIntoView({ block: 'center', behavior: 'instant' });
      requestAnimationFrame(() => requestAnimationFrame(() => done()));
    },
    await element,
  );
  await element.click();
}
async function saveModal(label: string) {
  await click(`button=${label}`);
  await browser.waitUntil(async () => !(await browser.$('.mm-host-modal').isExisting()), {
    timeout: 5000,
    timeoutMsg: `${label} did not close its dialog`,
  });
}
describe('Money Manager isolated host workflow', () => {
  it('sets up, records and edits a checkpoint, reflects Markdown and reloads cleanly', async () => {
    await browser.executeObsidianCommand('money-manager:open-money-manager');
    const surface = await browser.executeObsidian(({ app }) => {
      const view = app.workspace.getLeavesOfType('money-manager')[0]?.view as
        { contentEl?: HTMLElement } | undefined;
      const contentEl = view?.contentEl;
      const root = contentEl?.querySelector(':scope > .money-manager.mm-view-root');
      return root
        ? {
            contentHasPluginClass: contentEl?.classList.contains('money-manager') ?? false,
            background: getComputedStyle(root).backgroundColor,
            darkTheme: document.body.classList.contains('theme-dark'),
          }
        : null;
    });
    expect(surface).not.toBeNull();
    expect(surface?.contentHasPluginClass).toBe(false);
    expect(surface?.background).toBe(surface?.darkTheme ? 'rgb(23, 25, 30)' : 'rgb(255, 255, 255)');
    await click('button=Review setup');
    await click('button=Use this workspace');
    await click('button=Accounts');
    await click('button=Add account');
    await browser.$('input[name="name"]').setValue('Everyday');
    await browser.$('input[name="observed"]').setValue('100.00');
    await saveModal('Create account');
    await expect(browser.$('.mm-account .mm-amount')).toHaveText('100.00 USD');
    await click('[aria-label="More actions for Everyday"]');
    await click('button=Reconcile balance…');
    await browser.$('input[name="balance"]').setValue('93.00');
    await saveModal('Save checkpoint');
    await expect(browser.$('.mm-account .mm-amount')).toHaveText('93.00 USD');
    expect(await read('Money Manager/ACCOUNTS.md')).toContain('everyday:');
    await browser.executeObsidianCommand('money-manager:add-entry');
    expect(await browser.execute(() => document.activeElement?.getAttribute('name'))).toBe(
      'amount',
    );
    await browser.$('input[name="amount"]').setValue('7.00');
    await click('.mm-category-field button');
    await browser.$('input[aria-label="Search categories"]').setValue('Food');
    await click('button=Create “Food”');
    await browser.$('textarea[name="description"]').setValue('Lunch');
    await saveModal('Save entry');
    await expect(browser.$('.mm-account .mm-amount')).toHaveText('86.00 USD');
    await click('button=Overview');
    await expect(browser.$('.mm-entries')).toHaveText(expect.stringContaining('Lunch'));
    await click('[aria-label="More actions for Lunch"]');
    await click('button=Edit entry…');
    await browser.$('input[name="amount"]').setValue('5.00');
    await saveModal('Save entry');
    await click('button=Accounts');
    await expect(browser.$('.mm-account .mm-amount')).toHaveText('88.00 USD');
    expect(await read('Money Manager/CATEGORIES.md')).toContain('name: Food');
    await click('[aria-label="Settings"]');
    await browser.waitUntil(
      async () => browser.$('.mm-currency-field input[name="add-currency"]').isExisting(),
      { timeout: 10000, timeoutMsg: 'Money Manager settings did not mount' },
    );
    expect(await browser.getWindowHandles()).toHaveLength(1);
    expect(
      await browser.executeObsidian(
        ({ app }) => app.workspace.getLeavesOfType('money-manager').length,
      ),
    ).toBe(1);
    await click('summary*=Manual rates');
    await chooseCurrency('Add currency to table', 'GEL');
    await browser.$('input[name="rate-GEL"]').setValue('0.5');
    await click('button=Save rates');
    await expect(browser.$('p*=Rates saved')).toHaveText(expect.stringContaining('Rates saved'));
    expect(await read('Money Manager/RATES.md')).toContain('GEL: "0.5"');
    const mainWindow = await browser.getWindowHandle();
    await browser.executeObsidian(({ app }) => {
      for (const leaf of app.workspace.getLeavesOfType('money-manager')) leaf.detach();
      const setting = (
        app as unknown as {
          setting: { open: () => void; openTabById: (id: string) => void };
        }
      ).setting;
      setting.open();
      setting.openTabById('money-manager');
    });
    await browser.waitUntil(
      async () => {
        for (const handle of await browser.getWindowHandles()) {
          await browser.switchToWindow(handle);
          if (await browser.$('.mm-settings-surface').isDisplayed()) {
            return true;
          }
        }
        return false;
      },
      { timeout: 10000, timeoutMsg: 'Native Money Manager settings did not mount' },
    );
    await browser.switchToWindow(mainWindow);
    await browser.executeObsidian(({ app }) =>
      (app as unknown as { setting: { close: () => void } }).setting.close(),
    );
    await browser.executeObsidianCommand('money-manager:open-money-manager');
    await click('button=Overview');
    await click('button=Year');
    await expect(browser.$('.mm-year-chart')).toBeDisplayed();
    await expect(browser.$('.mm-year-chart li')).toExist();
    expect(await browser.$$('.mm-year-chart li').length).toBe(12);
    await chooseCurrency('Valuation currency', 'GEL');
    await expect(browser.$('.mm-legend-total')).toHaveText('Total\n10.00 GEL');
    await expect(browser.$('.mm-native')).toHaveText(expect.stringContaining('5.00'));
    await click('button=Accounts');

    await browser.executeObsidian(async ({ app, obsidian }) => {
      const file = app.vault.getAbstractFileByPath('Money Manager/ACCOUNTS.md');
      if (!(file instanceof obsidian.TFile)) throw new Error('Missing account catalog');
      await app.vault.process(file, (text) => text.replace('name: Everyday', 'name: Pocket'));
    });
    await expect(browser.$('.mm-account h3')).toHaveText('Pocket');
    const page = browser.getObsidianPage();
    await page.disablePlugin('money-manager');
    await browser.waitUntil(async () => (await browser.$$('.money-manager').length) === 0);
    await page.enablePlugin('money-manager');
    await browser.executeObsidianCommand('money-manager:open-money-manager');
    await click('button=Accounts');
    await expect(browser.$('.mm-account h3')).toHaveText('Pocket');
    await expect(browser.$('.mm-account .mm-amount')).toHaveText('88.00 USD');
    expect(
      await browser.executeObsidian(
        ({ app }) => app.workspace.getLeavesOfType('money-manager').length,
      ),
    ).toBe(1);
  });
});

describe('independent leaves and pop-out lifecycle', () => {
  it('keeps separate navigation for two leaves sharing the same ledger', async () => {
    const state = await browser.executeObsidian(async ({ app }) => {
      const first = app.workspace.getLeavesOfType('money-manager')[0]!;
      const second = app.workspace.getLeaf('split');
      await first.setViewState({
        type: 'money-manager',
        active: true,
        state: { mode: 'settings' },
      });
      await second.setViewState({
        type: 'money-manager',
        active: true,
        state: {
          mode: 'overview',
          range: 'year',
          period: '2025-02',
          flow: 'income',
          currency: 'USD',
          accounts: ['everyday'],
        },
      });
      const result = { first: first.view.getState(), second: second.view.getState() };
      second.detach();
      return result;
    });
    expect(state.first).not.toEqual(state.second);
    expect(state.first.mode).toBe('settings');
    expect(state.second.mode).toBe('overview');
    expect(state.second).toMatchObject({
      period: '2025-02',
      range: 'year',
      flow: 'income',
      accounts: ['everyday'],
    });
  });
  it('mounts a desktop pop-out and cleans up its React tree', async function () {
    const mobile = await browser.executeObsidian(({ obsidian }) => obsidian.Platform.isMobile);
    if (mobile) this.skip();
    await browser.executeObsidian(async ({ app }) => {
      const leaf = app.workspace.openPopoutLeaf();
      await leaf.setViewState({ type: 'money-manager', active: true });
    });
    await browser.waitUntil(() =>
      browser.executeObsidian(({ app }) =>
        app.workspace
          .getLeavesOfType('money-manager')
          .some(
            (leaf) =>
              leaf.view.containerEl.ownerDocument !== document &&
              leaf.view.containerEl.querySelector('.mm-workspace') !== null,
          ),
      ),
    );
    const inPopout = await browser.executeObsidian(({ app }) => {
      const leaf = app.workspace
        .getLeavesOfType('money-manager')
        .find((candidate) => candidate.view.containerEl.ownerDocument !== document)!;
      const mounted = leaf.view.containerEl.querySelectorAll('.mm-workspace').length;
      leaf.detach();
      return mounted;
    });
    expect(inPopout).toBe(1);
  });
});
