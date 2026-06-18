# Web UI

The home page lists the available calendar subscriptions and renders controls
from each integration's parameter metadata. Changes to the controls immediately
update the displayed calendar endpoint and subscription URL.

Integrations can provide optional helper text with the top-level `description`
field. The home page displays it between the subscription URL and parameter
controls. Descriptions are escaped before rendering.

## Dynamic Multi-Selects

Dynamic multi-selects load their options after the field they depend on has a
value. For example, the Tomorrowland artist and stage lists load after selecting
a weekend.

The `+` button opens the dropdown and focuses its search field. The search field
stays fixed at the top while the options scroll beneath it. Selecting or
deselecting an option clears the current search term, restores the full options
list, and keeps the toggled option highlighted at the same viewport position.

Selected values are displayed as non-wrapping removable chips in a single row;
clicking anywhere on a chip removes it. Overflowing selections scroll
horizontally, the dropdown options scroll vertically, and both keep their
scrollbar indicators hidden while still supporting wheel and touch scrolling.

Generated calendar endpoint URLs stay on one line and can be scrolled
horizontally when the selected filters make them wider than the available card.
The Copy button copies the current filtered calendar URL with the page's `http:`
or `https:` scheme for clients that do not recognize `webcal:` links. The
Subscribe button continues to use `webcal:`.

The search field supports these keyboard controls:

- `Arrow Down` highlights the next matching option.
- `Arrow Up` highlights the previous matching option.
- Navigation wraps between the first and last matching options.
- `Enter` selects or deselects the highlighted option without closing the
  dropdown.
- `Tab` or clicking outside the field closes the dropdown.
