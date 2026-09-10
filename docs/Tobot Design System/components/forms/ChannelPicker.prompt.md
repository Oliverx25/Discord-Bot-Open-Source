Selector de canales, roles o miembros. El sigilo (`#`, `@`) lo pone el componente: no lo metas en el label.

```jsx
<ChannelPicker label="Canales ignorados" kind="channel" value={v} onChange={setV}
  options={[{value:'1',label:'mod-chat'},{value:'2',label:'staff',meta:'privado'}]} />
```
