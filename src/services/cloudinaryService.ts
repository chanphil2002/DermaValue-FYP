import { cloudinary } from '../util/cloudinary';

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

export async function uploadAppointmentImage(imagePath: string, appointmentId: string) {
    try {
        const uploadResult = await cloudinary.uploader.upload(imagePath, {
            public_id: `image`, // optional, can be dynamic or fixed
            folder: `DermaValue/appointments/${appointmentId}/images`,
        });

        const optimizeUrl = cloudinary.url(uploadResult.public_id, {
            fetch_format: 'auto',
            quality: 'auto',
        });

        const thumbUrl = cloudinary.url(uploadResult.public_id, {
            width: 300,
            height: 300,
            crop: 'fill',
            gravity: 'auto',
        });

        return {
            uploadResult,
            optimizeUrl,
            thumbUrl,
        };

    } catch (error) {
        console.error("Cloudinary appointment image upload failed:", error);
        throw error;
    }
}