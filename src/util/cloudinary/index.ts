import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
dotenv.config();

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRETS
});

export { cloudinary };
    
export const storage = new CloudinaryStorage
({
    cloudinary: cloudinary,
    params: {
        folder: 'DermaValue/clinics', // The name of the folder in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg'], // Allowed formats for upload
    } as any,
});
