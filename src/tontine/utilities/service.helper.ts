import { Tontine } from '../entities/tontine.entity';

export function isMemberOfTontine(tontine: Tontine, username: string): boolean {
  return !!tontine?.members?.find((m) => m.user.username === username);
}
