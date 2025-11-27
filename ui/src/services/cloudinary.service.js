const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const FOLDER = import.meta.env.VITE_CLOUDINARY_API_FOLDER;

if (!CLOUD_NAME) throw new Error("Missing Cloudinary CLOUD_NAME");
if (!UPLOAD_PRESET) throw new Error("Missing Cloudinary UPLOAD_PRESET");

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export async function uploadToCloudinary(file) {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    if (FOLDER) {
        formData.append("folder", FOLDER);
    }

    try {
        const res = await fetch(CLOUDINARY_URL, {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Cloudinary error:", data);
            throw new Error(data.error?.message || "Cloudinary upload failed");
        }

        // secure_url — найкраще, https (не http)
        return data.secure_url;
    } catch (err) {
        console.error("Upload error:", err);
        throw err;
    }
}
