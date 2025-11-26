import { useState } from 'react';
import { Upload, X, FileText, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

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
          Supports: JPG, PNG, JPEG, WebP
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
  const [showRaw, setShowRaw] = useState(false);

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
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold mb-4"
              >
                {showRaw ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Hide Raw Response
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Show Raw Response
                  </>
                )}
              </button>

              {showRaw ? (
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed font-mono border border-gray-200">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                  {result.text || 'No analysis text available'}
                </div>
              )}
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
const PrescriptionAnalyzer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  // Get API key from environment variable (Vite uses VITE_ prefix)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

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
    // Note: apiKey is assumed to be retrieved from process.env.GEMINI_API_KEY outside this function.
    if (!apiKey) {
      setError('Gemini API key is not configured. Please check your environment variables.');
      return;
    }

    // Validate file selection
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (20MB limit for Gemini)
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    if (selectedFile.size > MAX_SIZE) {
      setError('Image size must be less than 20MB');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // Convert image to base64
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onloadend = () => {
          try {
            // This correctly extracts the raw base64 string after the comma (data URL prefix)
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

      // --- OPTIMIZED GEMINI API CALL ---

      // 1. UPDATED URL: Using v1beta and the recommended gemini-2.5-flash model
      const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const prompt = `
        You are an expert Medical Transcriptionist. Analyze the uploaded prescription image. 
        Extract the following information. If any item is not visible or illegible, state 'N/A' for that field. 
        
        <OUTPUT_FORMAT>
        1) Patient Name: [Extracted Name or N/A]
        2) Medication Names: [List all names clearly separated by commas, e.g., 'Aspirin, Amoxicillin']
        3) Dosage Information: [List all dosages corresponding to medications, e.g., '500mg, 250mg']
        4) Frequency: [List all frequencies, e.g., 'Twice daily, Once at bedtime']
        5) Duration: [List all durations, e.g., '7 days, Until finished']
        6) Doctor Name/Signature: [Name or N/A]
        7) Date: [Extracted Date in YYYY-MM-DD format or N/A]
        8) Warnings/Contraindications: [List any explicit warnings or N/A]
        </OUTPUT_FORMAT>

        Provide ONLY the text within the <OUTPUT_FORMAT> tags.
      `;

      const response = await fetch(geminiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt // The refined text prompt
                },
                {
                  inline_data: {
                    mime_type: selectedFile.type,
                    data: base64String
                  }
                }
              ]
            }
          ],
          // 2. Added Configuration: Lower temperature for factual extraction
          config: {
              temperature: 0.2, 
          }
        })
      });
      
      // --- END OPTIMIZED API CALL ---

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        switch (response.status) {
          case 400:
            throw new Error('Invalid API request. Check your image, prompt, or request formatting.');
          case 401:
            throw new Error('Invalid API key. Please check and try again.');
          case 403:
            throw new Error('API access denied. Check your API key permissions.');
          case 429:
            throw new Error('Too many requests (Rate Limit Exceeded). Please wait a moment and try again.');
          case 500:
            throw new Error('Gemini API server error. Please try again later.');
          default:
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }
      }

      const data = await response.json();

      // Ensure the response path is correct
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!resultText) {
        // Handle cases where the model returns an empty or blocked response
        const safetyRatings = data.candidates?.[0]?.safetyRatings;
        if (safetyRatings) {
             console.warn('Safety Blocked:', safetyRatings);
             throw new Error('Response blocked due to safety settings. Please check your image content.');
        }
        throw new Error('Invalid or empty response from Gemini API.');
      }

      setAnalysisResult(resultText); // Use resultText instead of data.contents[0].parts[0] for robustness
      setShowModal(true);

    } catch (err) {
      console.error('Upload error:', err);

      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else if (err.message.includes('Failed to fetch')) {
        setError('Connection failed. Please check your internet connection.');
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
            Upload a doctor's prescription image for AI-powered analysis
          </p>
        </div>

        {!apiKey && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Configuration Error</h3>
                <p className="text-red-800 text-sm">
                  The Gemini API key environment variable is not set. Please add <code className="bg-red-100 px-2 py-1 rounded">REACT_APP_GEMINI_API_KEY</code> to your <code className="bg-red-100 px-2 py-1 rounded">.env.local</code> file.
                </p>
              </div>
            </div>
          </div>
        )}

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

