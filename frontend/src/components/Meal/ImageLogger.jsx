import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, X, AlertCircle, Camera } from 'lucide-react';
import Webcam from 'react-webcam';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment"
};

const CameraModal = ({ onCapture, onClose }) => {
  const webcamRef = useRef(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    onCapture(imageSrc);
  }, [webcamRef, onCapture]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="relative bg-slate-800 p-4 rounded-lg shadow-xl">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="rounded-md"
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-x-4">
           <button onClick={capture} className="p-4 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-colors">
            <Camera size={24} />
          </button>
        </div>
        <button onClick={onClose} className="absolute top-2 right-2 p-2 bg-slate-900/60 text-white rounded-full hover:bg-slate-950/80 transition-colors">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export const ImageLogger = ({ mealType, date, onMealLogged, showToast }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      showToast('Please select a valid image file (PNG/JPG)', 'error');
    }
  };

  const onFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('date', date);
    formData.append('meal_type', mealType);

    try {
      await onMealLogged({
        formData,
        isImage: true
      });
      clearSelection();
    } catch (err) {
      console.error('Image analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCapture = (imageSrc) => {
    const byteString = atob(imageSrc.split(',')[1]);
    const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
    handleFileChange(file);
    setIsCameraOpen(false);
  };


  return (
    <div className="flex flex-col items-center py-4">
       {isCameraOpen && <CameraModal onCapture={handleCapture} onClose={() => setIsCameraOpen(false)} />}
      {!previewUrl ? (
        <div className="w-full max-w-md">
          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            className={`w-full p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/15'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileSelect}
              accept="image/*"
              className="hidden"
            />
            <UploadCloud className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-3" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
              Drag and drop food image
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-400">
              or click to browse from files
            </p>
          </div>
          <div className="relative flex items-center justify-center my-4">
            <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-400 dark:text-slate-500">OR</span>
            <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
          </div>
           {/* Camera Button */}
           <button
            onClick={() => setIsCameraOpen(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center"
          >
            <Camera className="w-5 h-5 mr-2.5" />
            Take Photo
          </button>
        </div>
      ) : (
        // Preview Screen
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
            <img src={previewUrl} alt="Meal Preview" className="w-full h-full object-cover" />
            
            {!loading && (
              <button
                onClick={clearSelection}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-950/80 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-5 py-3 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2.5 animate-spin" />
                Gemini Vision analyzing...
              </>
            ) : (
              'Scan Food & Log Meal'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageLogger;
