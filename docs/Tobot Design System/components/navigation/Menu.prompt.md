Acciones de fila y menú de cuenta. Máximo 7 items; la acción destructiva va al final con `tone:'danger'`.

```jsx
<Menu align="right" trigger={<IconButton icon={<LucideIcon name="more-horizontal"/>} label="Acciones"/>}
  items={[{label:'Duplicar'},{separator:true},{label:'Eliminar',tone:'danger'}]} />
```
