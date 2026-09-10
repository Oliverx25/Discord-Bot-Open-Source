Mensaje persistente dentro de una card o formulario. Si desaparece solo, es un `Toast`, no un `Alert`.

```jsx
<Alert tone="warning" title="Falta el permiso Manage Roles" action={<Button size="sm" variant="secondary">Revisar permisos</Button>}>
  Los autoroles no se aplicarán hasta que Tobot pueda gestionar roles.
</Alert>
```
