import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import chatService from '../../services/chatService.js'
import { extractContent, hasMessageGap, mergeMessages } from './chatMessages.js'

const PAGE_SIZE = 100

// One thread owns its history, polling lifetime, and older-message pagination.
export default function useChatMessages({ conversationId, ownerId, enabled, isLive, onConversationChange }) {
  const [state, setState] = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const generation = useRef(0)
  const olderPending = useRef(false)
  const updateConversation = useEffectEvent(onConversationChange)
  const threadKey = enabled && conversationId ? `${ownerId}:${conversationId}` : null

  useEffect(() => {
    const requestGeneration = ++generation.current
    olderPending.current = false
    if (!threadKey) return undefined
    let active = true
    chatService.getMessages(conversationId, { size: PAGE_SIZE }).then((page) => {
      if (!active) return
      setState((current) => current?.key === threadKey ? {
        ...current, messages: mergeMessages(current.messages, extractContent(page)), loading: false, error: '',
        hasOlder: current.hasOlder || (current.nextPage === 1 && page.last === false),
      } : {
        key: threadKey, messages: mergeMessages([], extractContent(page)), loading: false,
        error: '', olderError: '', loadingOlder: false, nextPage: 1, hasOlder: page.last === false,
      })
    }).catch((error) => {
      if (active) setState((current) => ({
        ...(current?.key === threadKey ? current : { key: threadKey, messages: [], nextPage: 1 }),
        loading: false, error: error.message || 'Không thể tải tin nhắn.',
      }))
    })
    return () => {
      active = false
      if (generation.current === requestGeneration) generation.current += 1
    }
  }, [conversationId, threadKey, retryKey])

  useEffect(() => {
    if (!threadKey || !isLive) return undefined
    let active = true
    let pending = false
    const interval = setInterval(async () => {
      if (pending) return
      pending = true
      try {
        const [conversation, page] = await Promise.all([
          chatService.getConversation(conversationId),
          chatService.getMessages(conversationId, { size: PAGE_SIZE }),
        ])
        if (!active) return
        updateConversation(conversation)
        const received = extractContent(page)
        setState((current) => {
          if (current?.key !== threadKey || current.loading) return current
          const gap = hasMessageGap(current.messages, received)
          return {
            ...current, messages: mergeMessages(current.messages, received), error: '',
            hasOlder: gap || current.hasOlder || (current.nextPage === 1 && page.last === false),
            nextPage: gap && !current.loadingOlder ? 1 : current.nextPage,
            gapPending: current.gapPending || (gap && current.loadingOlder),
          }
        })
      } catch (error) {
        if (active) setState((current) => current?.key !== threadKey ? current : {
          ...current, error: error.message || 'Mất kết nối hỗ trợ. Vui lòng thử lại.',
        })
      } finally {
        pending = false
      }
    }, 4000)
    return () => { active = false; clearInterval(interval) }
  }, [conversationId, threadKey, isLive, retryKey])

  const loadOlder = async () => {
    if (!threadKey || state?.key !== threadKey || !state.hasOlder || olderPending.current) return
    olderPending.current = true
    const requestGeneration = generation.current
    const pageNumber = state.nextPage
    setState((current) => ({ ...current, loadingOlder: true, olderError: '' }))
    try {
      const page = await chatService.getMessages(conversationId, { page: pageNumber, size: PAGE_SIZE })
      if (generation.current !== requestGeneration) return
      setState((current) => ({
        ...current, messages: mergeMessages(current.messages, extractContent(page)),
        loadingOlder: false, nextPage: current.gapPending ? 1 : pageNumber + 1,
        hasOlder: current.gapPending || page.last === false, gapPending: false,
      }))
    } catch (error) {
      if (generation.current === requestGeneration) setState((current) => ({
        ...current, loadingOlder: false, olderError: error.message || 'Không thể tải tin nhắn cũ.',
      }))
    } finally {
      if (generation.current === requestGeneration) olderPending.current = false
    }
  }

  const appendMessage = useCallback((message) => {
    setState((current) => current?.key !== threadKey ? current : {
      ...current, messages: mergeMessages(current.messages, [message]),
    })
  }, [threadKey])

  const retry = () => {
    setState((current) => current?.key !== threadKey ? current : { ...current, loading: true, error: '' })
    setRetryKey((value) => value + 1)
  }
  const current = threadKey && state?.key === threadKey ? state : null
  return {
    messages: current?.messages || [], isLoading: Boolean(threadKey && (!current || current.loading)),
    error: current?.error || '', olderError: current?.olderError || '', hasOlder: Boolean(current?.hasOlder),
    isLoadingOlder: Boolean(current?.loadingOlder), loadOlder, appendMessage, retry,
  }
}
