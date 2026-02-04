import { createClient } from "@/lib/supabase/client";
import { sanitizeFilename } from "@/lib/utils/fileUtils";

export interface UploadFileResult {
    url: string;
    path: string;
}

const STORAGE_BUCKET = "rekro-s3";

/**
 * Upload a single file to Supabase Storage
 */
export async function uploadFile(
    file: File,
    bucket: string,
    folder: string = ""
): Promise<UploadFileResult> {
    const supabase = createClient();

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
    });

    if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return { url: publicUrl, path: data.path };
}

/**
 * Upload multiple files to Supabase Storage
 */
export async function uploadFiles(
    files: File[],
    bucket: string,
    folder: string = ""
): Promise<UploadFileResult[]> {
    return Promise.all(files.map((file) => uploadFile(file, bucket, folder)));
}

/**
 * Upload property files (images or videos) to the new unified bucket structure
 * Path format: property/{propertyId}/{uuid}-{filename}
 */
export async function uploadPropertyFile(
    file: File,
    propertyId: string
): Promise<UploadFileResult> {
    const supabase = createClient();

    // Generate unique filename with UUID and sanitize original filename
    const uuid = crypto.randomUUID();
    const sanitizedFilename = sanitizeFilename(file.name);
    const path = `property/${propertyId}/${uuid}-${sanitizedFilename}`;

    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
    });

    if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Return the storage path instead of the full URL
    return { url: data.path, path: data.path };
}

/**
 * Upload multiple property files
 */
export async function uploadPropertyFiles(
    files: File[],
    propertyId: string
): Promise<UploadFileResult[]> {
    return Promise.all(files.map((file) => uploadPropertyFile(file, propertyId)));
}

/**
 * Upload property images using new unified bucket
 * Returns only the filename parts (without property/{id}/ prefix)
 */
export async function uploadPropertyImages(files: File[], propertyId: string): Promise<string[]> {
    const results = await uploadPropertyFiles(files, propertyId);
    // Extract only the filename part from the full path: property/{id}/{filename}
    return results.map((r) => {
        const parts = r.path.split("/");
        return parts[parts.length - 1]; // Return only the filename
    });
}

/**
 * Get public URL for a file in the rekro-s3 bucket
 * Handles both storage paths and legacy full URLs
 * @param pathOrUrl - Can be:
 *   - Full URL (legacy): https://...
 *   - Full path: property/{id}/{filename}
 *   - Just filename: {uuid}-{filename}
 * @param propertyId - Required when pathOrUrl is just a filename
 */
export function getPropertyFileUrl(pathOrUrl: string, propertyId?: string): string {
    // If it's already a full URL, return it as-is (for backward compatibility)
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
        return pathOrUrl;
    }

    // If it's a full path starting with "property/", use it as-is
    let fullPath = pathOrUrl;

    // If it's just a filename and we have a propertyId, construct the full path
    if (!pathOrUrl.startsWith("property/") && propertyId) {
        fullPath = `property/${propertyId}/${pathOrUrl}`;
    }

    // Generate URL from path
    const supabase = createClient();
    const {
        data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fullPath);
    return publicUrl;
}

/**
 * Convert an array of paths/URLs to public URLs
 * @param pathsOrUrls - Array of filenames, paths, or URLs
 * @param propertyId - Required when pathsOrUrls contains just filenames
 */
export function getPropertyFileUrls(pathsOrUrls: string[], propertyId?: string): string[] {
    return pathsOrUrls.map((pathOrUrl) => getPropertyFileUrl(pathOrUrl, propertyId));
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
    }
}

/**
 * Delete multiple files from Supabase Storage
 */
export async function deleteFiles(bucket: string, paths: string[]): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
        throw new Error(`Failed to delete files: ${error.message}`);
    }
}

/**
 * Delete property files from rekro-s3 bucket
 * Handles both storage paths and legacy full URLs
 * @param pathsOrUrls - Array of filenames, paths, or URLs
 * @param propertyId - Required when pathsOrUrls contains just filenames
 */
export async function deletePropertyFiles(
    pathsOrUrls: string[],
    propertyId?: string
): Promise<void> {
    const supabase = createClient();

    // Extract paths from URLs or use paths as-is
    const paths = pathsOrUrls
        .map((pathOrUrl) => {
            // If it's a full URL, extract the path
            if (pathOrUrl.includes("/storage/v1/object/public/rekro-s3/")) {
                const match = pathOrUrl.match(/\/storage\/v1\/object\/public\/rekro-s3\/(.+)$/);
                return match ? decodeURIComponent(match[1]) : null;
            }
            // If it's a full path starting with "property/", use it as-is
            if (pathOrUrl.startsWith("property/")) {
                return pathOrUrl;
            }
            // If it's just a filename and we have a propertyId, construct the full path
            if (propertyId) {
                return `property/${propertyId}/${pathOrUrl}`;
            }
            // Otherwise, it's already a path
            return pathOrUrl;
        })
        .filter((path): path is string => path !== null);

    if (paths.length === 0) {
        return;
    }

    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);

    if (error) {
        throw new Error(`Failed to delete property files: ${error.message}`);
    }
}

/**
 * Delete all files in a property folder
 */
export async function deletePropertyFolder(propertyId: string): Promise<void> {
    const supabase = createClient();

    const { data: files, error: listError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(`property/${propertyId}`);

    if (listError) {
        throw new Error(`Failed to list property files: ${listError.message}`);
    }

    if (!files || files.length === 0) {
        return;
    }

    const paths = files.map((file) => `property/${propertyId}/${file.name}`);
    await deleteFiles(STORAGE_BUCKET, paths);
}
