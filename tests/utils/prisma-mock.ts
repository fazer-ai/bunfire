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

export const mockFindFirst = mock(() => Promise.resolve(null as MockUser));
export const mockFindUnique = mock(() => Promise.resolve(null as MockUser));
export const mockCreate = mock(() => Promise.resolve(mockUser));
export const mockUpdate = mock(() => Promise.resolve(mockUser));
export const mockQueryRaw = mock(() => Promise.resolve([{ 1: 1 }]));

export const prismaMock = {
  user: {
    findFirst: mockFindFirst,
    findUnique: mockFindUnique,
    create: mockCreate,
    update: mockUpdate,
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
  mockQueryRaw.mockReset();
}
