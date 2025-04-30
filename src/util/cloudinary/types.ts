import { UploadApiResponse } from "cloudinary";

export interface CloudinaryUploadResult {
    uploadResult: UploadApiResponse,
    secure_url: string;
    public_id: string;
    optimizeUrl: string;
    autoCropUrl: string;
}