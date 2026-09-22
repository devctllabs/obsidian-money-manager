# Value mixed Currencies with current Manual Rates

Status: Accepted
Date: 2026-09-12

Every Ledger Entry remains in its Account's immutable ISO 4217 Currency. One
Reference Currency and one current positive Manual Rate per other Currency make
cross-rates unambiguous. Native summaries are primary; a user explicitly selects
`All in <Currency>` before Money Manager derives a combined valuation using the
current table.

## Considered Options

- **Direct rates for every pair** would permit personal pair quotes but allow
  contradictory cycles and require many values for a small set of Currencies.
- **Historical rate tables or an Entry rate snapshot** would stabilize old
  converted reports but add data the user did not ask to maintain and could
  misleadingly resemble historical bank conversion.
- **A remote market-rate service** would remove manual updates but violate the
  local-only product boundary in
  [PDR-0004](./0004-keep-personal-finance-local-and-mobile.md) and still not
  reproduce the user's own valuation or bank charge.
- **Never combine Currencies** would preserve perfect native meaning but fail the
  required total across selected Accounts.

## Consequences

Changing a Manual Rate can change a Converted Total for any old Month or Year,
but never changes a Native Amount. Converted results are labeled **At current
manual rates**. Missing rates disable only the combined valuation and chart;
Money Manager names the missing values and never silently drops an Account.
