El tile de módulo. Pasa un `Switch` como `onToggle`; el stat es siempre mono y factual.

```jsx
<ModuleCard name="Auto-mod" description="Filtros y castigos escalonados." tier="pro" enabled
  icon={<LucideIcon name="shield-alert" />} stat="412 filtrados · 30d"
  onToggle={<Switch size="sm" checked />} onOpen={abrir} />

<ModuleCard layout="row" index={1} name="Auto-mod" … />
```

- `layout="card"` — placa física con sombra dura de 4px; al hover baja 2px, al pulsar toca fondo. Activo = pozo del icono relleno de ácido + borde ácido + `ON`.
- `layout="row"` — fila de lista con número de módulo; el estado apagado se hunde con un fondo más oscuro en vez de atenuar el texto.
- Las dos vistas son conmutables en la misma pantalla: la rejilla es la de por defecto, la lista es para quien administra varios servidores.
