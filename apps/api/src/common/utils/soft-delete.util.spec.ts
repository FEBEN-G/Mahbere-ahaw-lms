import { withNotDeleted } from './soft-delete.util';

describe('withNotDeleted', () => {
  it('adds deletedAt null by default', () => {
    expect(withNotDeleted({ id: '1' })).toEqual({ id: '1', deletedAt: null });
  });

  it('skips filter when includeDeleted is true', () => {
    expect(withNotDeleted({ id: '1' }, true)).toEqual({ id: '1' });
  });
});
