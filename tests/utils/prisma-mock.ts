import { mock } from "bun:test";

export interface MockUserEntity {
  id: bigint;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  name: string | null;
  role: "USER" | "ADMIN";
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const mockUser: MockUserEntity = {
  id: BigInt(1),
  email: "test@example.com",
  passwordHash: "$2b$10$hashedpassword",
  googleId: null,
  name: null,
  role: "USER",
  lastLoginAt: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

export type MockUser = MockUserEntity | null;

export const mockFindFirst = mock<() => Promise<MockUser>>();
export const mockFindUnique = mock<() => Promise<MockUser>>();
export const mockCreate = mock<() => Promise<MockUserEntity>>();
export const mockUpdate = mock<() => Promise<MockUserEntity>>();
export const mockUpdateMany = mock<() => Promise<{ count: number }>>();
export const mockQueryRaw =
  mock<() => Promise<Array<Record<string, number>>>>();

// NOTE: one place to keep the default async return values so declarations
// and `resetPrismaMocks` can't drift out of sync. `mockReset()` clears the
// impl, which would leave the mock returning `undefined` and silently break
// any test that relied on the default.
function applyDefaultPrismaMockImplementations() {
  mockFindFirst.mockImplementation(() => Promise.resolve(null as MockUser));
  mockFindUnique.mockImplementation(() => Promise.resolve(null as MockUser));
  mockCreate.mockImplementation(() => Promise.resolve(mockUser));
  mockUpdate.mockImplementation(() => Promise.resolve(mockUser));
  mockUpdateMany.mockImplementation(() => Promise.resolve({ count: 1 }));
  mockQueryRaw.mockImplementation(() => Promise.resolve([{ 1: 1 }]));
}

applyDefaultPrismaMockImplementations();

export const prismaMock = {
  user: {
    findFirst: mockFindFirst,
    findUnique: mockFindUnique,
    create: mockCreate,
    update: mockUpdate,
    updateMany: mockUpdateMany,
  },
  $queryRaw: mockQueryRaw,
};

export function setupPrismaMock() {
  mock.module("@/api/lib/prisma", () => ({
    default: prismaMock,
  }));
}

export function resetPrismaMocks() {
  mockFindFirst.mockReset();
  mockFindUnique.mockReset();
  mockCreate.mockReset();
  mockUpdate.mockReset();
  mockUpdateMany.mockReset();
  mockQueryRaw.mockReset();
  applyDefaultPrismaMockImplementations();
}
