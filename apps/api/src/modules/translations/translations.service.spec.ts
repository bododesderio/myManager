import { TranslationsService } from './translations.service';

/**
 * Regression tests for /admin/translations. Translation rows are stored one per
 * (locale, namespace, key); the admin UI works in key-groups pivoted by locale
 * and PATCHes back by an opaque id. These pin the grouping, the language
 * summary, and — critically — that the id round-trips so a value saved for the
 * key it was listed under lands on the right row.
 */
describe('TranslationsService', () => {
  function createService(model: Record<string, jest.Mock> = {}) {
    const translation = {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({}),
      ...model,
    };
    const prisma = { translation } as any;
    return { service: new TranslationsService(prisma), translation };
  }

  it('groups per-locale rows into key-groups pivoted by locale', async () => {
    const { service } = createService({
      findMany: jest.fn().mockResolvedValue([
        { locale: 'en', namespace: 'common', key: 'greeting', value: 'Hello' },
        { locale: 'fr', namespace: 'common', key: 'greeting', value: 'Bonjour' },
        { locale: 'en', namespace: 'common', key: 'bye', value: 'Bye' },
      ]),
    });

    const { items } = await service.list();

    expect(items).toHaveLength(2);
    const greeting = items.find((i) => i.key === 'common.greeting')!;
    expect(greeting.values).toEqual({ en: 'Hello', fr: 'Bonjour' });
  });

  it('reports per-language progress against the total key count', async () => {
    const { service } = createService({
      findMany: jest.fn().mockResolvedValue([
        { locale: 'en', namespace: 'common', key: 'a', value: 'A' },
        { locale: 'en', namespace: 'common', key: 'b', value: 'B' },
        { locale: 'fr', namespace: 'common', key: 'a', value: 'Fr-A' },
      ]),
    });

    const { languages } = await service.list();
    const en = languages.find((l) => l.code === 'en')!;
    const fr = languages.find((l) => l.code === 'fr')!;

    expect(en.keyCount).toBe(2);
    expect(en.progress).toBe(100); // 2 of 2 keys translated
    expect(fr.keyCount).toBe(1);
    expect(fr.progress).toBe(50); // 1 of 2 keys
  });

  it('round-trips the group id: a value saved by the listed id upserts the right (locale, namespace, key)', async () => {
    const { service, translation } = createService({
      findMany: jest.fn().mockResolvedValue([
        { locale: 'en', namespace: 'emails', key: 'welcome.subject', value: 'Welcome' },
      ]),
    });

    const { items } = await service.list();
    const id = items[0].id; // opaque, encodes namespace + key

    await service.update(id, 'fr', 'Bienvenue');

    expect(translation.upsert).toHaveBeenCalledWith({
      where: { locale_namespace_key: { locale: 'fr', namespace: 'emails', key: 'welcome.subject' } },
      update: { value: 'Bienvenue' },
      create: { locale: 'fr', namespace: 'emails', key: 'welcome.subject', value: 'Bienvenue' },
    });
  });
});
