import { beforeEach, describe, expect, it, vi } from "vitest";

import { uploadPracticeTeamAvatar, validatePracticeTeamAvatar } from "./avatar-upload";
import { uploadPublicImageBuffer } from "../ctf/uploads/cloudinary";

vi.mock("../ctf/uploads/cloudinary", () => ({
  uploadPublicImageBuffer: vi.fn(async () => ({
    secureUrl: "https://res.cloudinary.com/demo/image/upload/team.png",
    publicId: "practice-team-avatars/team.png",
  })),
}));

const png = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
const jpg = Buffer.from("ffd8ffe000104a464946", "hex");
const gif = Buffer.from("474946383961", "hex");
const webp = Buffer.from("524946461a00000057454250", "hex");
const pdf = Buffer.from("%PDF-1.7");
const zip = Buffer.from("504b0304", "hex");

function file(name: string, type: string, bytes: Buffer): File {
  const arrayBuffer = new ArrayBuffer(bytes.length);
  new Uint8Array(arrayBuffer).set(bytes);
  return new File([arrayBuffer], name, { type });
}

describe("practice team avatar uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["avatar.png", "image/png", png],
    ["avatar.jpg", "image/jpeg", jpg],
    ["avatar.gif", "image/gif", gif],
    ["avatar.webp", "image/webp", webp],
  ])("accepts %s only when MIME and bytes match", async (name, type, bytes) => {
    const validated = await validatePracticeTeamAvatar(file(name, type, bytes));

    expect(validated.mimeType).toBe(type);
    expect(validated.buffer.subarray(0, bytes.length)).toEqual(bytes);
  });

  it.each([
    ["avatar.svg", "image/svg+xml", Buffer.from("<svg></svg>")],
    ["avatar.pdf", "application/pdf", pdf],
    ["avatar.zip", "application/zip", zip],
  ])("rejects unsafe avatar type %s", async (name, type, bytes) => {
    await expect(validatePracticeTeamAvatar(file(name, type, bytes))).rejects.toThrow("Unsupported avatar file");
  });

  it("rejects oversized avatar files before upload", async () => {
    await expect(
      validatePracticeTeamAvatar(file("big.png", "image/png", Buffer.concat([png, Buffer.alloc(5 * 1024 * 1024 + 1)]))),
    ).rejects.toThrow("Avatar must be 5 MB or smaller");
  });

  it("uploads verified bytes to the practice-team avatar folder", async () => {
    const result = await uploadPracticeTeamAvatar(file("team.png", "image/png", png));

    expect(uploadPublicImageBuffer).toHaveBeenCalledWith(expect.any(Buffer), {
      folder: "practice-team-avatars",
      mimeType: "image/png",
    });
    expect(result).toEqual({
      secureUrl: "https://res.cloudinary.com/demo/image/upload/team.png",
      publicId: "practice-team-avatars/team.png",
    });
  });
});
