# Period reporting and valuation

Overview projects Expenses or Income for one calendar Month or Year and a selected set of Accounts.
It opens on the current Month with all Accounts and Expenses selected. Each open Money Manager leaf
keeps its own period, Account selection, flow, and Currency view while all leaves share the same
financial index.

## Period Reports

Native summaries keep Spent and Received separate for every Currency in the selection. Expense and
Income are independent analytical flows. The selected flow and Currency determine one category
donut with an exact total, amount and percentage for every Category, and a six-row paginated legend;
pagination never removes Categories from the chart or total. Text labels remain authoritative when
color is unavailable.

Year view adds twelve monthly values, including zero months, and expandable newest-first Month
groups for Months containing an Expense or Income. Expanded groups reuse the Entry list and include
same-Month Checkpoints. Checkpoints never contribute to Spent, Received, category shares, or monthly
bars. Reports with invalid monetary input are explicitly incomplete rather than reliable zeros.

## Manual Rates and Converted Totals

One Reference Currency and current positive Manual Rates define user-controlled valuation. A rate
states how many units of the Reference Currency equal one unit of its source Currency. Rates have no
historical effective date, so changing a rate can change old Converted Totals without changing any
Native Amount.

Changing the Reference Currency requires a complete valid table and a reviewed rebase proposal.
Rebased rates use half-up rounding to 18 decimal places; a positive result that would round to zero
is rejected. Ordinary rate edits retain their authored decimal precision.

Combined valuation appears only after the user selects **All in _Currency_** and is labelled
**At current manual rates**. Conversion uses exact rational arithmetic over native subtotals and
rounds once to the target Currency's minor unit. Every missing source or target rate is named;
missing rates disable only the combined total and chart, while native summaries and balances remain
available. These semantics implement
[PDR-0003](./decisions/0003-value-currencies-at-current-manual-rates.md).

