// AI 对话服务
import { learningRecord } from './learningRecord'
import { aiService } from './ai'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface AIConfig {
  provider: 'deepseek' | 'qwen' | 'custom'
  apiKey: string
  model: string
}

const STORAGE_KEY = 'ai_chat_history'
const CONFIG_KEY = 'ai_config'

class ChatService {
  private messages: ChatMessage[] = []
  private config: AIConfig = {
    provider: 'deepseek',
    apiKey: '',
    model: 'deepseek-chat'
  }

  constructor() {
    this.loadHistory()
    this.loadConfig()
  }

  private loadHistory() {
    const saved = uni.getStorageSync(STORAGE_KEY)
    if (saved) {
      this.messages = saved
    }
  }

  private saveHistory() {
    uni.setStorageSync(STORAGE_KEY, this.messages)
  }

  private loadConfig() {
    const saved = uni.getStorageSync(CONFIG_KEY)
    if (saved) {
      this.config = { ...this.config, ...saved }
    }
  }

  private saveConfig() {
    uni.setStorageSync(CONFIG_KEY, this.config)
  }

  // 获取配置
  getConfig(): AIConfig {
    return { ...this.config }
  }

  // 更新配置
  updateConfig(updates: Partial<AIConfig>) {
    this.config = { ...this.config, ...updates }
    this.saveConfig()
  }

  // 检查是否已配置
  isConfigured(): boolean {
    return !!this.config.apiKey
  }

  // 获取对话历史
  getMessages(): ChatMessage[] {
    return [...this.messages]
  }

  // 发送消息
  async sendMessage(content: string): Promise<ChatMessage> {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    }
    this.messages.push(userMessage)
    this.saveHistory()

    try {
      const response = await this.getAIResponse(content)
      
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      }
      this.messages.push(assistantMessage)
      this.saveHistory()
      
      return assistantMessage
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。请稍后再试。',
        timestamp: Date.now()
      }
      this.messages.push(errorMessage)
      return errorMessage
    }
  }

  // 调用 AI API
  private async getAIResponse(userInput: string): Promise<string> {
    const appSettings = uni.getStorageSync('app_settings') || {}
    const apiKey = (appSettings as any).apiKey || this.config.apiKey
    if (!apiKey) {
      return this.getLocalResponse(userInput)
    }

    const stats = learningRecord.getStats()
    let userContextStr = `你是中考英语学习助手。用户当前学习情况：已学${stats.totalWordsLearned}个单词，连续学习${stats.streakDays}天。请用中文回答英语学习相关问题。`
    
    try {
      const userContext = await aiService.getUserContext()
      if (userContext) {
        const weakPoints = userContext.weakPoints && userContext.weakPoints.length > 0
          ? userContext.weakPoints.join('、')
          : '暂无记录'
        userContextStr = `你是中考英语学习助手，专为初中${userContext.grade || '初中'}学生服务。用户当前学习情况：已学${stats.totalWordsLearned}个单词，连续学习${stats.streakDays}天。薄弱知识点：${weakPoints}。请用中文回答英语学习相关问题，结合用户的学习情况给出针对性建议。`
      }
    } catch (_e) {
    }
    
    const context = userContextStr
    const providerIndex = (appSettings as any).aiProviderIndex ?? 0
    const baseUrl = (appSettings as any).apiBaseUrl?.trim()
      || (providerIndex === 1 ? 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation' : 'https://api.deepseek.com/v1/chat/completions')
    const modelIndex = (appSettings as any).modelIndex ?? 0
    const model = (appSettings as any).model
      || (providerIndex === 0 ? ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'][modelIndex] : ['qwen-plus', 'qwen-turbo', 'qwen-max'][modelIndex])
      || 'deepseek-chat'

    try {
      const response = await uni.request({
        url: baseUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        data: providerIndex === 1 ? {
          model: model,
          input: {
            messages: [
              { role: 'system', content: context },
              ...this.messages.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
              { role: 'user', content: userInput }
            ]
          },
          parameters: { temperature: 0.7, max_tokens: 1000 }
        } : {
          model: model,
          messages: [
            { role: 'system', content: context },
            ...this.messages.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userInput }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }
      })

      const data = (response.data || {}) as any
      if (providerIndex === 1) {
        const content = data.output?.choices?.[0]?.message?.content || data.output?.text || ''
        if (content) return content
      } else {
        const content = data.choices?.[0]?.message?.content || ''
        if (content) return content
      }
      
      return this.getLocalResponse(userInput)
    } catch (e: any) {
      console.error('AI API error:', e)
      return this.getLocalResponse(userInput)
    }
  }

  // 获取 API URL
  private getApiUrl(): string {
    switch (this.config.provider) {
      case 'deepseek':
        return 'https://api.deepseek.com/v1/chat/completions'
      case 'qwen':
        return 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
      default:
        return 'https://api.deepseek.com/v1/chat/completions'
    }
  }

  // 本地 fallback 响应
  private getLocalResponse(input: string): string {
    const lowerInput = input.toLowerCase()
    
    // 英语学习相关问题
    if (lowerInput.includes('单词') || lowerInput.includes('word')) {
      const tips = [
        '背单词最重要的是重复记忆。建议使用艾宾浩斯遗忘曲线，每天复习之前学过的单词。',
        '可以将单词分成小组学习，比如10个一组，每天学习3-5组。',
        '建议使用百日计划功能，系统地记忆中考词汇。'
      ]
      return tips[Math.floor(Math.random() * tips.length)]
    }
    
    if (lowerInput.includes('语法') || lowerInput.includes('grammar')) {
      return '中考英语语法重点包括：时态（一般现在时、一般过去时、一般将来时、现在进行时）、被动语态、定语从句、非谓语动词等。建议每天学习一个语法知识点。'
    }
    
    if (lowerInput.includes('听力') || lowerInput.includes('listen')) {
      return '提高听力需要多听多练。建议：1. 每天坚持听英语音频；2. 先看题目再听；3. 注意关键词如but、however等。'
    }
    
    if (lowerInput.includes('阅读') || lowerInput.includes('reading')) {
      return '阅读理解技巧：1. 先看题目再读文章；2. 抓住文章首尾段；3. 寻找关键词；4. 注意作者态度和观点。'
    }
    
    if (lowerInput.includes('写作') || lowerInput.includes('write')) {
      return '中考英语写作技巧：1. 仔细审题；2. 列出要点；3. 使用连接词；4. 注意时态；5. 检查拼写和语法。'
    }
    
    const encouragements = [
      '学习英语需要坚持！每天坚持学习一点点，积少成多！',
      '加油！坚持下去就是胜利！',
      '英语学习没有捷径，多听多说多练最重要！',
      '继续保持这个学习劲头，你一定会进步的！'
    ]
    
    return encouragements[Math.floor(Math.random() * encouragements.length)]
  }

  // 清空对话历史
  clearHistory() {
    this.messages = []
    this.saveHistory()
  }
}

export const chatService = new ChatService()
