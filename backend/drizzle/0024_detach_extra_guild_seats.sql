-- Una suscripción Stripe cubre un solo guild. Si había asientos extra,
-- se queda el assigned_at más antiguo; el resto vuelve a free.
-- Idempotente: si ya es 1:1, el UPDATE no toca filas.
WITH ranked AS (
  SELECT
    guild_id,
    ROW_NUMBER() OVER (
      PARTITION BY subscription_id
      ORDER BY assigned_at ASC, guild_id ASC
    ) AS rn
  FROM guild_entitlements
  WHERE subscription_id IS NOT NULL
)
UPDATE guild_entitlements AS g
SET
  subscription_id = NULL,
  tier = 'free'
FROM ranked
WHERE g.guild_id = ranked.guild_id
  AND ranked.rn > 1;
