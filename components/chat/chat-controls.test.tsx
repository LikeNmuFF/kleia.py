import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/app/actions/chat', () => ({ sendMessage: vi.fn(), setMessageReaction: vi.fn() }))
vi.mock('@/lib/chat/reactions', async () => import('../../lib/chat/reactions'))

import MessageInput from './MessageInput'
import MessageReactions from './MessageReactions'

describe('chat controls', () => {
  it('shows the reply target in the composer with a cancel action', () => {
    const html = renderToStaticMarkup(<MessageInput conversationId="conversation-1" replyTo={{ id: 'message-1', username: 'Alice', content: 'Which challenge?' }} />)
    expect(html).toContain('Replying to Alice')
    expect(html).toContain('Which challenge?')
    expect(html).toContain('aria-label="Cancel reply"')
  })

  it('does not show a reply banner for an ordinary draft', () => {
    const html = renderToStaticMarkup(<MessageInput conversationId="conversation-1" />)
    expect(html).not.toContain('Cancel reply')
    expect(html).toContain('aria-label="Message"')
  })

  it('counts active reactions and indicates the current user selection', () => {
    const html = renderToStaticMarkup(<MessageReactions
      conversationId="conversation-1" messageId="message-1" currentUserId="user-1" onReply={() => {}} onChange={() => {}}
      reactions={[
        { conversation_id: 'conversation-1', message_id: 'message-1', user_id: 'user-1', emoji: 'heart', active: true },
        { conversation_id: 'conversation-1', message_id: 'message-1', user_id: 'user-2', emoji: 'heart', active: true },
        { conversation_id: 'conversation-1', message_id: 'message-1', user_id: 'user-3', emoji: 'heart', active: false },
      ]}
    />)
    expect(html).toContain('aria-label="Love: 2, including you"')
    expect(html).toContain('aria-pressed="true"')
    expect(html).not.toContain('Love: 3')
  })

  it('hides reaction counts when all reactions were removed', () => {
    const html = renderToStaticMarkup(<MessageReactions
      conversationId="conversation-1" messageId="message-1" currentUserId="user-1" onReply={() => {}} onChange={() => {}}
      reactions={[{ conversation_id: 'conversation-1', message_id: 'message-1', user_id: 'user-1', emoji: 'heart', active: false }]}
    />)
    expect(html).not.toContain('aria-pressed')
    expect(html).toContain('aria-label="Reply"')
    expect(html).toContain('aria-label="React"')
  })
})
