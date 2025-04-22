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
    
export const storage = new CloudinaryStorage
({
    cloudinary: cloudinary,
    params: {
        folder: 'DermaValue/clinics', // The name of the folder in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg'], // Allowed formats for upload
    } as any,
});

export async function uploadImage(imagePath: string, folderPath: string, userId: string) {
    try {
        const uploadResult = await cloudinary.uploader.upload(imagePath, {
            public_id: 'avatar', // you can make this dynamic too
            folder: `DermaValue/${folderPath}/${userId}/profile`, // optional, specify the folder in your Cloudinary account
        });

        const optimizeUrl = cloudinary.url(uploadResult.public_id, {
            fetch_format: 'auto',
            quality: 'auto'
        });

        const autoCropUrl = cloudinary.url(uploadResult.public_id, {
            crop: 'auto',
            gravity: 'auto',
            width: 500,
            height: 500,
        });

        return {
            uploadResult,
            optimizeUrl,
            autoCropUrl
        };

    } catch (error) {
        console.error('Cloudinary upload failed:', error);
        throw error;
    }
}

export async function uploadClinicImage(imagePath: string, clinicId: string) {
    try {
        const uploadResult = await cloudinary.uploader.upload(imagePath, {
            public_id: 'cover', // optional, can use clinicId or generate a unique ID
            folder: `DermaValue/clinics`,
        });

        const optimizeUrl = cloudinary.url(uploadResult.public_id, {
            fetch_format: 'auto',
            quality: 'auto'
        });

        const autoCropUrl = cloudinary.url(uploadResult.public_id, {
            crop: 'fill',
            gravity: 'auto',
            width: 800,
            height: 400,
        });

        return {
            uploadResult,
            optimizeUrl,
            autoCropUrl
        };

    } catch (error) {
        console.error('Cloudinary upload failed:', error);
        throw error;
    }
}
