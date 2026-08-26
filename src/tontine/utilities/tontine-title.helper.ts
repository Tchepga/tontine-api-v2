import { Tontine } from '../entities/tontine.entity';

export function normalizeTontineTitle(title: string): string {
  return title.trim().toLowerCase();
}

export function hasDuplicateTontineTitle(
  tontines: Tontine[],
  title: string,
  memberIds: number[],
  excludeTontineId?: number,
): boolean {
  const normalized = normalizeTontineTitle(title);
  if (!normalized || memberIds.length === 0) {
    return false;
  }

  return (tontines ?? []).some((tontine) => {
    if (excludeTontineId != null && tontine.id === excludeTontineId) {
      return false;
    }
    if (normalizeTontineTitle(tontine.title) !== normalized) {
      return false;
    }
    return tontine.members?.some((member) => memberIds.includes(member.id));
  });
}
