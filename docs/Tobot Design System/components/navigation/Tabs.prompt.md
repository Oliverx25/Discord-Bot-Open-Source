Switches views inside one subject; never for top-level navigation (that's the sidebar).

```jsx
<Tabs value={tab} onChange={setTab} tabs={[{value:'settings',label:'Settings'},{value:'logs',label:'Logs',count:24}]} />
```
