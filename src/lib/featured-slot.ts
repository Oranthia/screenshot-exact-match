import type { BadgeState } from "./badges";

export function validateFeaturedSlot(position: number, id: string | null, state: BadgeState) {
  if (!Number.isInteger(position) || position < 1 || position > 3) throw new Error("Posizione non valida.");
  if (id !== null && !state.earned.some(b => b.badge_id === id)) throw new Error("Conquista non ottenuta.");
}