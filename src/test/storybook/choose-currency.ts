import { userEvent, within } from 'storybook/test';
export async function chooseCurrency(canvasElement: HTMLElement, label: string, code: string) {
  await userEvent.click(within(canvasElement).getByRole('button', { name: label }));
  const dialog = within(
    within(canvasElement.ownerDocument.body).getByRole('dialog', { name: 'Choose currency' }),
  );
  await userEvent.type(dialog.getByRole('combobox'), code);
  await userEvent.keyboard('{Enter}');
}
