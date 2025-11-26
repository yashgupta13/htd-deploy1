import { useState } from 'react';
import { Upload, X, FileText, Loader2, AlertCircle } from 'lucide-react';

// Upload Area Component
const UploadArea = ({ onFileSelect }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-3 border-dashed border-indigo-300 rounded-xl p-12 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-indigo-50"
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <Upload className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
        <p className="text-lg font-semibold text-gray-700 mb-2">
          Drop your prescription here or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Supports: JPG, PNG, JPEG
        </p>
      </label>
    </div>
  );
};

// Image Preview Component
const ImagePreview = ({ previewUrl, onClear, onFileChange, onAnalyze, isLoading }) => {
  return (
    <div className="space-y-6">
      <div className="relative">
        <img
          src={previewUrl}
          alt="Prescription preview"
          className="w-full max-h-96 object-contain rounded-lg border-2 border-gray-200"
        />
        <button
          onClick={onClear}
          className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-4">
        <label
          htmlFor="file-upload-change"
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors cursor-pointer text-center"
        >
          Change Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
          id="file-upload-change"
        />
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Prescription'
          )}
        </button>
      </div>
    </div>
  );
};

// Error Alert Component
const ErrorAlert = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      <p className="text-red-700">{message}</p>
    </div>
  );
};

// Result Modal Component
const ResultModal = ({ isOpen, onClose, result }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-indigo-600 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analysis Results</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-indigo-700 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {result ? (
            <div className="space-y-4">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-gray-600">No analysis data available</p>
          )}
        </div>

        <div className="bg-gray-50 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-indigo-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Prescription Analyzer Component
const PrescriptionAnalyzer = ({ apiEndpoint = 'https://htr-backend.vercel.app/api/analyze' }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
  // Validate file selection
  if (!selectedFile) {
    setError('Please select an image first');
    return;
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(selectedFile.type)) {
    setError('Please upload a valid image file (JPEG, PNG, or WebP)');
    return;
  }

  // Validate file size (5MB limit)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (selectedFile.size > MAX_SIZE) {
    setError('Image size must be less than 5MB');
    return;
  }

  setIsLoading(true);
  setError(null);
  setAnalysisResult(null); // Clear previous results

  try {
    // Convert image to base64
    const base64String = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        try {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          
          if (!base64) {
            reject(new Error('Failed to convert image to base64'));
            return;
          }
          
          resolve(base64);
        } catch (err) {
          reject(new Error('Error processing image data'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(selectedFile);
    });

    console.log('Sending request to:', apiEndpoint);
    console.log('Image size (KB):', Math.round(base64String.length / 1024));
    console.log('Image type:', selectedFile.type);

    // Send to backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: base64String,
        mimeType: selectedFile.type, // Send actual MIME type
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('Response status:', response.status);

    // Handle different response statuses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      switch (response.status) {
        case 400:
          throw new Error(errorData.error || 'Invalid image data. Please try another image.');
        case 413:
          throw new Error('Image is too large. Please use an image under 5MB.');
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log('Response data:', data);

    // Validate response data
    if (!data || !data.output) {
      throw new Error('Invalid response from server');
    }

    setAnalysisResult(data);
    setShowModal(true);

  } catch (err) {
    console.error('Upload error:', err);

    // Provide specific error messages
    if (err.name === 'AbortError') {
      setError('Request timed out. Please try again with a smaller image.');
    } else if (err.message === 'Failed to fetch') {
      setError('Connection failed. Please check your internet connection and API endpoint.');
    } else if (err.message.includes('NetworkError')) {
      setError('Network error. Please check your connection and try again.');
    } else {
      setError(err.message || 'An error occurred while processing the image');
    }
  } finally {
    setIsLoading(false);
  }
};
  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Prescription Analyzer
          </h1>
          <p className="text-gray-600">
            Upload a doctor's prescription image for analysis
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!previewUrl ? (
            <UploadArea onFileSelect={handleFileSelect} />
          ) : (
            <ImagePreview
              previewUrl={previewUrl}
              onClear={clearSelection}
              onFileChange={handleFileChange}
              onAnalyze={handleUpload}
              isLoading={isLoading}
            />
          )}

          <ErrorAlert message={error} />
        </div>
      </div>

      <ResultModal
        isOpen={showModal}
        onClose={closeModal}
        result={analysisResult}
      />
    </div>
  );
};

export default PrescriptionAnalyzer;

