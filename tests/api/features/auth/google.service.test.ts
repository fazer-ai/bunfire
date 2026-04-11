import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  mockCreate,
  mockFindFirst,
  mockFindUnique,
  mockUpdate,
  mockUser,
  resetPrismaMocks,
  setupPrismaMock,
} from "@/tests/utils/prisma-mock";

setupPrismaMock();

const mockJwtVerify = mock(() => Promise.resolve({ payload: {} as unknown }));

mock.module("jose", () => ({
  createRemoteJWKSet: () => null,
  jwtVerify: mockJwtVerify,
}));

const { verifyGoogleIdToken, upsertGoogleUser, GoogleEmailNotVerifiedError } =
  await import("@/api/features/auth/google.service");

describe("google.service", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockJwtVerify.mockReset();
  });

  describe("verifyGoogleIdToken", () => {
    test("returns normalized profile from valid JWT payload", async () => {
      mockJwtVerify.mockResolvedValueOnce({
        payload: {
          sub: "google-sub-123",
          email: "user@example.com",
          email_verified: true,
          name: "Jane Doe",
        },
      });

      const profile = await verifyGoogleIdToken("header.payload.sig");

      expect(profile).toEqual({
        sub: "google-sub-123",
        email: "user@example.com",
        emailVerified: true,
        name: "Jane Doe",
      });
    });

    test("emailVerified is false when claim is missing", async () => {
      mockJwtVerify.mockResolvedValueOnce({
        payload: {
          sub: "sub",
          email: "user@example.com",
        },
      });

      const profile = await verifyGoogleIdToken("credential");
      expect(profile.emailVerified).toBe(false);
    });

    test("throws when sub is missing", async () => {
      mockJwtVerify.mockResolvedValueOnce({
        payload: { email: "user@example.com", email_verified: true },
      });

      await expect(verifyGoogleIdToken("credential")).rejects.toThrow(
        /missing required claims/,
      );
    });

    test("propagates errors from jwtVerify", async () => {
      mockJwtVerify.mockRejectedValueOnce(new Error("signature failed"));

      await expect(verifyGoogleIdToken("bad")).rejects.toThrow(
        /signature failed/,
      );
    });
  });

  describe("upsertGoogleUser", () => {
    const baseProfile = {
      sub: "google-sub-123",
      email: "user@example.com",
      emailVerified: true,
      name: "Jane Doe",
    };

    test("returns existing user when googleId matches", async () => {
      const existing = { ...mockUser, googleId: "google-sub-123" };
      mockFindUnique.mockResolvedValueOnce(existing);

      const result = await upsertGoogleUser(baseProfile);

      expect(result).toEqual(existing);
      expect(mockFindFirst).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    test("links googleId to existing user when email matches and is verified", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      mockFindFirst.mockResolvedValueOnce({ ...mockUser });
      mockUpdate.mockResolvedValueOnce({
        ...mockUser,
        googleId: "google-sub-123",
      });

      const result = await upsertGoogleUser(baseProfile);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: { googleId: "google-sub-123" },
        }),
      );
      expect(result.id).toBe(mockUser.id);
    });

    test("rejects linking when email is not verified", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      mockFindFirst.mockResolvedValueOnce({ ...mockUser });

      await expect(
        upsertGoogleUser({ ...baseProfile, emailVerified: false }),
      ).rejects.toBeInstanceOf(GoogleEmailNotVerifiedError);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    test("creates new user when no existing account matches", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      mockFindFirst.mockResolvedValueOnce(null);
      mockCreate.mockResolvedValueOnce({
        ...mockUser,
        email: "user@example.com",
        googleId: "google-sub-123",
        name: "Jane Doe",
      });

      const result = await upsertGoogleUser(baseProfile);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            email: "user@example.com",
            googleId: "google-sub-123",
            name: "Jane Doe",
            role: "USER",
          },
        }),
      );
      expect(result.email).toBe("user@example.com");
    });

    test("creates new Google user with ADMIN role when domain matches", async () => {
      const config = (await import("@/config")).default;
      const original = config.adminSignupDomains;
      config.adminSignupDomains = ["mycompany.io"];
      try {
        mockFindUnique.mockResolvedValueOnce(null);
        mockFindFirst.mockResolvedValueOnce(null);
        mockCreate.mockResolvedValueOnce(mockUser);

        await upsertGoogleUser({
          sub: "google-sub-456",
          email: "founder@mycompany.io",
          emailVerified: true,
          name: "Founder",
        });

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ role: "ADMIN" }),
          }),
        );
      } finally {
        config.adminSignupDomains = original;
      }
    });

    test("lowercases email on create", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      mockFindFirst.mockResolvedValueOnce(null);
      mockCreate.mockResolvedValueOnce(mockUser);

      await upsertGoogleUser({ ...baseProfile, email: "  USER@Example.COM  " });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: "user@example.com" }),
        }),
      );
    });
  });
});
