Tarjeta de plan. Las features excluidas se marcan con `{included:false}` y salen con guion, nunca con una cruz roja.

```jsx
<PricingTier name="Pro" price="$6" featured badge={<Badge tone="pro">Todos los servidores</Badge>}
  features={['Los 18 módulos','Retención 90 días',{label:'Casino',included:true}]} cta={<Button fullWidth>Pasar a Pro</Button>} />
```
