import { cloudinary } from '../util/cloudinary';
import { CloudinaryUploadResult } from '../util/cloudinary/types';

export async function uploadImageFromBuffer(fileBuffer: Buffer, folderPath: string, userId: string): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `DermaValue/${folderPath}/${userId}/profile`,  // Optional: Define the folder path in your Cloudinary account
          public_id: userId,   // Use userId as public_id for uniqueness (optional)
          resource_type: 'image', // Type of resource being uploaded
          transformation: [
            {
              quality: 'auto', // Auto-adjust quality based on the content
              fetch_format: 'auto', // Automatically select the best format (e.g., WebP, JPEG)
            },
          ],
        },
        (error, result) => {
          if (error) {
            console.log("Cloudinary upload error:", error);
            return reject(`Cloudinary upload failed: ${error.message}`);
          }
  
          // Once the upload is successful, generate the optimized URLs
          if (!result) {
            return reject("Cloudinary upload failed: result is undefined");
          }

          const optimizeUrl = cloudinary.url(result.public_id, {
            fetch_format: 'auto',  // Automatically choose the best format
            quality: 'auto'        // Automatically choose the best quality
          });
  
          const autoCropUrl = cloudinary.url(result.public_id, {
            crop: 'auto',          // Auto crop based on image content
            gravity: 'auto',       // Auto gravity for image positioning
            width: 500,            // Resize to a width of 500px
            height: 500            // Resize to a height of 500px
          });
  
          // Resolve the result with the optimized URLs
          resolve({
            uploadResult: result,  // The raw upload result
            secure_url: result.secure_url,
            public_id: result.public_id, // The public ID of the uploaded image
            optimizeUrl: optimizeUrl,           // Optimized image URL
            autoCropUrl: autoCropUrl           // Auto-cropped image URL
          });
        }
      );
  
      // Pipe the file buffer to the upload stream
      uploadStream.end(fileBuffer); // Use .end() to provide the buffer data
    });
  }


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