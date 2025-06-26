"use client";

import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  MessageSquare, 
  Settings, 
  LayoutPanelLeft,
  Eye,
  EyeOff
} from "lucide-react";
import PDFViewer from "./pdf-viewer";
import Chat from "./chat";
import Sidebar from "./sidebar";

interface Document {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  pages: number;
  status: 'processing' | 'ready' | 'error';
  fileUrl?: string;
}

interface DocumentWorkspaceProps {
  documents: Document[];
  selectedDocument: Document | null;
  onDocumentSelect: (doc: Document) => void;
  onUploadClick: () => void;
}

export default function DocumentWorkspace({
  documents,
  selectedDocument,
  onDocumentSelect,
  onUploadClick,
}: DocumentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState("viewer");
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col bg-nishta-cream dark:bg-nishta-charcoal"
    >
      {/* Workspace Header */}
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center justify-between p-4 bg-nishta-sand dark:bg-nishta-espresso border-b border-nishta-taupe dark:border-nishta-mocha flex-shrink-0"
      >
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <motion.div
                animate={{ rotate: showSidebar ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                <LayoutPanelLeft className="h-4 w-4 mr-2" />
              </motion.div>
              {showSidebar ? "Hide" : "Show"} Sidebar
            </Button>
          </motion.div>

          <AnimatePresence>
            {selectedDocument && (
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="flex items-center space-x-2"
              >
                <div className="h-6 w-px bg-nishta-taupe dark:bg-nishta-mocha" />
                <div className="flex items-center space-x-2">
                  <motion.div
                    animate={{ 
                      scale: selectedDocument.status === 'ready' ? [1, 1.1, 1] : 1
                    }}
                    transition={{ duration: 1, repeat: selectedDocument.status === 'ready' ? 3 : 0 }}
                    className={selectedDocument.status === 'ready' ? 'text-primary' : 'text-muted-foreground'}
                  >
                    <FileText className="h-4 w-4" />
                  </motion.div>
                  <span className="text-sm font-serif text-nishta-charcoal dark:text-nishta-cream">
                    {selectedDocument.name}
                  </span>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <Badge 
                      variant={selectedDocument.status === 'ready' ? 'default' : 'secondary'}
                      className={selectedDocument.status === 'ready' ? 'bg-nishta-mocha text-nishta-cream font-space-mono' : 'bg-nishta-taupe text-nishta-espresso font-space-mono'}
                    >
                      {selectedDocument.status}
                    </Badge>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex items-center space-x-2"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <TabsTrigger value="viewer" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Viewer
                </TabsTrigger>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <TabsTrigger value="both" className="flex items-center gap-2">
                  <LayoutPanelLeft className="h-4 w-4" />
                  Both
                </TabsTrigger>
              </motion.div>
            </TabsList>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex-1 min-h-0"
      >
        <PanelGroup direction="horizontal" className="h-full">
          {/* Sidebar Panel */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                key="sidebar"
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex"
              >
                <Panel defaultSize={25} minSize={20} maxSize={40}>
                  <Sidebar
                    onUploadClick={onUploadClick}
                    documents={documents}
                    onDocumentSelect={onDocumentSelect}
                    selectedDocument={selectedDocument}
                  />
                </Panel>
                <PanelResizeHandle className="w-2 bg-border hover:bg-border/80 transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Panel */}
          <Panel defaultSize={showSidebar ? 75 : 100} minSize={30}>
            <Tabs value={activeTab} className="h-full flex flex-col">
              {/* Viewer Only */}
              <TabsContent value="viewer" className="flex-1 m-0 h-full">
                <motion.div
                  key="viewer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <PDFViewer
                    fileUrl={selectedDocument?.fileUrl}
                    fileName={selectedDocument?.name}
                    onPageChange={handlePageChange}
                    className="h-full"
                  />
                </motion.div>
              </TabsContent>

              {/* Chat Only */}
              <TabsContent value="chat" className="flex-1 m-0 h-full">
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Chat
                    documentId={selectedDocument?.id}
                    isDocumentReady={selectedDocument?.status === 'ready'}
                  />
                </motion.div>
              </TabsContent>

              {/* Both Viewer and Chat */}
              <TabsContent value="both" className="flex-1 m-0 h-full">
                <motion.div
                  key="both"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <PanelGroup direction="horizontal" className="h-full">
                    <Panel defaultSize={60} minSize={35}>
                      <PDFViewer
                        fileUrl={selectedDocument?.fileUrl}
                        fileName={selectedDocument?.name}
                        onPageChange={handlePageChange}
                        className="h-full"
                      />
                    </Panel>
                    
                    <PanelResizeHandle className="w-2 bg-border hover:bg-border/80 transition-colors" />
                    
                    <Panel defaultSize={40} minSize={30}>
                      <Chat
                        documentId={selectedDocument?.id}
                        isDocumentReady={selectedDocument?.status === 'ready'}
                      />
                    </Panel>
                  </PanelGroup>
                </motion.div>
              </TabsContent>
            </Tabs>
          </Panel>
        </PanelGroup>
      </motion.div>

      {/* Status Bar */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="bg-card border-t border-border px-4 py-2 flex-shrink-0"
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <motion.span
              key={documents.length}
              initial={{ scale: 1.2, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              Documents: {documents.length}
            </motion.span>
            <AnimatePresence>
              {selectedDocument && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center space-x-4"
                >
                  <span>•</span>
                  <span>Current: {selectedDocument.name}</span>
                  <span>•</span>
                  <motion.span
                    key={currentPage}
                    initial={{ scale: 1.2, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    Page: {currentPage}
                  </motion.span>
                  <span>•</span>
                  <span>Size: {selectedDocument.size}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.span
              key={activeTab}
              initial={{ scale: 1.1, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              View: {activeTab}
            </motion.span>
            <span>•</span>
            <motion.span
              key={showSidebar}
              initial={{ scale: 1.1, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              Panels: {showSidebar ? 'With Sidebar' : 'Full Width'}
            </motion.span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 