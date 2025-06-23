import React, { useEffect, useState } from 'react';
import { database } from './config';
import { addDoc, collection, getDocs } from 'firebase/firestore';

const EnhancedUserForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    image: null, // Stores the File object
    imageUrl: '', // Stores the Cloudinary URL
    imagePreview: null, // Stores the local URL for preview
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  const imageCollectionRef = collection(database, 'imageupload');

  useEffect(() => {
    const getUploadedImages = async () => {
      try {
        const data = await getDocs(imageCollectionRef);
        setUploadedImages(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      } catch (error) {
        console.error('Error fetching uploaded images:', error);
      }
    };

    getUploadedImages();
  }, [imageCollectionRef]); // Fetch images on component mount

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Validate image only if it's the final submission
    if (!formData.imageUrl) { // Check for the Cloudinary URL
      newErrors.image = 'Please upload an image';
    } else if (formData.image && formData.image.size > 2 * 1024 * 1024) {
      newErrors.image = 'Image size should be less than 2MB';
    } else if (formData.image && !['image/jpeg', 'image/png', 'image/gif'].includes(formData.image.type)) {
      newErrors.image = 'Please upload a JPEG, PNG, or GIF image';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFormData((prev) => ({ ...prev, image: null, imageUrl: '', imagePreview: null }));
      setErrors((prev) => ({ ...prev, image: 'Please upload an image' }));
      return;
    }

    // Client-side validation for immediate feedback
    const newErrors = {};
    if (file.size > 2 * 1024 * 1024) {
      newErrors.image = 'Image size should be less than 2MB';
    }
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      newErrors.image = 'Please upload a JPEG, PNG, or GIF image';
    }

    setErrors((prev) => ({ ...prev, image: newErrors.image || '' }));

    if (Object.keys(newErrors).length > 0) {
      setFormData((prev) => ({ ...prev, image: null, imageUrl: '', imagePreview: null }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file), // Create local URL for preview
    }));

    // Upload to Cloudinary
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'upload-img'); // Replace with your upload preset
    data.append('cloud_name', 'dupatuebb'); // Replace with your cloud name

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dupatuebb/image/upload', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        throw new Error(`Cloudinary upload failed with status: ${res.status}`);
      }

      const uploadedImageurl = await res.json();
      console.log('Cloudinary URL:', uploadedImageurl.url);
      setFormData((prev) => ({
        ...prev,
        imageUrl: uploadedImageurl.url, // Store the Cloudinary URL
      }));
      setErrors((prev) => ({ ...prev, image: '' })); // Clear image error on successful upload
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      setErrors((prev) => ({
        ...prev,
        image: 'Failed to upload image. Please try again.',
      }));
      setFormData((prev) => ({ ...prev, imageUrl: '' })); // Clear imageUrl on upload failure
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      await addDoc(imageCollectionRef, {
        Name: formData.name,
        Phone: formData.phone,
        ImageUrl: formData.imageUrl, // Store the Cloudinary URL
        ImageName: formData.image ? formData.image.name : 'N/A', // Store original name if available
      });

      console.log('Form data submitted to Firestore:', {
        name: formData.name,
        phone: formData.phone,
        imageUrl: formData.imageUrl,
        imageName: formData.image ? formData.image.name : 'N/A',
      });

      setSubmitSuccess(true);
      setFormData({
        name: '',
        phone: '',
        image: null,
        imageUrl: '',
        imagePreview: null,
      });
      setErrors({}); // Clear any previous submission errors

      // Re-fetch the uploaded images to update the list
      const data = await getDocs(imageCollectionRef);
      setUploadedImages(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      console.error('Submission error:', error);
      setErrors((prev) => ({
        ...prev,
        submit: 'Failed to submit form. Please try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>User Information Form</h2>

      {submitSuccess && (
        <div style={styles.successMessage}>Form submitted successfully!</div>
      )}

      {errors.submit && (
        <div style={styles.errorMessage}>{errors.submit}</div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="name" style={styles.label}>
            Name:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            style={errors.name ? { ...styles.input, borderColor: '#e74c3c' } : styles.input}
          />
          {errors.name && <span style={styles.errorText}>{errors.name}</span>}
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="phone" style={styles.label}>
            Phone Number:
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            style={errors.phone ? { ...styles.input, borderColor: '#e74c3c' } : styles.input}
          />
          {errors.phone && <span style={styles.errorText}>{errors.phone}</span>}
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="image" style={styles.label}>
            Upload Image (Max 2MB):
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            style={errors.image ? { ...styles.fileInput, borderColor: '#e74c3c' } : styles.fileInput}
          />
          {errors.image && <span style={styles.errorText}>{errors.image}</span>}
          {formData.imagePreview && (
            <div style={styles.imagePreviewContainer}>
              <img src={formData.imagePreview} alt="Preview" style={styles.imagePreview} />
            </div>
          )}
        </div>

        <button
          type="submit"
          style={isSubmitting ? styles.submitButtonDisabled : styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      <div>
        <h2 style={styles.heading}>Uploaded Information</h2>
        {uploadedImages.map((imageInfo) => (
          <div key={imageInfo.id} style={styles.uploadedItem}>
            <h3>{imageInfo.Name}</h3>
            <p>Phone: {imageInfo.Phone}</p>
            {imageInfo.ImageUrl && (
              <a href={imageInfo.ImageUrl} target="_blank" rel="noopener noreferrer">
                {imageInfo.ImageName}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced styling
const styles = {
  container: {
    maxWidth: '500px',
    margin: '20px auto',
    padding: '25px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#34495e',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontSize: '16px',
    transition: 'border 0.3s',
  },
  fileInput: {
    width: '100%',
    padding: '8px 0',
    fontSize: '14px',
    border: '1px solid #ddd', // Added border for consistency
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  imagePreviewContainer: {
    marginTop: '15px',
    textAlign: 'center',
  },
  imagePreview: {
    maxWidth: '200px',
    maxHeight: '200px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    objectFit: 'contain', // Ensure image scales well
  },
  submitButton: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '12px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '15px',
    transition: 'background-color 0.3s',
  },
  submitButtonDisabled: {
    backgroundColor: '#95a5a6',
    color: 'white',
    padding: '12px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
    fontSize: '16px',
    marginTop: '15px',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: '14px',
    marginTop: '5px',
    display: 'block',
  },
  errorMessage: {
    backgroundColor: '#fdecea',
    color: '#e74c3c',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    border: '1px solid #ef9a9a',
  },
  successMessage: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    border: '1px solid #a5d6a7',
  },
  uploadedItem: {
    border: '1px solid #ddd',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '10px',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  uploadedImage: {
    maxWidth: '150px',
    maxHeight: '150px',
    marginTop: '10px',
    marginBottom: '10px',
    border: '1px solid #eee',
    borderRadius: '4px',
    objectFit: 'contain',
  }
};

export default EnhancedUserForm;