Use `Button` for every clickable action; one `primary` per view.

```jsx
<Button variant="primary" size="md" iconLeft={<LucideIcon name="plus" />}>Add module</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="destructive" size="sm">Delete webhook</Button>
```

- **Physical press:** every variant except `ghost` carries a 4px hard offset shadow (`--shadow-hard`). Hover moves it 2px into the shadow, press moves the full 4px and the shadow disappears — the button bottoms out. This is the brand's signature interaction; never replace it with a scale or a glow.
- Labels are mono, 700, uppercase, .1em tracking. Keep them to two words.
- `loading` swaps the left icon for a spinner and blocks clicks; the label stays.
