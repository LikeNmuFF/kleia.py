import { uploadPublicImageBuffer } from "../ctf/uploads/cloudinary";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_FOLDER = "practice-team-avatars";

type AvatarMimeType = "image/png" | "image/jpeg" | "image/gif" | "image/webp";

type ValidatedPracticeTeamAvatar = {
  buffer: Buffer;
  mimeType: AvatarMimeType;
};

export async function validatePracticeTeamAvatar(file: File): Promise<ValidatedPracticeTeamAvatar> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.byteLength < 1) {
    throw new Error("Unsupported avatar file");
  }

  if (buffer.byteLength > MAX_AVATAR_BYTES) {
    throw new Error("Avatar must be 5 MB or smaller");
  }

  const detectedMime = detectAvatarMime(buffer);
  if (!detectedMime || detectedMime !== file.type) {
    throw new Error("Unsupported avatar file");
  }

  return {
    buffer,
    mimeType: detectedMime,
  };
}

export async function uploadPracticeTeamAvatar(file: File): Promise<{ secureUrl: string; publicId: string }> {
  const validated = await validatePracticeTeamAvatar(file);

  return uploadPublicImageBuffer(validated.buffer, {
    folder: AVATAR_FOLDER,
    mimeType: validated.mimeType,
  });
}

function detectAvatarMime(buffer: Buffer): AvatarMimeType | null {
  if (hasPrefix(buffer, "89504e470d0a1a0a")) return "image/png";
  if (hasPrefix(buffer, "ffd8ff")) return "image/jpeg";
  if (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a") {
    return "image/gif";
  }
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return null;
}

function hasPrefix(buffer: Buffer, hex: string): boolean {
  return buffer.subarray(0, hex.length / 2).equals(Buffer.from(hex, "hex"));
}
