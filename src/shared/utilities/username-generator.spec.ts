import {
  buildUsername,
  generateUniqueUsername,
} from './username-generator';

describe('username-generator', () => {
  describe('buildUsername', () => {
    it('should normalize and join firstname and lastname', () => {
      expect(buildUsername('Jean', 'Dupont')).toBe('jean.dupont');
      expect(buildUsername('Élodie', 'Müller')).toBe('elodie.muller');
      expect(buildUsername('Jean-Paul', 'De La Cruz')).toBe('jeanpaul.delacruz');
      expect(buildUsername('  Jean  ', '  Dupont  ')).toBe('jean.dupont');
    });
  });

  describe('generateUniqueUsername', () => {
    it('should return base username when available', async () => {
      const result = await generateUniqueUsername('Jean', 'Dupont', async () => false);
      expect(result).toBe('jean.dupont');
    });

    it('should add numeric suffix when base username exists', async () => {
      const existing = new Set(['jean.dupont', 'jean.dupont2']);
      const result = await generateUniqueUsername(
        'Jean',
        'Dupont',
        async (username) => existing.has(username),
      );
      expect(result).toBe('jean.dupont3');
    });
  });
});
