// Mock comms seed data — chat messages, announcements, and admin notifications.
// Sourced from chatData / sentNotifications in docs/pulse_v4_prototype.html.

import type { Message, AdminNotification } from '@/types/database'

// Channels: 'announcements' (announcement type, admin-posted) and 'general' (chat).
export const messages: Message[] = [
  // ── Announcements ──
  {
    id: 'msg-001',
    channel: 'announcements',
    message_type: 'announcement',
    author_id: 'emp-001', // Ryan
    body: '🏓 Paddle on Friday @ Boksburg Paddle Club! 3pm start. Everyone welcome. Bring your A-game.',
    created_at: '2026-06-12T09:15:00.000Z',
  },
  {
    id: 'msg-002',
    channel: 'announcements',
    message_type: 'announcement',
    author_id: 'emp-002', // Ben (HR)
    body: '📋 Reminder: Monthly timesheets due by 25 June. Please submit via Zoho Projects.',
    created_at: '2026-06-11T14:30:00.000Z',
  },
  {
    id: 'msg-003',
    channel: 'announcements',
    message_type: 'announcement',
    author_id: 'emp-001', // Ryan
    body: '🎉 Welcome Sarah van der Berg to the team! She joins us as Junior Developer starting 16 June.',
    created_at: '2026-06-10T08:00:00.000Z',
  },
  // ── General chat ──
  {
    id: 'msg-004',
    channel: 'general',
    message_type: 'chat',
    author_id: 'emp-003', // Siko
    body: 'Anyone else having issues with the VPN this morning?',
    created_at: '2026-06-12T08:45:00.000Z',
  },
  {
    id: 'msg-005',
    channel: 'general',
    message_type: 'chat',
    author_id: 'emp-004', // Raymond
    body: 'Working fine on my end. Try disconnecting and reconnecting.',
    created_at: '2026-06-12T08:52:00.000Z',
  },
  {
    id: 'msg-006',
    channel: 'general',
    message_type: 'chat',
    author_id: 'emp-005', // Jo-Ann
    body: 'New polo shirts arrived! Will distribute this afternoon.',
    created_at: '2026-06-12T10:20:00.000Z',
  },
]

// Admin broadcast notifications (sent history).
export const adminNotifications: AdminNotification[] = [
  {
    id: 'notif-001',
    sent_by: 'emp-002', // Ben (HR)
    notification_type: 'reminder',
    subject: 'Timesheets due by the 25th',
    body: 'Please ensure all June timesheets are submitted via Zoho Projects by 25 June. Expense claims must include an attached timesheet.',
    target: 'all',
    created_at: '2026-06-11T14:35:00.000Z',
  },
  {
    id: 'notif-002',
    sent_by: 'emp-001', // Ryan
    notification_type: 'celebration',
    subject: 'Welcome to the team, Sarah!',
    body: 'Please join me in welcoming Sarah van der Berg, our new Junior Developer, starting 16 June. Say hi when you see her around.',
    target: 'all',
    created_at: '2026-06-10T08:05:00.000Z',
  },
]
