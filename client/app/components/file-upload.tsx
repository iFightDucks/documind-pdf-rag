"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onUploadComplete: (response: any) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export default function FileUpload({ 
  onFileSelect, 
  onUploadComplete, 
  isUploading = false,
  uploadProgress = 0 
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      toast.error("Please upload only PDF files");
      return;
    }

    if (pdfFiles.length > 1) {
      toast.error("Please upload one PDF file at a time");
      return;
    }

    const file = pdfFiles[0];
    
    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    // Add to uploading files
    const uploadingFile: UploadingFile = {
      file,
      progress: 0,
      status: 'uploading'
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);
    onFileSelect(file);
    
    toast.success(`Started uploading ${file.name}`);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: isUploading
  });

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-4 w-4 text-primary" />
          </motion.div>
        );
      case 'processing':
        return (
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Loader2 className="h-4 w-4 text-amber-500" />
          </motion.div>
        );
      case 'complete':
        return (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, ease: "backOut" }}
          >
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, -5, 5, 0]
            }}
            transition={{ duration: 0.5 }}
          >
            <AlertCircle className="h-4 w-4 text-destructive" />
          </motion.div>
        );
      default:
        return null;
    }
  };

  const getStatusText = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Error';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <motion.div
        whileHover={{ scale: isDragActive ? 1.02 : 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          {...getRootProps()} 
          className={`
            p-8 border-2 border-dashed cursor-pointer transition-all duration-300 bg-nishta-sand dark:bg-nishta-espresso
            ${isDragActive && !isDragReject 
              ? 'border-nishta-mocha bg-nishta-taupe/20 shadow-lg' 
              : isDragReject 
              ? 'border-destructive bg-destructive/5'
              : 'border-nishta-mocha/30 hover:border-nishta-mocha hover:bg-nishta-taupe/10'
            }
            ${isUploading ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
        <input {...getInputProps()} />
        
        <div className="text-center">
          <motion.div
            animate={{ 
              scale: isDragActive ? 1.2 : 1,
              rotate: isDragActive ? [0, 5, -5, 0] : 0,
              y: isDragActive ? -5 : 0
            }}
            transition={{ 
              duration: isDragActive ? 0.6 : 0.3,
              ease: "easeInOut"
            }}
          >
            <Upload className={`
              h-12 w-12 mx-auto mb-4 transition-colors duration-300
              ${isDragActive && !isDragReject 
                ? 'text-nishta-mocha' 
                : isDragReject 
                ? 'text-destructive'
                : 'text-nishta-mocha'
              }
            `} />
          </motion.div>
          
          <motion.h3 
            className={`text-lg font-serif mb-2 ${
              isDragActive && !isDragReject ? 'text-nishta-charcoal dark:text-nishta-cream' : 'text-nishta-charcoal dark:text-nishta-cream'
            }`}
          >
            {isDragActive && !isDragReject
              ? 'Drop your PDF here'
              : isDragReject
              ? 'Only PDF files are allowed'
              : 'Upload your PDF document'
            }
          </motion.h3>
          
          <motion.p 
            initial={{ opacity: 0.7 }}
            animate={{ opacity: isDragActive ? 1 : 0.7 }}
            className="font-space-mono text-sm text-nishta-espresso dark:text-nishta-taupe mb-4"
          >
            Drag and drop your PDF file here, or click to browse
          </motion.p>
          
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex items-center justify-center space-x-4 text-xs"
          >
            <motion.div whileHover={{ scale: 1.05 }}>
              <Badge variant="outline" className="bg-nishta-taupe/20 text-nishta-espresso border-nishta-mocha/30 font-space-mono">PDF only</Badge>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Badge variant="outline" className="bg-nishta-taupe/20 text-nishta-espresso border-nishta-mocha/30 font-space-mono">Max 50MB</Badge>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Badge variant="outline" className="bg-nishta-taupe/20 text-nishta-espresso border-nishta-mocha/30 font-space-mono">Single file</Badge>
            </motion.div>
          </motion.div>
          
          {!isUploading && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="mt-4" size="sm">
                Choose File
              </Button>
            </motion.div>
          )}
        </div>
      </Card>
      </motion.div>

      {/* Uploading Files */}
      <AnimatePresence>
        {uploadingFiles.map((uploadingFile, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-4 bg-card border-border">
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ 
                      scale: uploadingFile.status === 'complete' ? [1, 1.1, 1] : 1,
                      rotate: uploadingFile.status === 'processing' ? [0, 5, -5, 0] : 0
                    }}
                    transition={{ duration: 0.6, repeat: uploadingFile.status === 'complete' ? 3 : 0 }}
                  >
                    <FileText className="h-8 w-8 text-nishta-mocha flex-shrink-0" />
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <motion.h4 
                        className="text-sm font-serif text-nishta-charcoal dark:text-nishta-cream truncate"
                        animate={{ 
                          color: uploadingFile.status === 'complete' 
                            ? "var(--nishta-mocha)" 
                            : "var(--nishta-charcoal)"
                        }}
                      >
                        {uploadingFile.file.name}
                      </motion.h4>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(uploadingFile.status)}
                        <motion.span 
                          className="text-xs font-space-mono text-nishta-espresso dark:text-nishta-taupe"
                          animate={{ 
                            opacity: uploadingFile.status === 'uploading' ? [0.5, 1, 0.5] : 1
                          }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: uploadingFile.status === 'uploading' ? Infinity : 0 
                          }}
                        >
                          {getStatusText(uploadingFile.status)}
                        </motion.span>
                        {uploadingFile.status !== 'uploading' && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUploadingFile(index)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{formatFileSize(uploadingFile.file.size)}</span>
                      <motion.span
                        key={uploadingFile.progress}
                        initial={{ scale: 1.2, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {uploadingFile.progress}%
                      </motion.span>
                    </div>
                    
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5 }}
                      style={{ originX: 0 }}
                    >
                      <Progress value={uploadingFile.progress} className="h-2" />
                    </motion.div>
                    
                    <AnimatePresence>
                      {uploadingFile.error && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-xs text-destructive mt-2"
                        >
                          {uploadingFile.error}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
      </div>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
