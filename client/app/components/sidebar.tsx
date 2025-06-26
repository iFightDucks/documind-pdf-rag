"use client";

import { useState } from "react";
import { 
  FileText, 
  Upload, 
  Search, 
  Trash2, 
  Download,
  ChevronRight,
  Clock,
  FileIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Document {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  pages: number;
  status: 'processing' | 'ready' | 'error';
}

interface SidebarProps {
  onUploadClick: () => void;
  documents: Document[];
  onDocumentSelect: (doc: Document) => void;
  selectedDocument: Document | null;
  isLoading?: boolean;
}

export default function Sidebar({ 
  onUploadClick, 
  documents, 
  onDocumentSelect, 
  selectedDocument,
  isLoading = false 
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary" className="bg-nishta-taupe text-nishta-espresso font-space-mono text-xs">Processing</Badge>;
      case 'ready':
        return <Badge variant="default" className="bg-nishta-mocha text-nishta-cream font-space-mono text-xs">Ready</Badge>;
      case 'error':
        return <Badge variant="destructive" className="font-space-mono text-xs">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-nishta-sand dark:bg-nishta-espresso border-r border-nishta-taupe dark:border-nishta-mocha flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-nishta-taupe dark:border-nishta-mocha">
        <h2 className="text-lg font-serif text-nishta-charcoal dark:text-nishta-cream mb-4">Documents</h2>
        
        {/* Upload Button */}
        <Button 
          onClick={onUploadClick}
          className="w-full mb-4 bg-nishta-espresso hover:bg-nishta-charcoal text-nishta-cream font-space-mono text-xs"
          size="sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload PDF
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-nishta-mocha" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-nishta-cream dark:bg-nishta-charcoal border-nishta-taupe dark:border-nishta-mocha text-nishta-charcoal dark:text-nishta-cream font-space-mono text-sm placeholder:text-nishta-espresso/70"
          />
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </Card>
          ))
        ) : filteredDocs.length === 0 ? (
          // Empty state
          <div className="text-center py-8">
            <FileIcon className="h-12 w-12 text-nishta-taupe mx-auto mb-3" />
            <p className="text-nishta-espresso dark:text-nishta-taupe font-space-mono text-sm">
              {searchQuery ? "No documents found" : "No documents uploaded yet"}
            </p>
            {!searchQuery && (
              <p className="text-nishta-espresso/70 dark:text-nishta-taupe/70 font-space-mono text-xs mt-1">
                Upload a PDF to get started
              </p>
            )}
          </div>
        ) : (
          // Document list
          filteredDocs.map((doc) => (
            <Card 
              key={doc.id}
              className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                selectedDocument?.id === doc.id 
                  ? 'ring-2 ring-nishta-mocha bg-nishta-taupe/20' 
                  : 'hover:bg-nishta-cream/50 dark:hover:bg-nishta-charcoal/50'
              }`}
              onClick={() => onDocumentSelect(doc)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-nishta-mocha" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-serif text-nishta-charcoal dark:text-nishta-cream truncate">
                      {doc.name}
                    </h3>
                    <ChevronRight className="h-4 w-4 text-nishta-espresso dark:text-nishta-taupe" />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-nishta-espresso dark:text-nishta-taupe">
                    <span className="font-space-mono">{doc.size} • {doc.pages} pages</span>
                    {getStatusBadge(doc.status)}
                  </div>
                  
                  <div className="flex items-center mt-2 text-xs text-nishta-espresso/70 dark:text-nishta-taupe/70">
                    <Clock className="h-3 w-3 mr-1" />
                    <span className="font-space-mono">{doc.uploadDate}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Footer Actions */}
      {filteredDocs.length > 0 && (
        <div className="p-4 border-t border-slate-200">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 