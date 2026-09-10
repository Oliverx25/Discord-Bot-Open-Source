Single text input, optionally multiline. Label / hint / error are built in — don't wrap it in your own field markup.

```jsx
<Input label="Prefix" mono prefix="/" defaultValue="tobot" hint="Slash commands ignore this." />
<Input label="Webhook URL" error="That URL isn't a Discord webhook." />
<Input label="Welcome message" multiline rows={4} />
```
