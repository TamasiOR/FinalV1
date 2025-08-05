import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Shield, 
  Clock, 
  UserPlus, 
  AlertCircle,
  Check,
  X,
  Hash,
  Info
} from 'lucide-react';

export default function InviteAcceptanceHandler({ 
  inviteCode, 
  channelId, 
  isOpen, 
  onClose, 
  onAcceptInvite,
  onDeclineInvite 
}) {
  const { user } = useAuth();
  const [inviteData, setInviteData] = useState(null);
  const [channelData, setChannelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestAvatar, setGuestAvatar] = useState('👤');
  const [joinAsGuest, setJoinAsGuest] = useState(false);

  const avatarOptions = ['👤', '👩‍💼', '👨‍💻', '👩‍🎨', '👨‍🔬', '👩‍⚕️', '👨‍🎓', '👩‍🚀'];

  useEffect(() => {
    if (isOpen && inviteCode && channelId) {
      validateInvite();
    }
  }, [isOpen, inviteCode, channelId]);

  const validateInvite = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate invite validation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock invite data - in a real app, this would come from an API
      const mockInviteData = {
        id: `invite-${inviteCode}`,
        code: inviteCode,
        channelId,
        isValid: true,
        isExpired: false,
        maxUses: 0,
        currentUses: 0,
        requireApproval: false,
        allowGuests: true,
        createdBy: 'Alex Chen',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      };

      const mockChannelData = {
        id: channelId,
        name: 'Tech Discussions',
        description: 'A place for technology enthusiasts to share ideas and discuss the latest trends',
        icon: '💻',
        memberCount: 156,
        isPrivate: false,
        category: 'Technology'
      };

      setInviteData(mockInviteData);
      setChannelData(mockChannelData);
    } catch (error) {
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!inviteData || !channelData) return;

    const memberData = {
      userId: user?.id || `guest-${Date.now()}`,
      username: user?.username || guestName,
      avatar: user?.avatar || guestAvatar,
      isGuest: !user && joinAsGuest,
      joinMethod: 'invite',
      inviteCode: inviteData.code
    };

    if (onAcceptInvite) {
      onAcceptInvite(channelData, memberData);
    }

    toast({
      title: "Welcome to the Channel! 🎉",
      description: `You've successfully joined #${channelData.name}`
    });

    onClose();
  };

  const handleDecline = () => {
    if (onDeclineInvite) {
      onDeclineInvite(inviteCode);
    }

    toast({
      title: "Invitation Declined",
      description: "You have declined the channel invitation"
    });

    onClose();
  };

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Less than 1 hour';
  };

  if (!isOpen) return null;

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
        className="bg-card border border-border rounded-lg w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Channel Invitation
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Validating invitation...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-destructive mb-2">Invalid Invitation</h4>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          ) : inviteData && channelData ? (
            <div className="space-y-6">
              {/* Channel Info */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-2xl mx-auto mb-4">
                  {channelData.icon}
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-2">
                  #{channelData.name}
                </h4>
                <p className="text-muted-foreground mb-4">{channelData.description}</p>
                
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{channelData.memberCount} members</span>
                  </div>
                  {channelData.isPrivate && (
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      <span>Private</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invite Details */}
              <div className="bg-muted/30 rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-primary" />
                  <span className="font-medium">Invitation Details</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invited by:</span>
                    <span className="font-medium">{inviteData.createdBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires in:</span>
                    <span className="font-medium">{formatTimeRemaining(inviteData.expiresAt)}</span>
                  </div>
                  {inviteData.maxUses > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uses remaining:</span>
                      <span className="font-medium">{inviteData.maxUses - inviteData.currentUses}</span>
                    </div>
                  )}
                  {inviteData.requireApproval && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">Requires admin approval</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Guest Join Option */}
              {!user && inviteData.allowGuests && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Join as Guest</Label>
                    <input
                      type="checkbox"
                      checked={joinAsGuest}
                      onChange={(e) => setJoinAsGuest(e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  {joinAsGuest && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="guestName">Display Name</Label>
                        <Input
                          id="guestName"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Enter your name"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Choose Avatar</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {avatarOptions.map((avatar) => (
                            <button
                              key={avatar}
                              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg transition-colors ${
                                guestAvatar === avatar ? 'border-primary bg-primary/20' : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => setGuestAvatar(avatar)}
                            >
                              {avatar}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleDecline}>
                  <X className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleAccept}
                  disabled={!user && joinAsGuest && !guestName.trim()}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {inviteData.requireApproval ? 'Request to Join' : 'Join Channel'}
                </Button>
              </div>

              {/* Terms Notice */}
              <div className="text-xs text-muted-foreground text-center">
                By joining, you agree to follow the channel rules and community guidelines
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-destructive mb-2">Invitation Not Found</h4>
              <p className="text-muted-foreground mb-4">This invitation may have expired or been revoked</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}