'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowUpRight, 
  Bot, 
  FileText, 
  MessageSquare, 
  Star, 
  Upload, 
  Zap,
  Instagram,
  Twitter,
  Facebook
} from 'lucide-react';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import ReactMarkdown from 'react-markdown';

// Message types
type Message = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

const Navbar = () => (
  <nav className="px-6 md:px-10 py-6 flex items-center justify-between">
    <div className="text-2xl font-serif text-nishta-charcoal tracking-wider">DOCUMIND</div>
    <div className="hidden md:flex space-x-8 font-space-mono text-xs uppercase tracking-wider text-nishta-espresso">
      <a href="#features" className="hover:text-nishta-mocha transition-colors">Features</a>
      <a href="#testimonials" className="hover:text-nishta-mocha transition-colors">Reviews</a>
      <a href="#demo" className="hover:text-nishta-mocha transition-colors">Demo</a>
      <a href="#footer" className="hover:text-nishta-mocha transition-colors">About</a>
    </div>
    <div className="flex items-center space-x-4">
      <SignInButton mode="modal">
        <button className="font-space-mono text-xs uppercase tracking-wider text-nishta-espresso hover:text-nishta-mocha transition-colors">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="font-space-mono text-xs uppercase tracking-wider bg-nishta-espresso text-nishta-cream px-4 py-2 hover:bg-nishta-charcoal transition-colors">
          Try Free
        </button>
      </SignUpButton>
    </div>
  </nav>
);

const Hero = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const router = useRouter();
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFileName(acceptedFiles[0].name);
        // This is just for demo - actual upload happens in the authenticated app
      }
    },
  });

  const handleStartChat = () => {
    // Redirect to sign up then to the workspace
    router.push('/sign-up');
  };
  
  return (
    <section className="px-6 md:px-10 pt-10 pb-20 md:py-20 bg-nishta-cream">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center">
          <motion.div 
            className="md:w-1/2 mb-10 md:mb-0 md:pr-16"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1 
              className="font-serif text-4xl md:text-6xl text-nishta-charcoal leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Chat with your documents using advanced AI
            </motion.h1>
            <motion.p 
              className="font-space-mono text-sm mt-6 text-nishta-espresso leading-relaxed max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Upload any PDF document and have an intelligent conversation with it. 
              Get insights, summaries, and answers to your questions instantly.
            </motion.p>
            <motion.div 
              className="mt-10 flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <SignUpButton mode="modal">
                <button className="px-6 py-3 bg-nishta-espresso text-nishta-cream font-space-mono text-xs uppercase tracking-wider flex items-center justify-center hover:bg-nishta-charcoal transition-colors">
                  Try for free <ArrowRight size={16} className="ml-2" />
                </button>
              </SignUpButton>
              <button 
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 border border-nishta-espresso text-nishta-espresso font-space-mono text-xs uppercase tracking-wider flex items-center justify-center hover:bg-nishta-espresso hover:text-nishta-cream transition-colors"
              >
                View demo
              </button>
            </motion.div>
          </motion.div>
          <motion.div 
            className="md:w-1/2 aspect-[4/5] bg-nishta-sand p-8 flex flex-col items-center justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div {...getRootProps()} className="w-full h-full border-2 border-dashed border-nishta-mocha/30 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-nishta-mocha transition-colors p-6">
              <input {...getInputProps()} />
              <FileText size={48} className="text-nishta-mocha mb-4" />
              {fileName ? (
                <div className="text-center">
                  <p className="font-space-mono text-xs text-nishta-espresso mb-2">File selected:</p>
                  <p className="font-space-mono text-sm text-nishta-mocha font-bold">{fileName}</p>
                  <button 
                    onClick={handleStartChat}
                    className="mt-4 px-4 py-2 bg-nishta-espresso text-nishta-cream font-space-mono text-xs rounded-md flex items-center justify-center hover:bg-nishta-charcoal transition-colors"
                  >
                    Start Chat <MessageSquare size={14} className="ml-2" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-space-mono text-sm text-nishta-mocha mb-2">Drag & drop your PDF here</p>
                  <p className="font-space-mono text-xs text-nishta-espresso">or click to browse files</p>
                  <p className="font-space-mono text-xs text-nishta-espresso/70 mt-2">(Demo only - sign up to actually upload)</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Features = () => (
  <section id="features" className="px-6 md:px-10 py-20 bg-white">
    <div className="max-w-6xl mx-auto">
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="font-serif text-3xl md:text-4xl text-nishta-charcoal">Intelligent document interactions</h2>
        <p className="font-space-mono text-sm mt-4 text-nishta-espresso max-w-xl mx-auto">
          Transform your relationship with documents through AI-powered conversations
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <motion.div 
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="h-60 w-full bg-nishta-cream flex items-center justify-center mb-6 rounded-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-nishta-mocha">
              <Upload size={40} strokeWidth={1.5} />
            </div>
          </motion.div>
          <h3 className="font-serif text-xl text-nishta-charcoal">Simple Upload</h3>
          <p className="font-space-mono text-xs mt-3 text-nishta-espresso leading-relaxed max-w-xs">
            Drag and drop any PDF document to start your conversation instantly. No preprocessing required.
          </p>
        </motion.div>
        
        <motion.div 
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="h-60 w-full bg-nishta-cream flex items-center justify-center mb-6 rounded-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-nishta-mocha">
              <Bot size={40} strokeWidth={1.5} />
            </div>
          </motion.div>
          <h3 className="font-serif text-xl text-nishta-charcoal">AI-Powered Chat</h3>
          <p className="font-space-mono text-xs mt-3 text-nishta-espresso leading-relaxed max-w-xs">
            Ask questions in natural language and receive intelligent responses based on your document's content
          </p>
        </motion.div>        
        <motion.div 
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="h-60 w-full bg-nishta-cream flex items-center justify-center mb-6 rounded-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-nishta-mocha">
              <Zap size={40} strokeWidth={1.5} />
            </div>
          </motion.div>
          <h3 className="font-serif text-xl text-nishta-charcoal">Instant Insights</h3>
          <p className="font-space-mono text-xs mt-3 text-nishta-espresso leading-relaxed max-w-xs">
            Get summaries, extract key information, and discover insights hidden within your documents
          </p>
        </motion.div>
      </div>

      <div className="mt-20 text-center">
        <SignUpButton mode="modal">
          <button className="inline-flex items-center font-space-mono text-xs uppercase tracking-wider text-nishta-espresso hover:text-nishta-mocha transition-colors">
            Start using DocuMind today <ArrowUpRight size={14} className="ml-2" />
          </button>
        </SignUpButton>
      </div>
    </div>
  </section>
);

const Testimonials = () => (
  <section id="testimonials" className="px-6 md:px-10 py-20 bg-nishta-taupe/20">
    <div className="max-w-6xl mx-auto">
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="font-serif text-3xl md:text-4xl text-nishta-charcoal">What users are saying</h2>
        <p className="font-space-mono text-sm mt-4 text-nishta-espresso max-w-xl mx-auto">
          Discover how DocuMind is transforming document analysis and research
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            name: "Sarah K.",
            role: "Research Analyst",
            text: "DocuMind has revolutionized my research process. I can upload lengthy academic papers and extract insights through conversation in minutes instead of hours.",
            since: "User since 2024"
          },
          {
            name: "Michael T.",
            role: "Legal Consultant",
            text: "As someone who reviews contracts daily, this tool is invaluable. I can query complex legal documents and get precise answers without having to manually search through pages.",
            since: "User since 2023"
          },
          {
            name: "Jennifer L.",
            role: "PhD Student",
            text: "The ability to have a conversation with my research papers has accelerated my literature review process dramatically. DocuMind understands context and makes connections I might have missed.",
            since: "User since 2024"
          }
        ].map((testimonial, i) => (
          <motion.div 
            key={i} 
            className="bg-white p-8 flex flex-col rounded-lg shadow-sm"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-nishta-sand flex items-center justify-center mr-4">
                <div className="text-nishta-mocha font-space-mono text-[10px]">Photo</div>
              </div>
              <div>
                <h4 className="font-serif text-nishta-charcoal">{testimonial.name}</h4>
                <p className="font-space-mono text-xs text-nishta-mocha">{testimonial.role}</p>
              </div>
            </div>
            <div className="flex mb-4">
              {[...Array(5)].map((_, j) => (
                <Star key={j} size={14} fill="#8C7A5B" color="#8C7A5B" />
              ))}
            </div>
            <p className="font-space-mono text-xs text-nishta-espresso leading-relaxed flex-grow">
              "{testimonial.text}"
            </p>
            <p className="font-space-mono text-xs text-nishta-mocha mt-4">{testimonial.since}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const DemoChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'ve analyzed your financial report. How can I help you understand it better?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const suggestedQuestions = [
    "What was the revenue growth?",
    "Show me profit margins",
    "What's the Q4 forecast?"
  ];
  
  const handleSendMessage = (messageText?: string) => {
    const messageToSend = messageText || input;
    if (messageToSend.trim()) {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: messageToSend,
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsTyping(true);
      
      // Frontend demo - simulated AI response
      setTimeout(() => {
        setIsTyping(false);
        let response = "Based on the financial report you uploaded, Q3 revenue increased by 18% compared to Q2, largely driven by the new product line. The profit margin also improved by 3.5 percentage points. Would you like me to provide more details on any specific section?";
        
        if (messageToSend.toLowerCase().includes("revenue")) {
          response = "The revenue breakdown shows strongest growth in the Enterprise segment (24%), followed by SMB (15%) and Consumer (12%). International markets outperformed domestic by 7 percentage points.";
        } else if (messageToSend.toLowerCase().includes("profit") || messageToSend.toLowerCase().includes("margin")) {
          response = "Profit margins improved across all product lines. The new premium tier had the highest margin at 42%, while standard offerings maintained 28-32% margins. Cost reduction initiatives contributed approximately 1.8% to margin improvement.";
        } else if (messageToSend.toLowerCase().includes("forecast") || messageToSend.toLowerCase().includes("prediction")) {
          response = "The Q4 forecast predicts continued growth at 12-15%, with seasonal factors likely boosting the Consumer segment by an additional 8-10%. The report suggests maintaining the current strategy with increased marketing in high-performing regions.";
        }        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }, 2000);
    }
  };
  
  return (
    <section id="demo" className="px-6 md:px-10 py-24 bg-nishta-espresso text-nishta-cream">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h2 className="font-serif text-3xl md:text-5xl leading-tight">Intuitive conversations with your documents</h2>
          <p className="font-space-mono text-sm mt-6 leading-relaxed max-w-md">
            Upload your PDF and start asking questions immediately. Our AI understands context, remembers previous questions, and provides accurate insights.
          </p>
          <div className="mt-8">
            <SignUpButton mode="modal">
              <button className="px-6 py-3 bg-nishta-cream text-nishta-espresso font-space-mono text-xs uppercase tracking-wider flex items-center justify-center hover:bg-nishta-sand transition-colors">
                Get Started Now <ArrowRight size={16} className="ml-2" />
              </button>
            </SignUpButton>
          </div>
        </div>
        
        <div className="md:w-1/2 max-w-md">
          <div className="bg-nishta-charcoal rounded-lg overflow-hidden shadow-lg">
            <div className="p-4 border-b border-nishta-espresso flex items-center">
              <FileText size={18} className="mr-2" />
              <span className="font-space-mono text-xs">Financial_Report_2024.pdf</span>
            </div>            
            <div className="h-80 overflow-y-auto p-4 flex flex-col space-y-4">
              {messages.map(message => (
                <motion.div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div 
                    className={`max-w-xs rounded-lg p-3 ${
                      message.sender === 'user' 
                        ? 'bg-nishta-mocha text-nishta-cream rounded-br-none' 
                        : 'bg-nishta-taupe text-nishta-charcoal rounded-bl-none'
                    }`}
                  >
                    <ReactMarkdown components={{
                      p: ({...props}) => <p className="font-space-mono text-xs whitespace-pre-wrap" {...props} />
                    }}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div 
                  className="flex justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="bg-nishta-taupe text-nishta-charcoal rounded-lg p-3 rounded-bl-none">
                    <div className="flex space-x-1">
                      <motion.div 
                        className="w-2 h-2 bg-nishta-mocha rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div 
                        className="w-2 h-2 bg-nishta-mocha rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div 
                        className="w-2 h-2 bg-nishta-mocha rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            <div className="p-4 border-t border-nishta-espresso">
              <div className="flex mb-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your document..."
                  className="flex-grow bg-nishta-charcoal border border-nishta-espresso rounded-md p-2 text-nishta-cream font-space-mono text-xs focus:outline-none focus:border-nishta-mocha"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  onClick={() => handleSendMessage()}
                  className="ml-2 p-2 bg-nishta-mocha text-nishta-cream rounded-md hover:bg-nishta-taupe hover:text-nishta-charcoal transition-colors"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(question)}
                    className="px-3 py-1 bg-nishta-espresso/20 text-nishta-cream font-space-mono text-xs rounded-full hover:bg-nishta-espresso/40 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer id="footer" className="px-6 md:px-10 pt-16 pb-8 bg-nishta-charcoal text-nishta-taupe">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between pb-12 border-b border-nishta-espresso">
        <div className="mb-10 md:mb-0">
          <div className="text-2xl font-serif text-nishta-cream tracking-wider mb-6">DOCUMIND</div>
          <p className="font-space-mono text-xs max-w-xs leading-relaxed">
            Transform the way you interact with documents. Our AI-powered chat interface makes document analysis intuitive and efficient.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-serif text-nishta-cream mb-4">Product</h4>
            <ul className="font-space-mono text-xs space-y-2">
              <li><a href="#features" className="hover:text-nishta-cream transition-colors">Features</a></li>
              <li><SignUpButton mode="modal"><button className="hover:text-nishta-cream transition-colors text-left">Pricing</button></SignUpButton></li>
              <li><a href="#" className="hover:text-nishta-cream transition-colors">Enterprise</a></li>
              <li><a href="#" className="hover:text-nishta-cream transition-colors">API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif text-nishta-cream mb-4">About</h4>
            <ul className="font-space-mono text-xs space-y-2">
              <li><a href="#" className="hover:text-nishta-cream transition-colors">Our story</a></li>
              <li><a href="#" className="hover:text-nishta-cream transition-colors">Team</a></li>
              <li><a href="#" className="hover:text-nishta-cream transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-nishta-cream transition-colors">Blog</a></li>
            </ul>
          </div>          
          <div>
            <h4 className="font-serif text-nishta-cream mb-4">Support</h4>
            <ul className="font-space-mono text-xs space-y-2">
              <li><a href="#" className="hover:text-nishta-cream transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-nishta-cream transition-colors">FAQs</a></li>
              <li><a href="#" className="hover:text-nishta-cream transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-nishta-cream transition-colors">Contact us</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif text-nishta-cream mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-nishta-taupe hover:text-nishta-cream transition-colors">
                <Instagram size={20} strokeWidth={1.5} />
              </a>
              <a href="#" className="text-nishta-taupe hover:text-nishta-cream transition-colors">
                <Twitter size={20} strokeWidth={1.5} />
              </a>
              <a href="#" className="text-nishta-taupe hover:text-nishta-cream transition-colors">
                <Facebook size={20} strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-8 flex flex-col md:flex-row justify-between items-center">
        <p className="font-space-mono text-xs mb-4 md:mb-0">© 2024 DocuMind. All rights reserved.</p>
        <div className="flex space-x-6 font-space-mono text-xs">
          <a href="#" className="hover:text-nishta-cream transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-nishta-cream transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-nishta-cream transition-colors">Security</a>
        </div>
      </div>
    </div>
  </footer>
);

export default function DocumindLanding() {
  return (
    <div className="min-h-screen bg-white text-nishta-charcoal">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <DemoChat />
      </main>
      <Footer />
    </div>
  );
}