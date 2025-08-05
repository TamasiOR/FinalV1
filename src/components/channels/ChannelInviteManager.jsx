import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { 
  X, 
  UserPlus, 
  Copy, 
  Share, 
  Link, 
  Clock, 
  Users, 
  Shield,
  Mail,
  MessageCircle,
  QrCode,
  Settings,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle
} from 'lucide-react';

export default function ChannelInviteManager({ 
  channel, 
  isOpen, 
  onClose, 
  onInviteMember,
  onUpdateInviteSettings 
}) {
  const [activeTab, setActiveTab] = useState('invite');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteSettings, setInviteSettings] = useState({
    maxUses: 0, // 0 = unlimited
    expiresIn: 7, // days
    requireApproval: false,
    allowGuests: true,
    sendWelcomeMessage: true
  });
  const [pendingInvites, setPendingInvites] = useState([]);
  const [inviteHistory, setInviteHistory] = useState([]);
  const [emailInvites, setEmailInvites] = useState(['']);
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    if (isOpen && channel) {
      loadInviteData();
      generateNewInviteLink();
    }
  }, [isOpen, channel]);

  const loadInviteData = () => {
    try {
      const savedInvites = localStorage.getItem(`channel-invites-${channel.id}`);
      if (savedInvites) {
        const data = JSON.parse(savedInvites);
        setPendingInvites(data.pending || []);
        setInviteHistory(data.history || []);
        setInviteSettings(data.settings || inviteSettings);
      }
    } catch (error) {
      console.error('Error loading invite data:', error);
    }
  };

  const saveInviteData = (data) => {
    try {
      localStorage.setItem(`channel-invites-${channel.id}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving invite data:', error);
    }
  };

  const generateNewInviteLink = () => {
    const code = Math.random().toString(36).substr(2, 8).toUpperCase();
    const link = `https://securechat.app/invite/${channel.id}/${code}`;
    setInviteLink(link);
    setInviteCode(code);
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Invite Link Copied! 📋",
      description: "Share this link to invite people to the channel"
    });
  };

  const handleShareInviteLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${channel.name} on SecureChat`,
          text: `You're invited to join the ${channel.name} channel on SecureChat!`,
          url: inviteLink
        });
        
        // Track the share
        const newShare = {
          id: Date.now(),
          type: 'link_share',
          method: 'native_share',
          timestamp: new Date().toISOString(),
          inviteCode
        };
        
        const updatedHistory = [...inviteHistory, newShare];
        setInviteHistory(updatedHistory);
        saveInviteData({
          pending: pendingInvites,
          history: updatedHistory,
          settings: inviteSettings
        });
        
        toast({
          title: "Invite Shared! 📤",
          description: "Invitation has been shared successfully"
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          handleCopyInviteLink();
        }
      }
    } else {
      handleCopyInviteLink();
    }
  };

  const handleEmailInvite = () => {
    const validEmails = emailInvites.filter(email => 
      email.trim() && email.includes('@')
    );

    if (validEmails.length === 0) {
      toast({
        title: "No Valid Emails",
        description: "Please enter at least one valid email address",
        variant: "destructive"
      });
      return;
    }

    // Create pending invites
    const newInvites = validEmails.map(email => ({
      id: Date.now() + Math.random(),
      email: email.trim(),
      inviteCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
      type: 'email',
      status: 'pending',
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + inviteSettings.expiresIn * 24 * 60 * 60 * 1000).toISOString(),
      customMessage,
      requireApproval: inviteSettings.requireApproval
    }));

    const updatedPending = [...pendingInvites, ...newInvites];
    setPendingInvites(updatedPending);
    
    // Add to history
    const historyEntries = newInvites.map(invite => ({
      id: invite.id,
      type: 'email_invite',
      recipient: invite.email,
      timestamp: invite.sentAt,
      inviteCode: invite.inviteCode,
      status: 'sent'
    }));
    
    const updatedHistory = [...inviteHistory, ...historyEntries];
    setInviteHistory(updatedHistory);
    
    saveInviteData({
      pending: updatedPending,
      history: updatedHistory,
      settings: inviteSettings
    });

    // Reset form
    setEmailInvites(['']);
    setCustomMessage('');

    toast({
      title: "Email Invites Sent! 📧",
      description: `Sent ${validEmails.length} email invitation${validEmails.length > 1 ? 's' : ''}`
    });
  };

  const handleDirectInvite = () => {
    // This would open a contact picker in a real implementation
    toast({
      title: "🚧 Direct Invite",
      description: "Direct contact invites aren't implemented yet—but don't worry! You can request them in your next prompt! 🚀"
    });
  };

  const handleRevokeInvite = (inviteId) => {
    const updatedPending = pendingInvites.filter(invite => invite.id !== inviteId);
    setPendingInvites(updatedPending);
    
    // Add to history as revoked
    const revokedInvite = pendingInvites.find(invite => invite.id === inviteId);
    if (revokedInvite) {
      const historyEntry = {
        id: Date.now(),
        type: 'invite_revoked',
        recipient: revokedInvite.email || 'Unknown',
        timestamp: new Date().toISOString(),
        inviteCode: revokedInvite.inviteCode,
        status: 'revoked'
      };
      
      const updatedHistory = [...inviteHistory, historyEntry];
      setInviteHistory(updatedHistory);
      
      saveInviteData({
        pending: updatedPending,
        history: updatedHistory,
        settings: inviteSettings
      });
    }

    toast({
      title: "Invite Revoked! ❌",
      description: "The invitation has been revoked and can no longer be used"
    });
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...inviteSettings, [key]: value };
    setInviteSettings(newSettings);
    
    if (onUpdateInviteSettings) {
      onUpdateInviteSettings(channel.id, newSettings);
    }
    
    saveInviteData({
      pending: pendingInvites,
      history: inviteHistory,
      settings: newSettings
    });
  };

  const addEmailField = () => {
    setEmailInvites([...emailInvites, '']);
  };

  const removeEmailField = (index) => {
    const updated = emailInvites.filter((_, i) => i !== index);
    setEmailInvites(updated.length > 0 ? updated : ['']);
  };

  const updateEmailField = (index, value) => {
    const updated = [...emailInvites];
    updated[index] = value;
    setEmailInvites(updated);
  };

  const generateQRCode = () => {
    toast({
      title: "🚧 QR Code",
      description: "QR code generation isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted': return <Check className="w-4 h-4 text-green-500" />;
      case 'expired': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'revoked': return <X className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const tabs = [
    { id: 'invite', label: 'Invite Members', icon: UserPlus },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'history', label: 'History', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderInviteTab = () => (
    <div className="space-y-6">
      {/* Invite Link Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Link className="w-4 h-4" />
          Invite Link
        </h4>
        
        <div className="bg-muted/30 rounded-lg p-4 border">
          <div className="flex gap-2 mb-3">
            <Input
              value={inviteLink}
              readOnly
              className="flex-1 bg-background/50"
            />
            <Button onClick={handleCopyInviteLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleShareInviteLink} className="flex-1">
              <Share className="w-4 h-4 mr-2" />
              Share Link
            </Button>
            <Button onClick={generateQRCode} variant="outline">
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>
            <Button onClick={generateNewInviteLink} variant="outline">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mt-3 text-xs text-muted-foreground">
            <p>Code: <span className="font-mono font-bold">{inviteCode}</span></p>
            <p>Expires in {inviteSettings.expiresIn} days • {inviteSettings.maxUses === 0 ? 'Unlimited uses' : `${inviteSettings.maxUses} uses max`}</p>
          </div>
        </div>
      </div>

      {/* Email Invites Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email Invitations
        </h4>
        
        <div className="space-y-3">
          {emailInvites.map((email, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => updateEmailField(index, e.target.value)}
                className="flex-1"
              />
              {emailInvites.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEmailField(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          
          <Button
            variant="outline"
            onClick={addEmailField}
            className="w-full"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Another Email
          </Button>
        </div>

        {/* Custom Message */}
        <div>
          <Label htmlFor="customMessage">Custom Message (Optional)</Label>
          <textarea
            id="customMessage"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add a personal message to your invitation..."
            className="w-full h-20 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none mt-2"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {customMessage.length}/500 characters
          </p>
        </div>

        <Button onClick={handleEmailInvite} className="w-full">
          <Mail className="w-4 h-4 mr-2" />
          Send Email Invitations
        </Button>
      </div>

      {/* Direct Invite Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Direct Invite
        </h4>
        
        <Button onClick={handleDirectInvite} variant="outline" className="w-full">
          <Users className="w-4 h-4 mr-2" />
          Invite from Contacts
        </Button>
      </div>
    </div>
  );

  const renderPendingTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Pending Invitations ({pendingInvites.length})</h4>
        {pendingInvites.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPendingInvites([]);
              saveInviteData({
                pending: [],
                history: inviteHistory,
                settings: inviteSettings
              });
              toast({
                title: "All Invites Revoked",
                description: "All pending invitations have been revoked"
              });
            }}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Revoke All
          </Button>
        )}
      </div>

      {pendingInvites.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No pending invitations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingInvites.map((invite) => (
            <div key={invite.id} className="bg-muted/30 rounded-lg p-4 border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(invite.status)}
                    <span className="font-medium">{invite.email}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      invite.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                      invite.status === 'accepted' ? 'bg-green-500/20 text-green-600' :
                      'bg-red-500/20 text-red-600'
                    }`}>
                      {invite.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Sent: {formatDate(invite.sentAt)}</p>
                    <p>Expires: {formatDate(invite.expiresAt)}</p>
                    <p>Code: <span className="font-mono">{invite.inviteCode}</span></p>
                    {invite.customMessage && (
                      <p className="italic">"{invite.customMessage}"</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://securechat.app/invite/${channel.id}/${invite.inviteCode}`);
                      toast({
                        title: "Invite Link Copied",
                        description: "Specific invite link copied to clipboard"
                      });
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => handleRevokeInvite(invite.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-4">
      <h4 className="font-medium">Invitation History ({inviteHistory.length})</h4>

      {inviteHistory.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No invitation history</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {inviteHistory.slice().reverse().map((entry) => (
            <div key={entry.id} className="bg-muted/20 rounded-lg p-3 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(entry.status)}
                  <span className="text-sm font-medium">
                    {entry.type === 'email_invite' && '📧 Email Invite'}
                    {entry.type === 'link_share' && '🔗 Link Share'}
                    {entry.type === 'direct_invite' && '👤 Direct Invite'}
                    {entry.type === 'invite_revoked' && '❌ Invite Revoked'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.timestamp)}
                </span>
              </div>
              
              {entry.recipient && (
                <p className="text-sm text-muted-foreground mt-1">
                  To: {entry.recipient}
                </p>
              )}
              
              {entry.inviteCode && (
                <p className="text-xs text-muted-foreground mt-1">
                  Code: <span className="font-mono">{entry.inviteCode}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h4 className="font-medium flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Invitation Settings
      </h4>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="maxUses">Maximum Uses</Label>
          <Input
            id="maxUses"
            type="number"
            min="0"
            value={inviteSettings.maxUses}
            onChange={(e) => handleSettingChange('maxUses', parseInt(e.target.value) || 0)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            0 = unlimited uses
          </p>
        </div>

        <div>
          <Label htmlFor="expiresIn">Expires In (Days)</Label>
          <Input
            id="expiresIn"
            type="number"
            min="1"
            max="30"
            value={inviteSettings.expiresIn}
            onChange={(e) => handleSettingChange('expiresIn', parseInt(e.target.value) || 7)}
            className="mt-2"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Require Approval</Label>
            <p className="text-sm text-muted-foreground">New members need admin approval</p>
          </div>
          <Switch
            checked={inviteSettings.requireApproval}
            onCheckedChange={(checked) => handleSettingChange('requireApproval', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Allow Guest Access</Label>
            <p className="text-sm text-muted-foreground">Let people join without creating an account</p>
          </div>
          <Switch
            checked={inviteSettings.allowGuests}
            onCheckedChange={(checked) => handleSettingChange('allowGuests', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Send Welcome Message</Label>
            <p className="text-sm text-muted-foreground">Automatically send welcome message to new members</p>
          </div>
          <Switch
            checked={inviteSettings.sendWelcomeMessage}
            onCheckedChange={(checked) => handleSettingChange('sendWelcomeMessage', checked)}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h5 className="font-medium mb-3">Invite Statistics</h5>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{pendingInvites.length}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-500">
              {inviteHistory.filter(h => h.status === 'accepted').length}
            </div>
            <div className="text-xs text-muted-foreground">Accepted</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen || !channel) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-lg">
              {channel.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Invite Members</h2>
              <p className="text-sm text-muted-foreground">#{channel.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/20">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'pending' && pendingInvites.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {pendingInvites.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'invite' && renderInviteTab()}
              {activeTab === 'pending' && renderPendingTab()}
              {activeTab === 'history' && renderHistoryTab()}
              {activeTab === 'settings' && renderSettingsTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}