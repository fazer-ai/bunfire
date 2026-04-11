import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import config from "@/config";
import {
  mockCreate,
  mockFindFirst,
  mockUser,
  resetPrismaMocks,
  setupPrismaMock,
} from "@/tests/utils/prisma-mock";

setupPrismaMock();

const {
  getUserByEmail,
  createUser,
  hashPassword,
  verifyPassword,
  isEmailDomainAllowed,
  getSignupRoleForEmail,
} = await import("@/api/features/auth/auth.service");

describe("auth.service", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  describe("getUserByEmail", () => {
    test("returns user when found", async () => {
      mockFindFirst.mockResolvedValueOnce(mockUser);

      const result = await getUserByEmail("test@example.com");

      expect(result).toEqual(mockUser);
      expect(mockFindFirst).toHaveBeenCalledTimes(1);
    });

    test("returns null when user not found", async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      const result = await getUserByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });

    test("trims and searches case-insensitively", async () => {
      mockFindFirst.mockResolvedValueOnce(mockUser);

      await getUserByEmail("  TEST@EXAMPLE.COM  ");

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { email: { equals: "TEST@EXAMPLE.COM", mode: "insensitive" } },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordHash: true,
          googleId: true,
        },
      });
    });
  });

  describe("createUser", () => {
    test("creates user with trimmed lowercase email and USER role by default", async () => {
      const createdUser = { ...mockUser, email: "new@example.com" };
      mockCreate.mockResolvedValueOnce(createdUser);

      const result = await createUser("  NEW@EXAMPLE.COM  ", "hashedPassword");

      expect(result).toEqual(createdUser);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            email: "new@example.com",
            passwordHash: "hashedPassword",
            role: "USER",
          },
        }),
      );
    });

    test("never grants ADMIN on password signup even when domain matches", async () => {
      const original = [...config.adminSignupDomains];
      config.adminSignupDomains = ["mycompany.io"];
      try {
        mockCreate.mockResolvedValueOnce(mockUser);
        await createUser("founder@mycompany.io", "hashedPassword");
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: {
              email: "founder@mycompany.io",
              passwordHash: "hashedPassword",
              role: "USER",
            },
          }),
        );
      } finally {
        config.adminSignupDomains = original;
      }
    });

    test("requests sanitized projection without passwordHash", async () => {
      mockCreate.mockResolvedValueOnce(mockUser);
      await createUser("test@example.com", "hashedPassword");
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { id: true, email: true, name: true, role: true },
        }),
      );
    });
  });

  describe("getSignupRoleForEmail", () => {
    const originalAdmin = [...config.adminSignupDomains];

    beforeEach(() => {
      config.adminSignupDomains = [...originalAdmin];
    });

    afterEach(() => {
      config.adminSignupDomains = [...originalAdmin];
    });

    test("returns USER when adminSignupDomains is empty", () => {
      config.adminSignupDomains = [];
      expect(getSignupRoleForEmail("anyone@anywhere.com", true)).toBe("USER");
    });

    test("returns ADMIN when domain matches and email is verified", () => {
      config.adminSignupDomains = ["mycompany.io"];
      expect(getSignupRoleForEmail("founder@mycompany.io", true)).toBe("ADMIN");
    });

    test("never returns ADMIN when email is not verified", () => {
      config.adminSignupDomains = ["mycompany.io"];
      expect(getSignupRoleForEmail("founder@mycompany.io", false)).toBe("USER");
    });

    test("returns USER when domain does not match", () => {
      config.adminSignupDomains = ["mycompany.io"];
      expect(getSignupRoleForEmail("user@other.com", true)).toBe("USER");
    });

    test("matches case-insensitively", () => {
      config.adminSignupDomains = ["mycompany.io"];
      expect(getSignupRoleForEmail("Founder@MyCompany.IO", true)).toBe("ADMIN");
    });
  });

  describe("hashPassword", () => {
    test("hashes a password using bcrypt", async () => {
      const password = "securePassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]?\$/);
    });

    test("produces different hashes for the same password (salt)", async () => {
      const password = "securePassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("isEmailDomainAllowed", () => {
    const originalAllowed = [...config.allowedSignupDomains];

    beforeEach(() => {
      config.allowedSignupDomains = [...originalAllowed];
    });

    afterEach(() => {
      config.allowedSignupDomains = [...originalAllowed];
    });

    test("allows any domain when allowlist is empty", () => {
      config.allowedSignupDomains = [];
      expect(isEmailDomainAllowed("user@anything.com")).toBe(true);
      expect(isEmailDomainAllowed("user@example.io")).toBe(true);
    });

    test("allows only listed domains when allowlist is set", () => {
      config.allowedSignupDomains = ["example.com", "acme.io"];
      expect(isEmailDomainAllowed("user@example.com")).toBe(true);
      expect(isEmailDomainAllowed("user@acme.io")).toBe(true);
      expect(isEmailDomainAllowed("user@other.com")).toBe(false);
    });

    test("matches case-insensitively and trims input", () => {
      config.allowedSignupDomains = ["example.com"];
      expect(isEmailDomainAllowed("  User@EXAMPLE.COM  ")).toBe(true);
    });

    test("rejects malformed emails when allowlist is set", () => {
      config.allowedSignupDomains = ["example.com"];
      expect(isEmailDomainAllowed("not-an-email")).toBe(false);
    });
  });

  describe("verifyPassword", () => {
    test("returns true for matching password and hash", async () => {
      const password = "securePassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    test("returns false for non-matching password", async () => {
      const password = "securePassword123";
      const wrongPassword = "wrongPassword456";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    test("returns false for empty password", async () => {
      const password = "securePassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword("", hash);

      expect(isValid).toBe(false);
    });
  });
});
