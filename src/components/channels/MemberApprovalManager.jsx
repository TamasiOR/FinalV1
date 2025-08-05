import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { 
  X, 
  Clock, 
  Check, 
  UserCheck, 
  UserX, 
  Shield,
  AlertCircle,
  Users,
  MessageCircle
} from 'lucide-react';

export default function MemberApprovalManager({ 
  channel, 
  isOpen, 
  onClose, 
  onApproveMember,
  onRejectMember 
}) {
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && channel) {
      loadPendingMembers();
    }
  }, [isOpen, channel]);

  const loadPendingMembers = () => {
    try {
      const saved = localStorage.getItem(`channel-pending-members-${channel.id}`);
      if (saved) {
        setPendingMembers(JSON.parse(saved));
      } else {
        // Mock pending members for demo
        const mockPending = [
          {
            id: 'pending-1',
            userId: 'user-123',
            username: 'John Doe',
            avatar: '👨‍💻',
            email: 'john@example.com',
            requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            inviteCode: 'ABC123XY',
            invitedBy: 'Alex Chen',
            message: 'Hi! I\'d love to join this channel to learn more about tech trends.'
          },
          {
            id: 'pending-2',
            userId: 'user-456',
            username: 'Sarah Johnson',
            avatar: '👩‍🎨',
            email: 'sarah@example.com',
            requestedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            inviteCode: 'DEF456UV',
            invitedBy: 'Mike Wilson',
            message: 'Looking forward to contributing to the discussions!'
          }
        ];
        setPendingMembers(mockPending);
      }
    } catch (error) {
      console.error('Error loading pending members:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePendingMembers = (members) => {
    localStorage.setItem(`channel-pending-members-${channel.id}`, JSON.stringify(members));
    setPendingMembers(members);
  };

  const handleApprove = (memberId) => {
    const member = pendingMembers.find(m => m.id === memberId);
    if (!member) return;

    const updatedPending = pendingMembers.filter(m => m.id !== memberId);
    savePendingMembers(updatedPending);

    if (onApproveMember) {
      onApproveMember(member);
    }

    toast({
      title: "Member Approved! ✅",
      description: `${member.username} has been approved to join the channel`
    });
  };

  const handleReject = (memberId, reason = '') => {
    const member = pendingMembers.find(m => m.id === memberId);
    if (!member) return;

    const updatedPending = pendingMembers.filter(m => m.id !== memberId);
    savePendingMembers(updatedPending);

    if (onRejectMember) {
      onRejectMember(member, reason);
    }

    toast({
      title: "Member Rejected",
      description: `${member.username}'s request has been rejected`
    });
  };

  const handleApproveAll = () => {
    pendingMembers.forEach(member => {
      if (onApproveMember) {
        onApproveMember(member);
      }
    });

    savePendingMembers([]);

    toast({
      title: "All Members Approved! 🎉",
      description: `${pendingMembers.length} member${pendingMembers.length > 1 ? 's' : ''} approved`
    });
  };

  const handleRejectAll = () => {
    const count = pendingMembers.length;
    savePendingMembers([]);

    toast({
      title: "All Requests Rejected",
      description: `${count} membership request${count > 1 ? 's' : ''} rejected`
    });
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

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
            <Clock className="w-5 h-5 text-yellow-500" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Pending Approvals</h2>
              <p className="text-sm text-muted-foreground">#{channel.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingMembers.length > 1 && (
              <>
                <Button variant="outline" size="sm" onClick={handleRejectAll}>
                  <UserX className="w-4 h-4 mr-1" />
                  Reject All
                </Button>
                <Button size="sm" onClick={handleApproveAll}>
                  <UserCheck className="w-4 h-4 mr-1" />
                  Approve All
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading pending members...</p>
            </div>
          ) : pendingMembers.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-foreground mb-2">No Pending Approvals</h4>
              <p className="text-muted-foreground">All membership requests have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">
                  {pendingMembers.length} Member{pendingMembers.length > 1 ? 's' : ''} Awaiting Approval
                </h4>
              </div>

              {pendingMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted/30 rounded-lg p-4 border"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                      {member.avatar}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-foreground">{member.username}</h5>
                        <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded-full">
                          Pending
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Email: {member.email}</p>
                        <p>Requested: {formatTimeAgo(member.requestedAt)}</p>
                        <p>Invited by: {member.invitedBy}</p>
                        <p>Invite code: <span className="font-mono">{member.inviteCode}</span></p>
                      </div>

                      {member.message && (
                        <div className="mt-3 p-3 bg-background/50 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageCircle className="w-3 h-3 text-primary" />
                            <span className="text-xs font-medium text-primary">Message from applicant:</span>
                          </div>
                          <p className="text-sm text-foreground italic">"{member.message}"</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(member.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(member.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}