import { vi, type Mock } from 'vitest';

export type MockPageRepo = {
  findById: Mock;
  findBySlug: Mock;
  findByCreatorId: Mock;
  save: Mock;
  delete: Mock;
  slugExists: Mock;
  findSectionById: Mock;
  saveSection: Mock;
  deleteSection: Mock;
  findPublishedBySlug: Mock;
  countByCreatorId: Mock;
};

export function createMockPageRepo(): MockPageRepo {
  return {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findByCreatorId: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    slugExists: vi.fn(),
    findSectionById: vi.fn(),
    saveSection: vi.fn(),
    deleteSection: vi.fn(),
    findPublishedBySlug: vi.fn(),
    countByCreatorId: vi.fn(),
  };
}
