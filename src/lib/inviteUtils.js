// Utility functions for channel invitations

export const generateInviteCode = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

export const generateInviteLink = (channelId, inviteCode) => {
  return `https://securechat.app/invite/${channelId}/${inviteCode}`;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateInviteCode = (code) => {
  return /^[A-Z0-9]{8}$/.test(code);
};

export const isInviteExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

export const formatInviteExpiry = (expiresAt) => {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const createInviteData = (channelId, settings = {}) => {
  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + (settings.expiresIn || 7) * 24 * 60 * 60 * 1000);
  
  return {
    id: `invite-${Date.now()}-${code}`,
    channelId,
    code,
    link: generateInviteLink(channelId, code),
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    maxUses: settings.maxUses || 0,
    currentUses: 0,
    requireApproval: settings.requireApproval || false,
    allowGuests: settings.allowGuests || true,
    isActive: true
  };
};

export const processInviteAcceptance = (inviteData, userData) => {
  return {
    id: `member-${Date.now()}`,
    userId: userData.id,
    username: userData.username,
    avatar: userData.avatar,
    joinedAt: new Date().toISOString(),
    invitedBy: inviteData.createdBy,
    inviteCode: inviteData.code,
    role: 'member',
    status: inviteData.requireApproval ? 'pending_approval' : 'active'
  };
};

export const sendInviteNotification = (channelName, inviteLink, customMessage = '') => {
  // In a real app, this would send actual notifications
  const message = customMessage || `You've been invited to join the ${channelName} channel on SecureChat!`;
  
  return {
    title: `Invitation to ${channelName}`,
    body: message,
    link: inviteLink,
    timestamp: new Date().toISOString()
  };
};

export const trackInviteEvent = (eventType, inviteData, additionalData = {}) => {
  const event = {
    id: `event-${Date.now()}`,
    type: eventType, // 'created', 'sent', 'accepted', 'expired', 'revoked'
    inviteId: inviteData.id,
    channelId: inviteData.channelId,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  // Save to invite analytics (in a real app, this would go to analytics service)
  const analytics = JSON.parse(localStorage.getItem('securechat-invite-analytics') || '[]');
  analytics.push(event);
  localStorage.setItem('securechat-invite-analytics', JSON.stringify(analytics));
  
  return event;
};