import { fetchStatus, testConnection } from '../../services/esp32';

global.fetch = jest.fn();

describe('esp32 service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchStatus returns parsed JSON on a 200 response', async () => {
    const mockData = { connected: true };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData
    });

    const result = await fetchStatus();
    expect(result).toEqual(mockData);
  });

  it('fetchStatus throws on a non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(fetchStatus()).rejects.toThrow('HTTP 500');
  });

  it('testConnection returns true on a 200 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200
    });

    const result = await testConnection();
    expect(result).toBe(true);
  });

  it('testConnection returns false when fetch rejects', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const result = await testConnection();
    expect(result).toBe(false);
  });
});
