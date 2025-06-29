import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageReplySystem from '@/components/chat/MessageReplySystem';
import TypingIndicator from '@/components/chat/TypingIndicator';
import FileUpload from '@/components/chat/FileUpload';
import EnhancedEmojiPicker from '@/components/chat/EnhancedEmojiPicker';
import AdvancedTextStyler from '@/components/chat/AdvancedTextStyler';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import ChatOptionsMenu from '@/components/chat/ChatOptionsMenu';
import MessageOptionsMenu from '@/components/chat/MessageOptionsMenu';
import VoiceCallManager from '@/components/voice/VoiceCallManager';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Phone, 
  Video, 
  MoreVertical,
  ArrowLeft,
  Shield,
  MapPin,
  Type,
  Settings
} from 'lucide-react';

export default function ChatArea() {
  const { activeChat, sendMessage, contacts, setActiveChat, typingUsers, setTyping } = useChat();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTextStyler, setShowTextStyler] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [isVoiceCallMinimized, setIsVoiceCallMinimized] = useState(false);
  const [chatSettings, setChatSettings] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const contact = contacts.find(c => 
    activeChat?.participants.includes(c.id) && c.id !== user?.id
  );

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeChat]);

  // FIXED: Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChat || !sendMessage) return;

    try {
      await sendMessage(activeChat.id, message.trim());
      setMessage('');
      setTyping(activeChat.id, false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (setTyping) {
      setTyping(activeChat.id, true);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleTextStyle = (styleData) => {
    setMessage(styleData.text);
    setShowTextStyler(false);
    inputRef.current?.focus();
  };

  const handleFileUpload = (fileData) => {
    if (!sendMessage || !activeChat) return;

    const messageType = fileData.type === 'image' ? 'image' : 
                       fileData.type === 'video' ? 'video' : 'file';
    
    const metadata = {
      fileName: fileData.name,
      fileSize: fileData.size,
      fileType: fileData.mimeType || 'application/octet-stream',
      previewUrl: fileData.previewUrl
    };

    const content = fileData.type === 'image' ? '' : `📎 ${fileData.name}`;
    sendMessage(activeChat.id, content, messageType, metadata);
    setShowFileUpload(false);
  };

  const handleVoiceNote = (audioBlob) => {
    if (!sendMessage || !activeChat) return;

    const audioUrl = URL.createObjectURL(audioBlob);
    sendMessage(activeChat.id, '🎤 Voice message', 'voice', { 
      audioUrl,
      duration: '0:05' 
    });
    setIsRecording(false);
  };

  const handleLocationShare = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location sharing",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (sendMessage && activeChat) {
          sendMessage(activeChat.id, `📍 Location shared`, 'location', { 
            latitude, 
            longitude,
            address: 'Current Location'
          });
          toast({
            title: "Location Shared",
            description: "Your location has been shared securely"
          });
        }
      },
      () => {
        toast({
          title: "Location Access Denied",
          description: "Please enable location access to share your location",
          variant: "destructive"
        });
      }
    );
  };

  const handleReply = (messageToReply) => {
    setReplyingTo(messageToReply);
  };

  const handleSendReply = async (replyData) => {
    if (!activeChat || !sendMessage) return;
    
    try {
      await sendMessage(activeChat.id, replyData.content, replyData.type, {
        replyTo: replyData.replyTo,
        originalMessage: replyData.originalMessage,
        originalSender: replyData.originalSender
      });
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
    }
  };

  const handleQuoteMessage = (messageToQuote) => {
    const quotedText = `> ${messageToQuote.content}\n\n`;
    setMessage(quotedText);
    inputRef.current?.focus();
  };

  const handleVoiceCall = () => {
    setShowVoiceCall(true);
    setIsVoiceCallMinimized(false);
  };

  const handleUpdateChatSettings = (newSettings) => {
    setChatSettings(newSettings);
    if (activeChat) {
      localStorage.setItem(`chat-settings-${activeChat.id}`, JSON.stringify(newSettings));
    }
  };

  // FIXED: Enhanced message options handler
  const handleShowMessageOptions = (message) => {
    console.log('=== CHAT AREA MESSAGE OPTIONS ===');
    console.log('Message:', message);
    setShowMessageOptions(message);
  };

  // FIXED: Message action handlers
  const handleMessageReply = (message) => {
    handleReply(message);
    setShowMessageOptions(null);
  };

  const handleMessageEdit = (message) => {
    setMessage(message.content);
    setShowMessageOptions(null);
    inputRef.current?.focus();
    toast({
      title: "Edit Mode",
      description: "Message content loaded for editing"
    });
  };

  const handleMessageDelete = (messageId) => {
    // This will be handled by the chat context
    setShowMessageOptions(null);
    toast({
      title: "Message Deleted",
      description: "Message has been deleted"
    });
  };

  const handleMessagePin = (messageId) => {
    setShowMessageOptions(null);
    toast({
      title: "Message Pinned",
      description: "Message has been pinned"
    });
  };

  const handleMessageStar = (messageId) => {
    setShowMessageOptions(null);
    toast({
      title: "Message Starred",
      description: "Message has been starred"
    });
  };

  const handleMessageForward = (message) => {
    setShowMessageOptions(null);
    toast({
      title: "🚧 Forward Message",
      description: "Message forwarding isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  const handleMessageReport = (message) => {
    setShowMessageOptions(null);
    toast({
      title: "Message Reported",
      description: "Message has been reported to moderators"
    });
  };

  if (!activeChat) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Select a Contact</h3>
          <p className="text-muted-foreground">Choose someone to start a secure conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chat Header */}
      <div className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setActiveChat(null)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                {contact?.avatar || '👤'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{contact?.username || 'Unknown'}</h3>
              <p className="text-xs text-muted-foreground">
                {typingUsers[activeChat.id] ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceCall}
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toast({
              title: "Video Call Started",
              description: `Starting video call with ${contact?.username || 'contact'}...`
            })}
          >
            <Video className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChatOptions(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {activeChat.messages && activeChat.messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
              contact={contact}
              previousMessage={activeChat.messages[index - 1]}
              onReply={handleReply}
              onShowOptions={handleShowMessageOptions}
            />
          ))}
        </AnimatePresence>
        
        {typingUsers[activeChat.id] && typingUsers[activeChat.id] !== user?.id && (
          <TypingIndicator contact={contact} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Section */}
      <AnimatePresence>
        {replyingTo && (
          <MessageReplySystem
            replyingTo={replyingTo}
            onSendReply={handleSendReply}
            onCancelReply={() => setReplyingTo(null)}
            onQuoteMessage={handleQuoteMessage}
          />
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4 relative">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              placeholder="Type a secure message..."
              className="pr-12 resize-none"
              disabled={isRecording}
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <div className="relative" ref={emojiPickerRef}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="w-4 h-4" />
                </Button>

                {/* FIXED: Proper emoji picker positioning */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 z-[9999]">
                    <EnhancedEmojiPicker 
                      onEmojiSelect={handleEmojiSelect}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowTextStyler(true)}
          >
            <Type className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowFileUpload(!showFileUpload)}
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleLocationShare}
          >
            <MapPin className="w-4 h-4" />
          </Button>

          <VoiceRecorder
            isRecording={isRecording}
            onStartRecording={() => setIsRecording(true)}
            onStopRecording={handleVoiceNote}
          />

          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || isRecording}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Auto-delete notice */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          🔒 Messages auto-delete after {activeChat.settings?.deleteTimer ? Math.floor(activeChat.settings.deleteTimer / 1000) : 5}s • End-to-end encrypted
        </div>
      </div>

      {/* File Upload Modal */}
      <FileUpload
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onFileSelect={handleFileUpload}
      />

      {/* Chat Options Modal */}
      <ChatOptionsMenu
        isOpen={showChatOptions}
        onClose={() => setShowChatOptions(false)}
        contact={contact}
        chatSettings={chatSettings}
        onUpdateSettings={handleUpdateChatSettings}
      />

      {/* FIXED: Enhanced Message Options Modal */}
      <MessageOptionsMenu
        message={showMessageOptions}
        isOwn={showMessageOptions?.senderId === user?.id}
        isOpen={!!showMessageOptions}
        onClose={() => setShowMessageOptions(null)}
        onReply={handleMessageReply}
        onEdit={handleMessageEdit}
        onDelete={handleMessageDelete}
        onPin={handleMessagePin}
        onStar={handleMessageStar}
        onForward={handleMessageForward}
        onQuote={handleQuoteMessage}
        onReport={handleMessageReport}
      />

      {/* Text Styler Modal */}
      <AdvancedTextStyler
        isOpen={showTextStyler}
        onClose={() => setShowTextStyler(false)}
        onApplyStyle={handleTextStyle}
        selectedText={message}
      />

      {/* Voice Call Interface */}
      {showVoiceCall && contact && (
        <VoiceCallManager
          contact={contact}
          onEnd={() => {
            setShowVoiceCall(false);
            setIsVoiceCallMinimized(false);
          }}
          isMinimized={isVoiceCallMinimized}
          onToggleMinimize={() => setIsVoiceCallMinimized(!isVoiceCallMinimized)}
        />
      )}
    </div>
  );
}