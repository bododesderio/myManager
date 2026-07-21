import { ContactService } from './contact.service';

/** Regression test for the /admin/leads 500: an omitted `page` reached Prisma as
 *  NaN → `skip: NaN` → PrismaClientValidationError. listLeads must coerce to a
 *  valid Int regardless of how the caller passes page/limit. */
function makeService() {
  const findMany = jest.fn().mockResolvedValue([]);
  const count = jest.fn().mockResolvedValue(0);
  const prisma = { contactLead: { findMany, count } } as any;
  return { service: new ContactService(prisma), findMany, count };
}

describe('ContactService.listLeads pagination coercion', () => {
  it('defaults NaN page/limit to valid Ints (the dashboard\'s no-page call)', async () => {
    const { service, findMany } = makeService();

    const res = await service.listLeads(NaN, 5);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 5 }),
    );
    expect(res.page).toBe(1);
    expect(res.limit).toBe(5);
  });

  it('computes skip from a valid page', async () => {
    const { service, findMany } = makeService();

    await service.listLeads(3, 10);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 10 }));
  });

  it('rejects non-positive / non-finite values back to defaults', async () => {
    const { service, findMany } = makeService();

    await service.listLeads(0, -4);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
  });
});
