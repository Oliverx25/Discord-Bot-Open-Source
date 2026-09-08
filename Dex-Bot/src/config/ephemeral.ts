/**
 * Preferencia ephemeral por interaction.id (set opcional; leída por handlers).
 */
const ephemeralByInteraction = new Map<string, boolean>();

export function setInteractionEphemeral(
  interactionId: string,
  ephemeral: boolean,
): void {
  ephemeralByInteraction.set(interactionId, ephemeral);
}

export function consumeInteractionEphemeral(
  interactionId: string,
  fallback = true,
): boolean {
  const value = ephemeralByInteraction.get(interactionId);
  ephemeralByInteraction.delete(interactionId);
  return value ?? fallback;
}
