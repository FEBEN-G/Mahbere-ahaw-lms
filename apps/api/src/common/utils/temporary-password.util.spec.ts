import { generateTemporaryPassword } from './temporary-password.util';

describe('generateTemporaryPassword', () => {
  it('returns the requested length', () => {
    expect(generateTemporaryPassword(16)).toHaveLength(16);
  });

  it('returns unique values across calls', () => {
    const first = generateTemporaryPassword();
    const second = generateTemporaryPassword();
    expect(first).not.toEqual(second);
  });
});
