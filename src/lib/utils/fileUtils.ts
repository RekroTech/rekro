/**
 * File utility functions for handling media files
 */

/**
 * Check if a file is an image based on MIME type
 */
export function isImageFile(file: File): boolean {
    return file.type.startsWith("image/");
}

/**
 * Check if a file is a video based on MIME type
 */
export function isVideoFile(file: File): boolean {
    return file.type.startsWith("video/");
}

/**
 * Check if a file is a valid media file (image or video)
 */
export function isMediaFile(file: File): boolean {
    return isImageFile(file) || isVideoFile(file);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";
}

/**
 * Check if a file path/URL is an image based on extension
 */
export function isImagePath(path: string): boolean {
    const ext = getFileExtension(path).toLowerCase();
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".ico"];
    return imageExtensions.includes(ext);
}

/**
 * Check if a file path/URL is a video based on extension
 */
export function isVideoPath(path: string): boolean {
    const ext = getFileExtension(path).toLowerCase();
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv", ".m4v"];
    return videoExtensions.includes(ext);
}

/**
 * Check if a file path/URL is a 360 file based on extension
 */
export function is360Path(path: string): boolean {
    const ext = getFileExtension(path).toLowerCase();
    const threeSixtyExtensions = [".360", ".pano", ".equirectangular"];
    // Also check for common 360 naming patterns
    const lowerPath = path.toLowerCase();
    return (
        threeSixtyExtensions.includes(ext) ||
        lowerPath.includes("360") ||
        lowerPath.includes("pano") ||
        lowerPath.includes("equirectangular")
    );
}

/**
 * Get media type from file path/URL
 */
export function getMediaType(path: string): "image" | "video" | "360" | "unknown" {
    if (is360Path(path)) return "360";
    if (isVideoPath(path)) return "video";
    if (isImagePath(path)) return "image";
    return "unknown";
}

/**
 * Sanitize filename by removing spaces and special characters
 */
export function sanitizeFilename(filename: string): string {
    const lastDotIndex = filename.lastIndexOf(".");
    const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";

    // Remove spaces and special characters, replace with hyphens
    const sanitizedName = name
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/[^a-zA-Z0-9-_]/g, "") // Remove special characters
        .toLowerCase();

    return `${sanitizedName}${ext}`;
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Validate file size (in bytes)
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
}

/**
 * Validate image file
 */
export function validateImageFile(
    file: File,
    maxSizeMB: number = 10
): {
    valid: boolean;
    error?: string;
} {
    if (!isImageFile(file)) {
        return { valid: false, error: "File must be an image" };
    }

    if (!validateFileSize(file, maxSizeMB)) {
        return {
            valid: false,
            error: `Image size must be less than ${maxSizeMB}MB`,
        };
    }

    return { valid: true };
}

/**
 * Validate video file
 */
export function validateVideoFile(
    file: File,
    maxSizeMB: number = 100
): {
    valid: boolean;
    error?: string;
} {
    if (!isVideoFile(file)) {
        return { valid: false, error: "File must be a video" };
    }

    if (!validateFileSize(file, maxSizeMB)) {
        return {
            valid: false,
            error: `Video size must be less than ${maxSizeMB}MB`,
        };
    }

    return { valid: true };
}
