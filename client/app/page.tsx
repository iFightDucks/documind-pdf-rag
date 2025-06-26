"use client";

import { useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Header from "./components/header";
import FileUpload from "./components/file-upload";
import DocumentWorkspace from "./components/document-workspace";
import DocumindLanding from "./components/documind-landing";

interface Document {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  pages: number;
  status: 'processing' | 'ready' | 'error';
  fileUrl?: string;
}

export default function HomePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file); // Changed from "pdf" to "file" for Python backend

      // Use Python backend endpoint
      const response = await fetch("http://localhost:3001/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Add the new document to the list using Python backend response format
      const newDocument: Document = {
        id: result.id, // Use the ID returned by Python backend
        name: result.filename,
        size: formatFileSize(result.size),
        uploadDate: new Date(result.uploaded_at).toLocaleDateString(),
        pages: result.pages || 0,
        status: result.status === 'processing' ? 'processing' : 'ready',
        fileUrl: `http://localhost:3001/api/files/${result.id}` // Use backend file serving endpoint
      };

      setDocuments(prev => [...prev, newDocument]);
      setSelectedDocument(newDocument);
      setShowUpload(false);

      // Poll for document status updates
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch(`http://localhost:3001/api/documents/${result.id}/status`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            const updatedDocument = {
              ...newDocument,
              status: statusData.status === 'completed' ? 'ready' as const : 
                      statusData.status === 'failed' ? 'error' as const : 'processing' as const,
              pages: statusData.pages || newDocument.pages
            };
            
            setDocuments(prev => 
              prev.map(doc => 
                doc.id === result.id ? updatedDocument : doc
              )
            );
            
            // Update selected document if it's the same one
            setSelectedDocument(prev => 
              prev?.id === result.id ? updatedDocument : prev
            );
            
            // Continue polling if still processing
            if (statusData.status === 'processing') {
              setTimeout(pollStatus, 2000); // Poll every 2 seconds
            }
          }
        } catch (error) {
          console.error("Status polling error:", error);
        }
      };

      // Start polling after a short delay
      setTimeout(pollStatus, 1000);

    } catch (error) {
      console.error("Upload error:", error);
      // Handle error state
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUploadClick = () => {
    setShowUpload(true);
  };

  const handleDocumentSelect = (doc: Document) => {
    setSelectedDocument(doc);
    setShowUpload(false);
  };

  return (
    <>
      <SignedOut>
        <DocumindLanding />
      </SignedOut>

      <SignedIn>
        <div className="flex flex-col min-h-screen">
          <Header />
          
          <div className="flex-1">
            {showUpload || documents.length === 0 ? (
              <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-nishta-cream dark:bg-nishta-charcoal">
                <div className="max-w-2xl w-full">
                  <div className="mb-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-nishta-charcoal dark:text-nishta-cream mb-4">
                      Upload Your PDF Document
                    </h2>
                    <p className="font-space-mono text-sm text-nishta-espresso dark:text-nishta-taupe leading-relaxed max-w-lg mx-auto">
                      Start by uploading a PDF document to begin your intelligent conversation with AI
                    </p>
                  </div>
                  
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    onUploadComplete={() => {}}
                    isUploading={isUploading}
                  />
                </div>
              </div>
            ) : (
              <div className="h-[calc(100vh-64px)]">
                <DocumentWorkspace
                  documents={documents}
                  selectedDocument={selectedDocument}
                  onDocumentSelect={handleDocumentSelect}
                  onUploadClick={handleUploadClick}
                />
      </div>
            )}
</div>
        </div>
      </SignedIn>
    </>
  );
}
