Container for a single subject: one module's settings, one stat, one pricing tier.

```jsx
<Card title="Action logs" subtitle="12 events routed" actions={<Switch checked />}>
  <p>Routing to #mod-log via webhook.</p>
</Card>
```

Tones: `default` (dashboard), `raised` (floating/overlay context), `accent` (the recommended tier or an active module), `inset` (code/log wells). `interactive` adds a 1px lift on hover — only for cards that are whole click targets.
