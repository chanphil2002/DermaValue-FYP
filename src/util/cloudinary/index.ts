import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRETS
});
    
export async function uploadImage(imagePath: string, userId: string) {
    try {
        const uploadResult = await cloudinary.uploader.upload(imagePath, {
            public_id: 'avatar', // you can make this dynamic too
            folder: `DermaValue/users/${userId}/profile`, // optional, specify the folder in your Cloudinary account
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