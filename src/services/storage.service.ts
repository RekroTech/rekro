import { createClient } from "@/lib/supabase/client";

export interface UploadFileResult {
    url: string;
    path: string;
}

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
 * Upload property images
 */
export async function uploadPropertyImages(files: File[], userId: string): Promise<string[]> {
    const folder = `properties/${userId}`;
    const results = await uploadFiles(files, "property-images", folder);
    return results.map((r) => r.url);
}

/**
 * Upload property video
 */
export async function uploadPropertyVideo(file: File, userId: string): Promise<string> {
    const folder = `properties/${userId}`;
    const result = await uploadFile(file, "property-videos", folder);
    return result.url;
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
