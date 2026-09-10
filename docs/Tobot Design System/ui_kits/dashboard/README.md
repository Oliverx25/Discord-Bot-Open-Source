# UI kit — Product dashboard

Dark, dense, keyboard-friendly. Same tokens as the landing page, different rhythm: `--dash-pad` 20px, 12px grid gaps, 14px base text, h2 as the largest type on screen.

## Screens (click-through in `index.html`)
1. **Modules** (`ModulesView.jsx`) — the home screen. `ModuleCard` grid with live `Switch` toggles; toggling fires a `Toast`. Segmented tabs filter All / Enabled / Pro. Click Auto-mod to go deeper.
2. **Auto-mod detail** (`ModuleDetail.jsx`) — tabs, filter checkboxes, punishment radio group, scope tags, stat panel, "copy to your other servers" accent card, danger zone with a confirm `Dialog`.
3. **Action logs** (`LogsView.jsx`) — mono table, severity carried by the event name's color, per-row open action, range segmented tabs.
4. **Plan & billing** (`BillingView.jsx`) — the differentiator made literal: one price, a list of every covered server, "Add another server — still $6".

Chrome (`Chrome.jsx`): 56px server rail, 248px sidebar with overline-grouped `NavItem`s and a Pro footer card, 56px topbar with crumb + latency chip.

## Intentional differences from the landing page
- No display type, no 96px sections, no full-bleed statements.
- Ember is rationed harder: active nav item, enabled module border, one primary button per screen.
- Numbers are always mono; prose is short and never sells.
- Light mode is supported by the tokens; set `data-theme="light"` on `<html>`.
