import {useState} from "react";
import {uploadToCloudinary} from "../services/cloudinary.service.js";

export function useCloudinaryUpload() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const uploadImage = async (file) => {
        try {
            setLoading(true);
            setError(null);
            return await uploadToCloudinary(file);
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const uploadImages = async (files = []) => {
        try {
            setLoading(true);
            setError(null);

            return await Promise.all(
                files.map((file) => uploadToCloudinary(file))
            );
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    return {
        uploadImage,
        uploadImages,
        loading,
        error,
    };
}
