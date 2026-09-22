import { mkdir } from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= `${process.cwd()}/.cache/playwright`;
const { chromium } = await import('playwright');
await mkdir('.impeccable/review', { recursive: true });
const browser = await chromium.launch({ headless: true });
const cases = process.argv.includes('--settings')
  ? [
      ['settings-final', 'features-shell-money-manager--settings', 1000, 'light', 'leaf'],
      ['settings-final-mobile', 'features-shell-money-manager--settings', 390, 'dark', 'mobile'],
      ['settings-catalog', 'features-shell-money-manager--settings', 780, 'light', 'leaf'],
      ['settings-catalog-mobile', 'features-shell-money-manager--settings', 390, 'dark', 'mobile'],
      ['settings-rates', 'features-shell-money-manager--settings', 780, 'light', 'leaf'],
      ['settings-rates-mobile', 'features-shell-money-manager--settings', 390, 'dark', 'mobile'],
      ['settings-workspace', 'features-shell-money-manager--settings', 780, 'light', 'leaf'],
      [
        'settings-workspace-create',
        'features-shell-money-manager--settings',
        390,
        'dark',
        'mobile',
      ],
    ]
  : process.argv.includes('--dialogs')
    ? [
        ['dialogs-edit', 'features-shell-money-manager--loaded', 1000, 'light', 'leaf'],
        ['dialogs-delete', 'features-shell-money-manager--loaded', 390, 'dark', 'mobile'],
        ['dialogs-reconcile', 'features-shell-money-manager--accounts', 390, 'light', 'mobile'],
        ['dialogs-history', 'features-shell-money-manager--accounts', 1000, 'dark', 'leaf'],
        ['dialogs-settings', 'features-shell-money-manager--settings', 1000, 'light', 'leaf'],
        [
          'dialogs-settings-mobile',
          'features-shell-money-manager--settings',
          390,
          'dark',
          'mobile',
        ],
        ['dialogs-categories', 'features-shell-money-manager--loaded', 390, 'dark', 'mobile'],
      ]
    : process.argv.includes('--redesign')
      ? [
          ['redesign-desktop', 'features-shell-money-manager--loaded', 1280, 'light', 'leaf'],
          ['redesign-mobile', 'features-shell-money-manager--loaded', 390, 'dark', 'mobile'],
          ['redesign-menu', 'features-shell-money-manager--loaded', 1000, 'light', 'leaf'],
          ['redesign-currency', 'features-shell-money-manager--loaded', 390, 'dark', 'mobile'],
          ['redesign-accounts', 'features-shell-money-manager--loaded', 780, 'light', 'leaf'],
          ['redesign-colors', 'features-shell-money-manager--settings', 780, 'light', 'leaf'],
          [
            'redesign-categories',
            'features-overview-views-reportoverview--many-categories',
            1280,
            'light',
            'leaf',
          ],
        ]
      : process.argv.includes('--shell')
        ? [
            ['shell-desktop', 'features-shell-money-manager--loaded', 1280, 'light', 'leaf'],
            ['shell-mobile', 'features-shell-money-manager--loaded', 390, 'dark', 'mobile'],
            ['shell-settings', 'features-shell-money-manager--settings', 780, 'light', 'leaf'],
          ]
        : [
            [
              'overview-desktop-light',
              'features-overview-views-reportoverview--loaded-native',
              1280,
              'light',
              'leaf',
            ],
            [
              'overview-desktop-dark',
              'features-overview-views-reportoverview--loaded-converted',
              1280,
              'dark',
              'leaf',
            ],
            [
              'overview-mobile-light',
              'features-overview-views-reportoverview--loaded-native',
              390,
              'light',
              'mobile',
            ],
            [
              'overview-mobile-dark',
              'features-overview-views-reportoverview--year',
              390,
              'dark',
              'mobile',
            ],
            [
              'accounts-mobile',
              'features-accounts-views-accountoverview--converted',
              390,
              'light',
              'mobile',
            ],
            ['entry-mobile', 'features-ledger-modals-entryform--edit', 390, 'dark', 'mobile'],
            [
              'rates-mobile',
              'features-settings-settings-rateeditor--rates-loaded',
              390,
              'light',
              'mobile',
            ],
            [
              'high-zoom',
              'features-overview-views-reportoverview--loaded-native',
              780,
              'light',
              'leaf',
            ],
            [
              'forced-colors',
              'features-overview-views-reportoverview--loaded-native',
              390,
              'light',
              'mobile',
            ],
            [
              'many-categories',
              'features-overview-views-reportoverview--many-categories',
              1280,
              'light',
              'leaf',
            ],
          ];
for (const [name, story, width, theme, frame] of cases) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(
    `${process.argv[2] ?? 'http://localhost:6006'}/iframe.html?id=${story}&viewMode=story&globals=theme:${theme};frame:${frame}`,
    { waitUntil: 'networkidle' },
  );
  await page.locator('.money-manager').waitFor();
  if (name.startsWith('settings-catalog')) {
    await page.locator('summary').filter({ hasText: 'Categories' }).click();
    await page.getByRole('searchbox', { name: 'Find or add expense category' }).fill('Groceries');
    await page.getByRole('button', { name: 'Edit Groceries' }).click();
  }
  if (name.startsWith('settings-rates'))
    await page.locator('summary').filter({ hasText: 'Manual rates' }).click();
  if (name.startsWith('settings-workspace'))
    await page.getByRole('button', { name: 'Choose workspace folder' }).click();
  if (name === 'settings-workspace-create')
    await page.getByLabel('Folder name', { exact: true }).fill('Travel ledger');
  if (['dialogs-edit', 'dialogs-delete', 'dialogs-categories'].includes(name)) {
    await page
      .getByRole('button', { name: /More actions for/ })
      .first()
      .click();
    await page
      .getByRole('menuitem', { name: name === 'dialogs-delete' ? 'Delete entry…' : 'Edit entry…' })
      .click();
    if (name === 'dialogs-categories')
      await page.getByRole('button', { name: 'Category', exact: true }).click();
  }
  if (name === 'dialogs-reconcile') {
    await page
      .getByRole('button', { name: /More actions for/ })
      .first()
      .click();
    await page.getByRole('menuitem', { name: 'Reconcile balance…' }).click();
  }
  if (name === 'dialogs-history')
    await page.locator('.mm-balance-history > summary').first().click();
  if (name === 'redesign-menu')
    await page
      .getByRole('button', { name: /More actions for/ })
      .first()
      .click();
  if (name === 'redesign-currency') {
    await page.getByRole('button', { name: 'Valuation currency' }).click();
    await page.getByRole('combobox').fill('dollar');
  }
  if (name === 'redesign-accounts')
    await page.getByRole('button', { name: 'Accounts: All' }).click();
  if (name === 'redesign-colors')
    await page.getByRole('button', { name: 'Accent color', exact: true }).click();
  if (name === 'high-zoom')
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
  if (name === 'forced-colors')
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.screenshot({ path: `.impeccable/review/${name}-viewport.png` });
  await page.screenshot({ path: `.impeccable/review/${name}.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  console.log(`${name}: horizontal overflow=${overflow}`);
  await page.close();
}
await browser.close();
