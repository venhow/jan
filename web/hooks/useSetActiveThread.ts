import {
  InferenceEvent,
  ExtensionTypeEnum,
  Thread,
  events,
  ConversationalExtension,
} from '@janhq/core'

import { useAtomValue, useSetAtom } from 'jotai'

import { loadModelErrorAtom } from './useActiveModel'

import { extensionManager } from '@/extension'
import { setConvoMessagesAtom } from '@/helpers/atoms/ChatMessage.atom'
import {
  ModelParams,
  getActiveThreadIdAtom,
  isGeneratingResponseAtom,
  setActiveThreadIdAtom,
  setThreadModelParamsAtom,
} from '@/helpers/atoms/Thread.atom'

export default function useSetActiveThread() {
  const activeThreadId = useAtomValue(getActiveThreadIdAtom)
  const setActiveThreadId = useSetAtom(setActiveThreadIdAtom)
  const setThreadMessage = useSetAtom(setConvoMessagesAtom)
  const setThreadModelParams = useSetAtom(setThreadModelParamsAtom)
  const setIsGeneratingResponse = useSetAtom(isGeneratingResponseAtom)
  const setLoadModelError = useSetAtom(loadModelErrorAtom)

  const setActiveThread = async (thread: Thread) => {
    if (activeThreadId === thread.id) {
      console.debug('Thread already active')
      return
    }

    setIsGeneratingResponse(false)
    setLoadModelError(undefined)
    events.emit(InferenceEvent.OnInferenceStopped, thread.id)

    // load the corresponding messages
    const messages = await extensionManager
      .get<ConversationalExtension>(ExtensionTypeEnum.Conversational)
      ?.getAllMessages(thread.id)
    setThreadMessage(thread.id, messages ?? [])

    setActiveThreadId(thread.id)
    const modelParams: ModelParams = {
      ...thread.assistants[0]?.model?.parameters,
      ...thread.assistants[0]?.model?.settings,
    }
    setThreadModelParams(thread.id, modelParams)
  }

  return { activeThreadId, setActiveThread }
}
