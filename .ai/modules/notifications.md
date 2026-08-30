# Notification Module

## Events

- New course / month unlocked
- Assignment reminder (deadline approaching)
- Grade published
- Feedback received

## Channels

- Email
- Browser Push
- System Notification (in-app)
- WebSocket real-time delivery for connected clients

## Rules

- Queue all notifications via BullMQ
- Never send synchronously in the request path
- Idempotent job handling where possible
- Respect user notification preferences when added
- Offline clients sync notification inbox on reconnect
