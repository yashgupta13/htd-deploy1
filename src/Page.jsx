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


const ResultModal = ({ isOpen, onClose, result }) => {
  const [showRaw, setShowRaw] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [alternatives, setAlternatives] = useState(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

  if (!isOpen) return null;

  // Parse the result text into sections
  const parseResult = (text) => {
    if (!text) return null;
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const match = line.match(/^(\d+\))\s*(.+?):\s*(.+)$/);
      if (match) {
        return { number: match[1], label: match[2], value: match[3] };
      }
      return { raw: line };
    });
  };

  const parsedData = typeof result === "string" ? parseResult(result) : null;

  // Extract medications from parsed data
  const getMedications = () => {
    if (!parsedData) return [];
    const medSection = parsedData.find(item => 
      item.label && item.label.toLowerCase().includes('medication')
    );
    if (!medSection || !medSection.value) return [];
    
    return medSection.value
      .split(',')
      .map(med => med.trim())
      .filter(med => med && med !== 'N/A');
  };

  const medications = getMedications();

  // Fetch alternatives for selected medication using the API function
  const handleFetchAlternatives = async (medication) => {
    setLoadingAlternatives(true);
    setSelectedMedication(medication);
    
    const result = await fetchMedicationAlternatives(medication);
    
    if (result.success) {
      setAlternatives(result.data);
      setShowAlternatives(true);
    } else {
      setAlternatives(result.error);
      setShowAlternatives(true);
    }
    
    setLoadingAlternatives(false);
  };

  const closeAlternatives = () => {
    setShowAlternatives(false);
    setSelectedMedication(null);
    setAlternatives(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Prescription Analysis</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {result ? (
            <div className="p-6">
 {/* Toggle Button */}
              
              {/* <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium transition-all"
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
              </div>  */}

              {/* Content */}
              
              {/* {showRaw ? (
                <pre className="bg-gray-900 text-green-400 p-5 rounded-xl overflow-x-auto text-xs leading-relaxed font-mono shadow-inner">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : showAlternatives ? ( */}

              {showAlternatives ? (
                // Alternatives View with Table
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        Alternatives for {selectedMedication}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Market alternatives with pricing information
                      </p>
                    </div>
                    <button
                      onClick={closeAlternatives}
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium transition-all text-sm"
                    >
                      ← Back to Results
                    </button>
                  </div>

                  {loadingAlternatives ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                      <p className="text-gray-600">Searching for alternatives...</p>
                    </div>
                  ) : alternatives ? (
                    <div>
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-4">
                        <p className="text-amber-800 text-sm font-medium">
                          ⚠️ This information is for reference only. Always consult your doctor or pharmacist before switching medications.
                        </p>
                      </div>
                      
                      {/* Check if alternatives is an error string or valid data */}
                      {typeof alternatives === 'string' ? (
                        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-red-800 text-sm font-medium mb-1">Error Loading Alternatives</p>
                              <p className="text-red-700 text-sm">{alternatives}</p>
                            </div>
                          </div>
                        </div>
                      ) : alternatives.alternatives && alternatives.alternatives.length > 0 ? (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-indigo-600 to-indigo-700">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                  #
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                  Medicine Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                  Price Range
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                  Manufacturer
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                  Notes
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {alternatives.alternatives.map((alt, index) => (
                                <tr key={index} className="hover:bg-indigo-50 transition-colors">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                    {alt.name}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      alt.type === 'Generic' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {alt.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-indigo-700">
                                    {alt.price}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {alt.manufacturer}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {alt.note}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">No alternatives found for this medication.</p>
                          <button
                            onClick={closeAlternatives}
                            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                          >
                            Go Back
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">No alternatives available</p>
                  )}
                </div>
              ) : parsedData ? (
                // Formatted Medical Output with Table Structure
                <div className="space-y-6">
                  {/* Patient and Doctor Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsedData.filter(item => 
                      item.label &&
!item.label.toLowerCase().includes('medication') &&
!item.label.toLowerCase().includes('dosage') &&
!item.label.toLowerCase().includes('frequency') &&
!item.label.toLowerCase().includes('duration') &&
!item.label.toLowerCase().includes('summary')
                    ).map((item, index) => (
                      <div 
                        key={index}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 rounded-r-lg p-4"
                      >
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          {item.label}
                        </p>
                        <p className="text-base text-gray-800 font-medium">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Medications Table */}
                  {(() => {
                    const medSection = parsedData.find(item => item.label && item.label.toLowerCase().includes('medication'));
                    const dosageSection = parsedData.find(item => item.label && item.label.toLowerCase().includes('dosage'));
                    const frequencySection = parsedData.find(item => item.label && item.label.toLowerCase().includes('frequency'));
                  const summarySection = parsedData.find(item => item.label && item.label.toLowerCase().includes('summary'));
                    const durationSection = parsedData.find(item => item.label && item.label.toLowerCase().includes('duration'));
                    
                    if (!medSection) return null;
                    
                    const meds = medSection.value.split(',').map(m => m.trim()).filter(m => m && m !== 'N/A');
                    const dosages = dosageSection ? dosageSection.value.split(',').map(m => m.trim()) : [];
                    const frequencies = frequencySection ? frequencySection.value.split(',').map(m => m.trim()) : [];
                    const durations = durationSection ? durationSection.value.split(',').map(m => m.trim()) : [];
                  const summarys = summarySection ? summarySection.value.split(',').map(m => m.trim()) : [];
                    
                    if (meds.length === 0) return null;
                    
                    return (
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-3">Prescribed Medications</h3>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm mb-4">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-indigo-600 to-indigo-700">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                  #
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                  Medication Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                  Dosage
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                  Frequency
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                  Duration
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                  Summary
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {meds.map((med, index) => (
                                <tr key={index} className="hover:bg-indigo-50 transition-colors">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                    {med}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {dosages[index] || 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {frequencies[index] || 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {durations[index] || 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {summarys[index] || 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <button
                                      onClick={() => handleFetchAlternatives(med)}
                                      disabled={loadingAlternatives}
                                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                      {loadingAlternatives && selectedMedication === med ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          Loading...
                                        </>
                                      ) : (
                                        <>
                                          Find Alternatives
                                        </>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Warnings Section */}
                  {(() => {
                    const warningsSection = parsedData.find(item => item.label && item.label.toLowerCase().includes('warning'));
                    if (!warningsSection || warningsSection.value === 'N/A') return null;
                    
                    return (
                      <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4">
                        <p className="text-xs font-semibold text-amber-800 mb-1">
                          ⚠️ {warningsSection.label}
                        </p>
                        <p className="text-sm text-amber-900">
                          {warningsSection.value}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                // Fallback for non-parsed content
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                  {typeof result === "string" ? result : result.text || "No analysis text available"}
                </div>
              )}

            </div>
          ) : (
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No analysis data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-5 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            ⚠️ Always verify prescription details with a healthcare professional
          </p>
          <button
            onClick={onClose}
            className="bg-indigo-600 text-white py-2.5 px-8 rounded-lg font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
// API Function to fetch medication alternatives using Gemini API
const fetchMedicationAlternatives = async (medication) => {
  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  
  try {
    // Validate API key
    if (!apiKey) {
      throw new Error('Gemini API key is not configured. Please check your environment variables.');
    }

    // Call Gemini API
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
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
                text: `You are a pharmaceutical database expert specializing in the Indian medicine market. Find alternatives for the medication "${medication}".

REQUIREMENTS:
1. Search for both GENERIC and BRAND NAME alternatives
2. Focus ONLY on medicines available in India
3. Include accurate price ranges in Indian Rupees (₹)
4. Prioritize commonly prescribed and widely available options
5. Include both cheaper generic versions and premium branded options

OUTPUT FORMAT - Return ONLY valid JSON (no markdown, no backticks, no extra text):

{
  "alternatives": [
    {
      "name": "Exact medicine name as sold in India",
      "type": "Generic" OR "Brand",
      "price": "₹[lowest]-[highest] per [unit, e.g., strip of 10 tablets]",
      "manufacturer": "Actual pharmaceutical company name",
      "note": "Key differentiator - e.g., 'Same salt, lower cost', 'Extended release formula', 'Combination drug', etc."
    }
  ]
}

GUIDELINES:
- Provide 6-8 alternatives (mix of generic and branded)
- Price format: "₹50-80 per strip of 10 tablets" or "₹200-350 per bottle of 100ml"
- For generics: mention if bioequivalent, cost savings vs brand
- For brands: mention unique features (e.g., faster absorption, better tolerability)
- Note any combination drugs or different formulations
- Mention if medicine is OTC (Over-The-Counter) or requires prescription

CRITICAL: Return ONLY the JSON object. No preamble, no markdown formatting, no explanations.`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      switch (response.status) {
        case 400:
          throw new Error('Invalid API request. Check your API key and medication name.');
        case 401:
          throw new Error('Invalid API key. Please check and try again.');
        case 403:
          throw new Error('API access denied. Check your API key permissions.');
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 500:
          throw new Error('Gemini API server error. Please try again later.');
        default:
          throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log("Gemini raw response:", data);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Invalid response from Gemini API');
    }

    let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let jsonData;
    try {
      jsonData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw text:', text);
      throw new Error('Failed to parse API response. Please try again.');
    }

    if (!jsonData.alternatives || !Array.isArray(jsonData.alternatives)) {
      throw new Error('Invalid response format from API');
    }

    return { success: true, data: jsonData };

  } catch (error) {
    console.error('Error fetching alternatives:', error);
    
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request timed out. Please try again.' };
    } else if (error.message === 'Failed to fetch') {
      return { success: false, error: 'Connection failed. Please check your internet connection.' };
    }
    
    return { success: false, error: error.message || 'Failed to fetch alternatives' };
  }
};

// Handler function to be used in component
const handleFetchAlternatives = async (medication) => {
  setLoadingAlternatives(true);
  setSelectedMedication(medication);
  
  const result = await fetchMedicationAlternatives(medication);
  
  if (result.success) {
    setAlternatives(result.data);
    setShowAlternatives(true);
  } else {
    setAlternatives(result.error);
    setShowAlternatives(true);
  }
  
  setLoadingAlternatives(false);
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
    // Check if API key is configured
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

      // Call Gemini API
      const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
            text: `You are an expert Medical Transcriptionist. Analyze the uploaded prescription image. 
        Extract the following information. If any item is not visible or illegible, state 'N/A' for that field. 
        
        <OUTPUT_FORMAT>
        1) Patient Name: [Extracted Name or N/A]
        2) Medication Names: [List all names clearly separated by commas, e.g., 'Aspirin, Amoxicillin']
        3) Dosage Information: [List all dosages corresponding to medications, e.g., '500mg, 250mg']
        4) Frequency: [List all frequencies, e.g., 'Twice daily, Once at bedtime']
        5) Duration: [List all durations, e.g., '7 days, Until finished']
        6) Summary: [A small summary about the each medicine, e.g., 'Anemia, Multivitamin']
        7) Doctor Name/Signature: [Name or N/A]
        8) Date: [Extracted Date in YYYY-MM-DD format or N/A]
        9) Warnings/Contraindications: [List any explicit warnings or N/A]
        </OUTPUT_FORMAT>

        Provide ONLY the text within the <OUTPUT_FORMAT> tags.`
          },
          {
            // The image part structure is correct
            inlineData: { 
              mimeType: selectedFile.type,
              data: base64String
            }
          }
        ]
      }
    ]
  })
});

     

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        switch (response.status) {
          case 400:
            throw new Error('Invalid API request. Check your API key and image.');
          case 401:
            throw new Error('Invalid API key. Please check and try again.');
          case 403:
            throw new Error('API access denied. Check your API key permissions.');
          case 429:
            throw new Error('Too many requests. Please wait a moment and try again.');
          case 500:
            throw new Error('Gemini API server error. Please try again later.');
          default:
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }
      }

      const data = await response.json();
console.log("Gemini raw response:", data);

const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

if (!text) {
  throw new Error('Invalid response from Gemini API');
}

setAnalysisResult(text);
setShowModal(true);


    

    } catch (err) {
      console.error('Upload error:', err);

      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else if (err.message === 'Failed to fetch') {
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
          {/* <div className="flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-indigo-600" />
          </div> */}
          <div className="flex items-center justify-center mb-4">
  {/* <img 
    src="/logo.jpg"      // place your logo in public/logo.png or update path
    alt="Company Logo" 
    className="w-20 h-20 object-contain"
  />*/}
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










