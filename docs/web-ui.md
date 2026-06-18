# Web UI

The home page lists the available calendar subscriptions and renders controls
from each integration's parameter metadata. Changes to the controls immediately
update the displayed calendar endpoint and subscription URL.

## Dynamic Multi-Selects

Dynamic multi-selects load their options after the field they depend on has a
value. For example, the Tomorrowland artist and stage lists load after selecting
a weekend.

The dropdown remains open while options are selected or deselected. Selected
values are displayed as removable chips; clicking anywhere on a chip removes
it. The current search text remains in place so several matching values can be
chosen in succession. Large selections are contained in a vertically scrollable
chip area so they do not expand the calendar card indefinitely.

Generated calendar endpoint URLs stay on one line and can be scrolled
horizontally when the selected filters make them wider than the available card.

The search field supports these keyboard controls:

- `Arrow Down` highlights the next matching option.
- `Arrow Up` highlights the previous matching option.
- Navigation wraps between the first and last matching options.
- `Enter` selects or deselects the highlighted option without closing the
  dropdown.
- `Tab` or clicking outside the field closes the dropdown.
