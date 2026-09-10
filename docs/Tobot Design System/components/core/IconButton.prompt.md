Icon-only action, 28/34/40px square, used in dashboard toolbars and row actions.

```jsx
<IconButton icon={<LucideIcon name="pencil" />} label="Edit embed" />
<IconButton icon={<LucideIcon name="trash-2" />} label="Delete" variant="outline" />
```

`label` becomes both `aria-label` and the native tooltip. Never use it as the only affordance for a destructive action without a confirm Dialog.
