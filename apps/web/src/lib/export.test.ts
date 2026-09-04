import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadCsv } from './export';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('downloadCsv', () => {
  it('should create a blob and trigger download', () => {
    const createObjectURL = vi.fn(() => 'blob:url');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    const click = vi.fn();
    const link = { href: '', download: '', click };
    document.createElement = vi.fn().mockReturnValue(link);

    downloadCsv('test.csv', ['Nombre', 'Edad'], [['Juan', '30'], ['Ana', '25']]);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(link.download).toBe('test.csv');
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:url');
  });

  it('should escape commas and quotes', () => {
    const createObjectURL = vi.fn(() => 'blob:url');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    const click = vi.fn();
    const link = { href: '', download: '', click };
    document.createElement = vi.fn().mockReturnValue(link);

    downloadCsv('test.csv', ['Name'], [['Smith, John'], ['He said "hello"']]);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(link.click).toHaveBeenCalledTimes(1);
  });
});
