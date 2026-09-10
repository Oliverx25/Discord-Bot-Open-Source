Data chip, not a status. 4px radius keeps it visually distinct from `Badge` pills.

```jsx
<Tag mono icon={<LucideIcon name="hash" />} onRemove={() => {}}>mod-log</Tag>
<Tag selected onClick={() => {}}>Economy</Tag>
```

Use `mono` for anything the user typed or Discord owns (channel names, role IDs, commands).
