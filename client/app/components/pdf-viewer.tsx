"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Download,
  Maximize2,
  Minimize2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFViewerProps {
  fileUrl?: string;
  fileName?: string;
  onPageChange?: (page: number) => void;
  className?: string;
}

export default function PDFViewer({ 
  fileUrl, 
  fileName, 
  onPageChange,
  className = "" 
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reset loading state when fileUrl changes
  useEffect(() => {
    console.log("PDF Viewer fileUrl changed:", { fileUrl, fileName });
    if (fileUrl) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoading(false);
      setError(null);
      setNumPages(0);
    }
  }, [fileUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log("PDF loaded successfully:", { numPages, fileUrl });
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF loading error:", { error, fileUrl });
    setError("Failed to load PDF document");
    setIsLoading(false);
    toast.error("Failed to load PDF document");
  };

  const goToPrevPage = () => {
    const newPage = Math.max(1, pageNumber - 1);
    setPageNumber(newPage);
    onPageChange?.(newPage);
  };

  const goToNextPage = () => {
    const newPage = Math.min(numPages, pageNumber + 1);
    setPageNumber(newPage);
    onPageChange?.(newPage);
  };

  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(numPages, page));
    setPageNumber(newPage);
    onPageChange?.(newPage);
  };

  const zoomIn = () => setScale(prev => Math.min(3.0, prev + 0.25));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.25));
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  const downloadPDF = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'document.pdf';
      link.click();
      toast.success("Download started");
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!fileUrl) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col items-center justify-center h-full bg-nishta-cream dark:bg-nishta-charcoal border border-nishta-taupe/20 dark:border-nishta-kraft/20 rounded-lg ${className}`}
      >
        <div className="text-center p-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 text-nishta-mocha dark:text-nishta-taupe"
          >
            <Loader2 className="w-full h-full" />
          </motion.div>
          <h3 className="text-lg font-serif text-nishta-charcoal dark:text-nishta-cream mb-2">No Document Selected</h3>
          <p className="font-space-mono text-sm text-nishta-espresso dark:text-nishta-taupe">Select a PDF document from the sidebar to view it here</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col h-full bg-nishta-cream dark:bg-nishta-charcoal border border-nishta-taupe/20 dark:border-nishta-kraft/20 rounded-lg ${className}`}
    >
      {/* Toolbar */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex items-center justify-between p-4 border-b border-nishta-taupe/20 dark:border-nishta-kraft/20 bg-nishta-sand/50 dark:bg-nishta-espresso/30 flex-shrink-0"
      >
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className="bg-nishta-cream dark:bg-nishta-charcoal border-nishta-kraft dark:border-nishta-taupe text-nishta-espresso dark:text-nishta-sand font-space-mono text-xs"
          >
            {fileName || "document.pdf"}
          </Badge>
          <AnimatePresence>
            {numPages > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Badge 
                  variant="secondary"
                  className="bg-nishta-mocha/20 dark:bg-nishta-kraft/20 text-nishta-espresso dark:text-nishta-cream font-space-mono text-xs"
                >
                  {numPages} pages
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex items-center space-x-2"
        >
          {/* Page Navigation */}
          <div className="flex items-center space-x-1">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="bg-nishta-cream dark:bg-nishta-charcoal border-nishta-kraft dark:border-nishta-taupe text-nishta-espresso dark:text-nishta-sand hover:bg-nishta-sand dark:hover:bg-nishta-espresso disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </motion.div>
            
            <div className="flex items-center space-x-1">
              <Input
                type="number"
                value={pageNumber}
                onChange={(e) => goToPage(parseInt(e.target.value))}
                className="w-16 h-8 text-center bg-nishta-cream dark:bg-nishta-charcoal border-nishta-kraft dark:border-nishta-taupe text-nishta-espresso dark:text-nishta-sand font-space-mono text-sm"
                min={1}
                max={numPages || 1}
              />
              <span className="font-space-mono text-sm text-nishta-espresso dark:text-nishta-taupe">
                of {numPages || 0}
              </span>
            </div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={!numPages || pageNumber >= numPages}
                className="bg-nishta-cream dark:bg-nishta-charcoal border-nishta-kraft dark:border-nishta-taupe text-nishta-espresso dark:text-nishta-sand hover:bg-nishta-sand dark:hover:bg-nishta-espresso disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={scale <= 0.5}
                className="bg-nishta-cream dark:bg-nishta-charcoal border-nishta-kraft dark:border-nishta-taupe text-nishta-espresso dark:text-nishta-sand hover:bg-nishta-sand dark:hover:bg-nishta-espresso disabled:opacity-50"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </motion.div>
            
            <motion.span 
              key={scale}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="font-space-mono text-sm text-nishta-espresso dark:text-nishta-taupe px-2 font-medium min-w-[3rem] text-center"
            >
              {Math.round(scale * 100)}%
            </motion.span>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={scale >= 3.0}
                className="bg-nishta-cream dark:bg-nishta-charcoal border-nishta-kraft dark:border-nishta-taupe text-nishta-espresso dark:text-nishta-sand hover:bg-nishta-sand dark:hover:bg-nishta-espresso disabled:opacity-50"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95, rotate: 90 }}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={rotate}
              className="bg-nishta-cream dark:bg-nishta-charcoal border-nishta-kraft dark:border-nishta-taupe text-nishta-espresso dark:text-nishta-sand hover:bg-nishta-sand dark:hover:bg-nishta-espresso"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadPDF}
              className="bg-nishta-cream dark:bg-nishta-charcoal border-nishta-kraft dark:border-nishta-taupe text-nishta-espresso dark:text-nishta-sand hover:bg-nishta-sand dark:hover:bg-nishta-espresso"
            >
              <Download className="h-4 w-4" />
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleFullscreen}
              className="bg-nishta-cream dark:bg-nishta-charcoal border-nishta-kraft dark:border-nishta-taupe text-nishta-espresso dark:text-nishta-sand hover:bg-nishta-sand dark:hover:bg-nishta-espresso"
            >
              <AnimatePresence mode="wait">
                {isFullscreen ? (
                  <motion.div
                    key="minimize"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="maximize"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* PDF Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 flex justify-center min-h-full bg-nishta-sand/30 dark:bg-nishta-espresso/20">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 flex flex-col items-center"
              >
                <div className="space-y-4">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.02, 1],
                      opacity: [0.5, 1, 0.5] 
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    <Skeleton className="w-96 h-96 rounded-lg bg-nishta-taupe/20 dark:bg-nishta-kraft/20" />
                  </motion.div>
                  <div className="text-center">
                    <motion.div className="flex items-center justify-center space-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-4 w-4 text-nishta-mocha dark:text-nishta-taupe" />
                      </motion.div>
                      <p className="font-space-mono text-sm text-nishta-espresso dark:text-nishta-taupe">Loading PDF...</p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="p-8 bg-nishta-cream dark:bg-nishta-charcoal border-nishta-kraft/30 dark:border-nishta-taupe/30">
                  <div className="text-center">
                    <motion.div 
                      className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mx-auto mb-4"
                      animate={{ 
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <span className="text-2xl">❌</span>
                    </motion.div>
                    <h3 className="text-lg font-serif text-nishta-charcoal dark:text-nishta-cream mb-2">
                      Error Loading PDF
                    </h3>
                    <p className="font-space-mono text-sm text-nishta-espresso dark:text-nishta-taupe">{error}</p>
                  </div>
                </Card>
              </motion.div>
            )}

            {!error && !isLoading && (
              <motion.div
                key={`page-${pageNumber}-${scale}-${rotation}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center"
              >
                <Document
                  file={fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                  className="flex justify-center"
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-xl rounded-lg overflow-hidden border border-nishta-kraft/20 dark:border-nishta-taupe/20"
                  />
                </Document>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Status Bar */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="px-4 py-2 border-t border-nishta-taupe/20 dark:border-nishta-kraft/20 bg-nishta-sand/30 dark:bg-nishta-espresso/20 flex-shrink-0"
      >
        <div className="flex items-center justify-between font-space-mono text-xs text-nishta-espresso dark:text-nishta-taupe">
          <motion.span
            key={`page-${pageNumber}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            Page {pageNumber} of {numPages || 0}
          </motion.span>
          <motion.span
            key={`zoom-${scale}-rotation-${rotation}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            Zoom: {Math.round(scale * 100)}% • Rotation: {rotation}°
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
} 