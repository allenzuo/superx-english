import { authService } from './auth'
import type { QuestionAnalysis, ScannedQuestion, ScannedWord, QuestionExplanation, WordDetails, GrammarExplanation } from './types'

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface WordInfo {
  word: string
  phonetic: string
  definition: string
  example: string
  mastery: 'known' | 'learning' | 'unknown'
  inWordList: boolean
}

interface WordScanResult {
  words: WordInfo[]
  notInList: string[]
  scanDate: string
  imagePath?: string
}

interface LearningReport {
  period: 'day' | 'week' | 'month' | 'custom'
  startDate: string
  endDate: string
  summary: {
    totalWords: number
    learnedWords: number
    wrongQuestions: number
    streakDays: number
    totalStudyTime: number
    accuracy: number
  }
  knowledgeRadar: {
    grammar: number
    vocabulary: number
    reading: number
    listening: number
    writing: number
  }
  weakPoints: {
    topic: string
    description: string
    priority: number
    suggestion: string
    relatedFeature: string
  }[]
  progress: {
    date: string
    wordsLearned: number
    accuracy: number
    studyTime: number
  }[]
  nextPlan: {
    focus: string[]
    dailyGoal: number
    reason: string
  }
}

const STORAGE_KEYS = {
  SCAN_WORDS: 'ai_scanned_words',
  SCAN_QUESTIONS: 'ai_scanned_questions',
  LEARNING_REPORTS: 'ai_learning_reports',
  SCANNED_QUESTIONS_LIST: 'scanned_questions_list',
  SCANNED_WORDS_LIST: 'scanned_words_list'
}

class AIService {
  private getSettings() {
    return uni.getStorageSync('app_settings') || {}
  }

  private getApiKey(): string {
    return (this.getSettings() as any).apiKey || ''
  }

  private isDemoMode(): boolean {
    return !this.getApiKey()
  }

  private getAiProvider(): number {
    return (this.getSettings() as any).aiProviderIndex ?? 0
  }

  private getBaseUrl(): string {
    const settings = this.getSettings() as any
    if (settings.apiBaseUrl && settings.apiBaseUrl.trim()) {
      return settings.apiBaseUrl.trim()
    }
    if (settings.aiProviderIndex === 1) {
      return 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    }
    return `${DEEPSEEK_BASE_URL}/v1`
  }

  private getModel(): string {
    const settings = this.getSettings() as any
    const provider = settings.aiProviderIndex ?? 0
    if (settings.model && typeof settings.model === 'string') {
      return settings.model
    }
    const modelIndex = settings.modelIndex ?? 0
    if (provider === 0) {
      return ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'][modelIndex] || 'deepseek-chat'
    }
    if (provider === 1) {
      return ['qwen-plus', 'qwen-turbo', 'qwen-max'][modelIndex] || 'qwen-plus'
    }
    return 'deepseek-chat'
  }

  private getHeaders() {
    const apiKey = this.getApiKey()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  }

  private async callDeepSeekChat(messages: DeepSeekMessage[]): Promise<string> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('请先在设置中配置 API Key')
    }

    try {
      const baseUrl = this.getBaseUrl()
      const model = this.getModel()
      const isAliyun = baseUrl.includes('dashscope')
      
      if (isAliyun) {
        const response = await uni.request({
          url: baseUrl,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          data: {
            model: model,
            input: { messages: messages },
            parameters: { temperature: 0.7, max_tokens: 2000 }
          }
        })
        const result = (response.data as any).output?.choices?.[0]?.message?.content || ''
        if (!result && (response.data as any).output?.text) {
          return (response.data as any).output.text
        }
        return result
      }

      const response = await uni.request({
        url: `${baseUrl}/chat/completions`,
        method: 'POST',
        header: this.getHeaders(),
        data: {
          model: model,
          messages: messages,
          temperature: 0.7
        },
        timeout: 20000
      })

      if (response.data.error) {
        throw new Error(response.data.error.message || 'API 调用失败')
      }

      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content
      }
      return ''
    } catch (e: any) {
      console.error('DeepSeek API error:', e)
      throw new Error(e.message || 'AI 服务调用失败')
    }
  }

  private async analyzeImageWithVision(imageBase64: string, prompt: string): Promise<string> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('请先在设置中配置 API Key')
    }

    try {
      const baseUrl = this.getBaseUrl()
      const model = this.getModel()
      const isAliyun = baseUrl.includes('dashscope')

      if (isAliyun) {
        const response = await uni.request({
          url: baseUrl,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          data: {
            model: model,
            input: {
              messages: [{
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
                ]
              }]
            }
          }
        })
        return ((response.data as any).output?.choices?.[0]?.message?.content || (response.data as any).output?.text) || ''
      }

        const response = await uni.request({
          url: `${baseUrl}/chat/completions`,
          method: 'POST',
          header: this.getHeaders(),
          data: {
            model: model,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
                ]
              }
            ]
          },
          timeout: 20000
        })

      if (response.data.error) {
        throw new Error(response.data.error.message || 'API 调用失败')
      }

      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content
      }
      return ''
    } catch (e: any) {
      console.error('DeepSeek Vision API error:', e)
      throw new Error(e.message || 'AI 图像识别失败')
    }
  }

  async scanWords(imageBase64: string, wordList: string[] = []): Promise<WordScanResult> {
    if (this.isDemoMode()) {
      uni.showToast({
        title: '演示模式：返回模拟数据',
        icon: 'none',
        duration: 2000
      })
      await new Promise(resolve => setTimeout(resolve, 1500))
      return this.getMockWordScanResult()
    }

    const prompt = `你是一个英语学习助手。请识别图片中所有的英语单词。

请以JSON数组格式返回，每个单词包含：
[
  {"word": "单词(仅单词本身)", "phonetic": "/音标/", "definition": "中文释义", "example": "例句(可选)"},
  ...
]`

    try {
      const result = await this.analyzeImageWithVision(imageBase64, prompt)
      const jsonMatch = result.match(/\[[\s\S]*\]/)
      
      if (!jsonMatch) {
        return { words: [], notInList: [], scanDate: new Date().toISOString() }
      }

      const rawWords = JSON.parse(jsonMatch[0])
      
      const words: WordInfo[] = []
      const notInList: string[] = []

      for (const w of rawWords) {
        const word = (w.word || '').toLowerCase().trim()
        if (!word) continue

        const inList = wordList.length === 0 || wordList.some(
          (wl: string) => wl.toLowerCase() === word || wl.toLowerCase().includes(word)
        )

        words.push({
          word: w.word || '',
          phonetic: w.phonetic || '',
          definition: w.definition || '',
          example: w.example || '',
          mastery: 'unknown',
          inWordList: inList
        })

        if (!inList) {
          notInList.push(w.word)
        }
      }

      return {
        words: words.filter(w => w.inWordList),
        notInList,
        scanDate: new Date().toISOString()
      }
    } catch (e: any) {
      console.error('Scan words error:', e)
      throw e
    }
  }

  saveScannedWords(result: WordScanResult) {
    const existing = this.getWordScanHistory()
    existing.unshift(result)
    if (existing.length > 50) existing.pop()
    uni.setStorageSync(STORAGE_KEYS.SCAN_WORDS, existing)
  }

  getWordScanHistory(): WordScanResult[] {
    return uni.getStorageSync(STORAGE_KEYS.SCAN_WORDS) || []
  }

  clearScannedWordsHistory() {
    uni.removeStorageSync(STORAGE_KEYS.SCAN_WORDS)
  }

  async analyzeWrongQuestions(wrongQuestions: any[]): Promise<ScannedQuestion> {
    if (this.isDemoMode()) {
      uni.showToast({
        title: '演示模式：返回模拟数据',
        icon: 'none',
        duration: 2000
      })
      await new Promise(resolve => setTimeout(resolve, 1500))
      const result = this.getMockScannedQuestion()
      this.saveScannedQuestion(result)
      return result
    }

    const questionsText = wrongQuestions.slice(0, 20).map((q, i) => {
      return `${i + 1}. ${q.question || q.title || '题目'}${q.options ? '\n选项: ' + JSON.stringify(q.options) : ''}`
    }).join('\n\n')

    const prompt = `你是一个中考英语辅导老师。请分析以下用户的错题记录，识别薄弱知识点并给出学习建议。

错题记录：
${questionsText}

请分析并以JSON格式返回：
{
  "questionText": "以上错题的整体摘要描述",
  "type": "grammar|vocabulary|reading|listening|writing|cloze",
  "difficulty": "easy|medium|hard",
  "knowledgePoints": ["知识点1", "知识点2"],
  "analysis": "整体分析（用户在这些题目中暴露的问题）",
  "suggestion": "学习建议（具体告诉用户应该学习什么）",
  "relatedFeatures": ["grammar"|"words"|"reading"|"listening"|"writing"]
}`

    try {
      const messages: DeepSeekMessage[] = [
        { role: 'system', content: '你是一个专业的中考英语辅导老师，擅长分析学生的错题找出知识薄弱点。' },
        { role: 'user', content: prompt }
      ]

      const result = await this.callDeepSeekChat(messages)
      const jsonMatch = result.match(/\{[\s\S]*\}/)

      let questionText = ''
      let analysis: QuestionAnalysis
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        questionText = parsed.questionText || questionsText.slice(0, 200)
        const { questionText: _qt, ...rest } = parsed
        analysis = rest as QuestionAnalysis
      } else {
        questionText = questionsText.slice(0, 200)
        analysis = this.getDefaultQuestionAnalysis()
      }

      const saveResult: ScannedQuestion = {
        id: `sq_${Date.now()}`,
        questionText,
        analysis,
        source: 'wrong_questions',
        scanDate: new Date().toISOString()
      }

      this.saveScannedQuestion(saveResult)
      return saveResult
    } catch (e: any) {
      console.error('Analyze wrong questions error:', e)
      throw e
    }
  }

  async scanQuestionImage(imageBase64: string): Promise<ScannedQuestion> {
    if (this.isDemoMode()) {
      uni.showToast({
        title: '演示模式：返回模拟数据',
        icon: 'none',
        duration: 2000
      })
      await new Promise(resolve => setTimeout(resolve, 1500))
      const result = this.getMockScannedQuestion()
      result.source = 'upload'
      this.saveScannedQuestion(result)
      return result
    }

    const prompt = `你是一个中考英语辅导老师。请分析这张图片中的英语题目：

1. 识别并提取图片中的完整题目文本
2. 识别题目类型
3. 判断难度
4. 提取涉及的知识点
5. 给出详细解析
6. 给出学习建议

请以JSON格式返回：
{
  "questionText": "从图片中识别出的完整题目文本（包含题目、选项等所有内容）",
  "type": "grammar|vocabulary|reading|listening|writing|cloze|unknown",
  "difficulty": "easy|medium|hard",
  "knowledgePoints": ["知识点1"],
  "analysis": "详细解析",
  "suggestion": "学习建议",
  "relatedFeatures": ["grammar"|"words"|"reading"|"listening"|"writing"]
}`

    try {
      const result = await this.analyzeImageWithVision(imageBase64, prompt)
      const jsonMatch = result.match(/\{[\s\S]*\}/)

      let questionText = ''
      let analysis: QuestionAnalysis
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        questionText = parsed.questionText || ''
        const { questionText: _qt, ...rest } = parsed
        analysis = rest as QuestionAnalysis
      } else {
        questionText = ''
        analysis = this.getDefaultQuestionAnalysis()
      }

      const saveResult: ScannedQuestion = {
        id: `sq_${Date.now()}`,
        questionText,
        imageBase64: imageBase64.length > 1000 ? imageBase64.slice(0, 500) : imageBase64,
        analysis,
        source: 'upload',
        scanDate: new Date().toISOString()
      }

      this.saveScannedQuestion(saveResult)
      return saveResult
    } catch (e: any) {
      console.error('Scan question error:', e)
      throw e
    }
  }

  private getDefaultQuestionAnalysis(): QuestionAnalysis {
    return {
      type: 'unknown',
      difficulty: 'medium',
      knowledgePoints: [],
      analysis: '无法识别题目，请重试',
      suggestion: '请确保图片清晰',
      relatedFeatures: ['words', 'grammar']
    }
  }

  saveScannedQuestion(result: ScannedQuestion) {
    const existing = this.getScannedQuestionsList()
    existing.unshift(result)
    if (existing.length > 50) existing.pop()
    uni.setStorageSync(STORAGE_KEYS.SCANNED_QUESTIONS_LIST, existing)
  }

  getScannedQuestionsList(): ScannedQuestion[] {
    return uni.getStorageSync(STORAGE_KEYS.SCANNED_QUESTIONS_LIST) || []
  }

  getQuestionScanHistory(): ScannedQuestion[] {
    return this.getScannedQuestionsList()
  }

  addScannedQuestionToWrongQuestions(scanned: ScannedQuestion): boolean {
    try {
      const wrongQuestions = uni.getStorageSync('wrong_questions') || []
      wrongQuestions.unshift({
        id: `wrong_scan_${Date.now()}`,
        question_id: scanned.id || `scan_${Date.now()}`,
        question: scanned.questionText,
        options: [],
        your_answer: '',
        correct_answer: '',
        explanation: `${scanned.analysis.analysis}\n\n建议：${scanned.analysis.suggestion}`,
        type: scanned.analysis.type,
        tags: scanned.analysis.knowledgePoints,
        date: scanned.scanDate,
        reviewed: false,
        mastery: 'unmastered',
        review_count: 0,
        last_review_time: '',
        next_review_date: ''
      })
      uni.setStorageSync('wrong_questions', wrongQuestions)
      return true
    } catch (e) {
      console.error('Failed to add to wrong questions:', e)
      return false
    }
  }

  saveWordsToBook(result: WordScanResult): void {
    try {
      const existing = this.getScannedWordsList()
      const now = new Date().toISOString()
      const existingWords = new Set(existing.map(w => w.word.toLowerCase()))
      
      for (const w of result.words) {
        if (!existingWords.has(w.word.toLowerCase())) {
          existing.push({
            id: `sw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            word: w.word,
            phonetic: w.phonetic || '',
            definition: w.definition || '',
            example: w.example || '',
            mastered: false,
            scannedAt: now,
            source: 'ai_scan'
          })
          existingWords.add(w.word.toLowerCase())
        }
      }
      
      for (const word of result.notInList) {
        if (!existingWords.has(word.toLowerCase())) {
          existing.push({
            id: `sw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            word,
            phonetic: '',
            definition: '',
            example: '',
            mastered: false,
            scannedAt: now,
            source: 'ai_scan'
          })
          existingWords.add(word.toLowerCase())
        }
      }
      
      if (existing.length > 500) existing.splice(0, existing.length - 500)
      uni.setStorageSync(STORAGE_KEYS.SCANNED_WORDS_LIST, existing)
    } catch (e) {
      console.error('Failed to save scanned words:', e)
    }
  }

  getScannedWordsList(): ScannedWord[] {
    return uni.getStorageSync(STORAGE_KEYS.SCANNED_WORDS_LIST) || []
  }

  updateScannedWordMastery(id: string, mastered: boolean): void {
    const list = this.getScannedWordsList()
    const idx = list.findIndex(w => w.id === id)
    if (idx >= 0) {
      list[idx].mastered = mastered
      uni.setStorageSync(STORAGE_KEYS.SCANNED_WORDS_LIST, list)
    }
  }

  deleteScannedWord(id: string): void {
    const list = this.getScannedWordsList()
    uni.setStorageSync(STORAGE_KEYS.SCANNED_WORDS_LIST, list.filter(w => w.id !== id))
  }

  getScannedWordStats(): { total: number; mastered: number; unmastered: number } {
    const list = this.getScannedWordsList()
    return {
      total: list.length,
      mastered: list.filter(w => w.mastered).length,
      unmastered: list.filter(w => !w.mastered).length
    }
  }

  async generateLearningReport(period: 'day' | 'week' | 'month' | 'custom', 
                                startDate?: string, endDate?: string): Promise<LearningReport> {
    if (this.isDemoMode()) {
      uni.showToast({
        title: '演示模式：返回模拟数据',
        icon: 'none',
        duration: 2000
      })
      await new Promise(resolve => setTimeout(resolve, 2000))
      const report = this.getMockLearningReport(period)
      this.saveLearningReport(report)
      return report
    }

    const now = new Date()
    let start: Date
    let end: Date = now

    switch (period) {
      case 'day':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        start = startDate ? new Date(startDate) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        end = endDate ? new Date(endDate) : now
        break
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    const learningRecords = this.getLearningData(start, end)
    const user = authService.getUser()

    const prompt = `你是一个中考英语智能辅导老师。请根据用户的学习数据分析并生成个性化学习报告。

分析时间范围：${start.toLocaleDateString()} 至 ${end.toLocaleDateString()}

用户学习数据：
${JSON.stringify(learningRecords)}

用户基本信息：
- 已学单词数：${user?.learnedWords || 0}
- 错题数：${user?.wrongQuestions || 0}
- 连续学习天数：${user?.streakDays || 0}

请生成学习报告，包括：
1. 学习总结（单词数、学习时长、准确率）
2. 知识点掌握雷达（语法/词汇/阅读/听力/写作各0-100分）
3. 薄弱点TOP5及提升建议
4. 每日学习进度
5. 下一步学习计划

请以JSON格式返回：
{
  "summary": {
    "totalWords": 数字,
    "learnedWords": 数字,
    "wrongQuestions": 数字,
    "streakDays": 数字,
    "totalStudyTime": 数字,
    "accuracy": 0-100数字
  },
  "knowledgeRadar": {
    "grammar": 0-100数字,
    "vocabulary": 0-100数字,
    "reading": 0-100数字,
    "listening": 0-100数字,
    "writing": 0-100数字
  },
  "weakPoints": [
    {"topic": "topic", "description": "description", "priority": 1-5, "suggestion": "suggestion", "relatedFeature": "grammar|words|reading|listening|writing"}
  ],
  "progress": [
    {"date": "日期", "wordsLearned": 数字, "accuracy": 0-100, "studyTime": 数字}
  ],
  "nextPlan": {
    "focus": ["重点1", "重点2"],
    "dailyGoal": 数字,
    "reason": "理由"
  }
}`

    try {
      const messages: DeepSeekMessage[] = [
        { role: 'system', content: '你是一个专业的中考英语辅导老师，擅长分析学生学习数据并给出个性化建议。' },
        { role: 'user', content: prompt }
      ]

      const result = await this.callDeepSeekChat(messages)
      const jsonMatch = result.match(/\{[\s\S]*\}/)

      let reportData: any
      if (jsonMatch) {
        reportData = JSON.parse(jsonMatch[0])
      } else {
        reportData = this.getDefaultReportData()
      }

      const report: LearningReport = {
        period,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        ...reportData
      }

      this.saveLearningReport(report)
      return report
    } catch (e: any) {
      console.error('Generate report error:', e)
      throw e
    }
  }

  private getLearningData(start: Date, end: Date): any {
    const records = uni.getStorageSync('learning_records') || []
    const filtered = records.filter((r: any) => {
      const date = new Date(r.date || r.createDate)
      return date >= start && date <= end
    })

    return {
      records: filtered,
      totalWords: filtered.reduce((sum: number, r: any) => sum + (r.wordsLearned || 0), 0),
      totalTime: filtered.reduce((sum: number, r: any) => sum + (r.studyTime || 0), 0),
      accuracy: filtered.length > 0 
        ? Math.round(filtered.reduce((sum: number, r: any) => sum + (r.accuracy || 0), 0) / filtered.length)
        : 0
    }
  }

  private getDefaultReportData() {
    return {
      summary: {
        totalWords: 0,
        learnedWords: 0,
        wrongQuestions: 0,
        streakDays: 0,
        totalStudyTime: 0,
        accuracy: 0
      },
      knowledgeRadar: {
        grammar: 50,
        vocabulary: 50,
        reading: 50,
        listening: 50,
        writing: 50
      },
      weakPoints: [],
      progress: [],
      nextPlan: {
        focus: ['每天背单词', '复习语法'],
        dailyGoal: 10,
        reason: '保持学习习惯'
      }
    }
  }

  saveLearningReport(report: LearningReport) {
    const existing = this.getLearningReportHistory()
    existing.unshift(report)
    if (existing.length > 20) existing.pop()
    uni.setStorageSync(STORAGE_KEYS.LEARNING_REPORTS, existing)
  }

  getLearningReportHistory(): LearningReport[] {
    return uni.getStorageSync(STORAGE_KEYS.LEARNING_REPORTS) || []
  }

  clearLearningReportHistory() {
    uni.removeStorageSync(STORAGE_KEYS.LEARNING_REPORTS)
  }

  async correctEssay(essay: string): Promise<string> {
    if (this.isDemoMode()) {
      uni.showToast({
        title: '演示模式：返回模拟数据',
        icon: 'none',
        duration: 2000
      })
      await new Promise(resolve => setTimeout(resolve, 2000))
      return `✅ 结构分析：\n\n文章采用三段式结构，层次清晰，逻辑连贯。\n\n🔍 语法问题：\n\n1. 第二段第一句建议使用定语从句，使句子更丰富。\n2. "very important" 可以升级为 "of great significance"。\n\n💡 词汇建议：\n\n1. "good" → "excellent" / "fantastic"\n2. "many" → "numerous" / "a variety of"\n\n📊 分数预测：\n\n根据中考评分标准，预计得分：14-16分（满分20分）\n\n建议：注意使用更多高级句型和词汇，结尾可以适当升华主题。`
    }

    const prompt = `你是一个专业的中考英语作文批改老师。请批改以下英语作文，按照中考英语作文评分标准进行评估。

作文内容：
${essay}

请从以下几个方面进行批改：
1. 文章结构分析（开头、主体、结尾）
2. 语法错误指出与纠正
3. 词汇使用建议（升级词汇推荐）
4. 高级句型推荐
5. 分数预测（满分20分）及理由
6. 总体改进建议

请用中文回复，格式清晰，便于用户理解。用 emoji 分隔各部分。`

    try {
      const messages: DeepSeekMessage[] = [
        { role: 'system', content: '你是一个专业的中考英语作文批改老师，擅长分析学生作文的问题并给出具体改进建议。评分标准：满分20分，15-16分为优秀，12-14分为良好，9-11分为及格，9分以下为不及格。' },
        { role: 'user', content: prompt }
      ]

      return await this.callDeepSeekChat(messages)
    } catch (e: any) {
      console.error('Essay correction error:', e)
      throw e
    }
  }

  getMockWordScanResult(): WordScanResult {
    return {
      words: [
        { word: 'abandon', phonetic: '/əˈbændən/', definition: '放弃；遗弃', example: 'They had to abandon their car in the snow.', mastery: 'unknown', inWordList: true },
        { word: 'ability', phonetic: '/əˈbɪləti/', definition: '能力', example: 'She has the ability to speak three languages.', mastery: 'unknown', inWordList: true },
        { word: 'able', phonetic: '/ˈeɪbl/', definition: '能够的', example: 'I am able to swim very well.', mastery: 'unknown', inWordList: true },
        { word: 'about', phonetic: '/əˈbaʊt/', definition: '关于；大约', example: 'What is the book about?', mastery: 'unknown', inWordList: true },
        { word: 'above', phonetic: '/əˈbʌv/', definition: '在...上面', example: 'The bird flew above the clouds.', mastery: 'unknown', inWordList: true }
      ],
      notInList: ['supercalifragilisticexpialidocious', 'antidisestablishmentarianism'],
      scanDate: new Date().toISOString()
    }
  }

  getMockScannedQuestion(): ScannedQuestion {
    return {
      id: `sq_mock_${Date.now()}`,
      questionText: '根据你的错题分析，你在定语从句方面的题目错误率较高，主要涉及关系代词和介词+关系代词的结构。',
      analysis: {
        type: 'grammar',
        difficulty: 'medium',
        knowledgePoints: ['定语从句', '关系代词', '名词性从句'],
        analysis: '根据错题分析，你在定语从句方面存在较大问题。主要体现在：1）关系代词选择不当；2）介词+which/whom结构掌握不牢；3）非限制性定语从句使用错误。',
        suggestion: '建议先复习定语从句的基本概念，重点掌握：that/which/who/whom的区别用法，介词+关系代词的结构，以及非限制性定语从句的使用场景。每天练习5道定语从句相关题目。',
        relatedFeatures: ['grammar', 'practice']
      },
      source: 'wrong_questions',
      scanDate: new Date().toISOString()
    }
  }

  getMockLearningReport(period: string): LearningReport {
    const now = new Date()
    let startDate: Date
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    return {
      period: period as any,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      summary: {
        totalWords: 3500,
        learnedWords: 127,
        wrongQuestions: 23,
        streakDays: 12,
        totalStudyTime: 840,
        accuracy: 72
      },
      knowledgeRadar: {
        grammar: 65,
        vocabulary: 78,
        reading: 58,
        listening: 45,
        writing: 52
      },
      weakPoints: [
        { topic: '定语从句', description: '关系代词选择错误率高', priority: 5, suggestion: '每天练习5道定语从句题，重点掌握that/which/who的区别', relatedFeature: 'grammar' },
        { topic: '听力理解', description: '长对话理解困难', priority: 4, suggestion: '每天听一篇听力材料，注意捕捉关键信息', relatedFeature: 'listening' },
        { topic: '写作表达', description: '句型单一，缺乏亮点', priority: 3, suggestion: '背诵10个高分句型，每周写2篇作文', relatedFeature: 'writing' },
        { topic: '阅读速度', description: '阅读时间不足', priority: 3, suggestion: '每天限时练习阅读理解，提高阅读速度', relatedFeature: 'reading' },
        { topic: '词汇运用', description: '单词拼写错误多', priority: 2, suggestion: '复习易错单词，加强拼写练习', relatedFeature: 'words' }
      ],
      progress: [
        { date: startDate.toISOString(), wordsLearned: 15, accuracy: 65, studyTime: 90 },
        { date: new Date(startDate.getTime() + 24 * 60 * 60 * 1000).toISOString(), wordsLearned: 18, accuracy: 70, studyTime: 100 },
        { date: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), wordsLearned: 12, accuracy: 68, studyTime: 80 },
        { date: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), wordsLearned: 20, accuracy: 75, studyTime: 110 },
        { date: new Date(startDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), wordsLearned: 16, accuracy: 72, studyTime: 95 },
        { date: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), wordsLearned: 22, accuracy: 78, studyTime: 120 },
        { date: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(), wordsLearned: 24, accuracy: 80, studyTime: 130 }
      ],
      nextPlan: {
        focus: ['定语从句专项训练', '听力精听练习', '高分作文句型背诵'],
        dailyGoal: 20,
        reason: '根据你的错题分析，定语从句和听力是你的主要薄弱点。建议每天花30分钟专门攻克定语从句，同时加强听力训练。'
      }
    }
  }

  async explainQuestion(
    question: string,
    options: string[],
    correctAnswer: string,
    userAnswer?: string,
    questionType?: string
  ): Promise<QuestionExplanation> {
    if (this.isDemoMode()) {
      uni.showToast({ title: '演示模式', icon: 'none', duration: 1500 })
      await new Promise(resolve => setTimeout(resolve, 1500))
      const wrongOpts = options.filter(o => o !== correctAnswer).slice(0, 2)
      return {
        correctAnswer,
        explanation: `这道题考查的是${questionType || '中考英语语法知识点'}。正确答案是${correctAnswer}。解题关键在于理解题目语境和语法规则。建议结合相关知识点进行复习。`,
        wrongOptionAnalysis: wrongOpts.map(o => ({ option: o, whyWrong: `选项"${o}"不符合该语法规则或语境要求，容易与正确选项混淆。` })),
        knowledgePoint: questionType || '语法',
        relatedGrammar: '时态/语态/从句',
        memoryTip: '做这类题时，先分析句子结构，再判断时态和主谓一致。',
        similarQuestion: `类似题目：The book ___ by millions of people. (is loved / loves / is loving) → 答案：is loved`
      }
    }

    const wrongOptStr = userAnswer
      ? `\n用户选择的答案：${userAnswer}\n用户选择的选项为什么错误需要特别说明：`
      : ''

    const prompt = `你是一个专业的中考英语辅导老师。请详细解析以下题目：

题目：${question}
选项：${options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}
正确答案：${correctAnswer}${wrongOptStr}

请以JSON格式返回：
{
  "correctAnswer": "正确答案",
  "explanation": "详细解析（为什么正确，100字左右）",
  "wrongOptionAnalysis": [{"option": "错误选项", "whyWrong": "为什么错误"}],
  "knowledgePoint": "知识点名称",
  "relatedGrammar": "相关语法点（可选）",
  "memoryTip": "记忆口诀或解题技巧（可选）",
  "similarQuestion": "同类题举例（可选）"
}`

    try {
      const messages: DeepSeekMessage[] = [
        { role: 'system', content: '你是一个专业的中考英语辅导老师，擅长详细解析题目错误原因，帮助学生真正理解知识点。' },
        { role: 'user', content: prompt }
      ]
      const result = await this.callDeepSeekChat(messages)
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return {
        correctAnswer,
        explanation: result.slice(0, 200),
        wrongOptionAnalysis: [],
        knowledgePoint: questionType || '语法'
      }
    } catch (e: any) {
      console.error('Explain question error:', e)
      throw e
    }
  }

  async queryWordDetails(word: string): Promise<WordDetails> {
    if (this.isDemoMode()) {
      uni.showToast({ title: '演示模式', icon: 'none', duration: 1500 })
      await new Promise(resolve => setTimeout(resolve, 1500))
      return {
        word,
        phonetic: '/ˈʌtəm/',
        definition: '自动的；无意识的',
        partOfSpeech: 'adj.',
        examples: [
          { sentence: `Life seems almost ${word} without challenges.`, translation: '没有挑战的生活似乎毫无意义。' },
          { sentence: `The machine works ${word}ically.`, translation: '这台机器自动运转。' }
        ],
        memoryTip: '词根 auto(自己) + matic(动的) → 自动的',
        commonMistakes: `容易与 ${word}ic (automatic的) 混淆，注意拼写差异。`,
        collocations: [`${word} control (自动控制)`, `fully ${word} (全自动)`]
      }
    }

    const prompt = `你是一个中考英语词汇专家。请查询单词 "${word}" 的详细信息。

请以JSON格式返回：
{
  "word": "${word}",
  "phonetic": "音标（KK音标）",
  "definition": "中文释义（中考高频义）",
  "partOfSpeech": "词性",
  "examples": [{"sentence": "例句", "translation": "中文翻译"}],
  "memoryTip": "记忆技巧或词根词缀分析（可选）",
  "commonMistakes": "常见错误或混淆（可选）",
  "collocations": ["常见搭配1", "常见搭配2"]
}`

    try {
      const messages: DeepSeekMessage[] = [
        { role: 'system', content: '你是一个专业的中考英语词汇专家，精通初中英语词汇教学，能够给出精准的释义、例句和记忆技巧。' },
        { role: 'user', content: prompt }
      ]
      const result = await this.callDeepSeekChat(messages)
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return {
        word,
        phonetic: '',
        definition: result.slice(0, 50),
        partOfSpeech: '',
        examples: [],
        memoryTip: '',
        commonMistakes: '',
        collocations: []
      }
    } catch (e: any) {
      console.error('Query word error:', e)
      throw e
    }
  }

  async explainGrammar(topic: string, existingContent?: string): Promise<GrammarExplanation> {
    if (this.isDemoMode()) {
      uni.showToast({ title: '演示模式', icon: 'none', duration: 1500 })
      await new Promise(resolve => setTimeout(resolve, 1500))
      return {
        summary: `关于${topic}的核心知识点总结。${topic}是中考英语的重要语法项目，需要掌握其基本用法和常见考点。`,
        keyRules: [`${topic}的基本用法规则1`, `${topic}的特殊情况规则2`, `与${topic}相关的重要考点`],
        commonMistakes: [`混淆${topic}与其他相似语法点`, `忽略特殊情况下的使用规则`],
        memoryTips: [`联想记忆法：将${topic}与生活中的例子联系起来`, `多做练习，加深理解`],
        aiExamples: [
          { sentence: `I am ${topic}ing English now.`, translation: '我正在学习英语。', analysis: '用现在分词形式表示正在进行。' }
        ]
      }
    }

    const contextStr = existingContent ? `\n用户已经学习过的内容：\n${existingContent.slice(0, 300)}\n\n请在讲解时补充新内容，不要重复。` : ''

    const prompt = `你是一个中考英语语法专家。请用通俗易懂的语言，深入讲解"${topic}"这个语法点。

${contextStr}

请以JSON格式返回：
{
  "summary": "通俗易懂的总结（50字内）",
  "keyRules": ["核心规则1", "核心规则2", "核心规则3"],
  "commonMistakes": ["易错点1", "易错点2"],
  "memoryTips": ["记忆口诀1", "记忆口诀2"],
  "aiExamples": [{"sentence": "例句英文", "translation": "中文翻译", "analysis": "语法分析"}]
}`

    try {
      const messages: DeepSeekMessage[] = [
        { role: 'system', content: '你是一个专业的中考英语语法老师，擅长用通俗易懂的语言解释复杂语法，擅长给出记忆口诀和常见错误分析。' },
        { role: 'user', content: prompt }
      ]
      const result = await this.callDeepSeekChat(messages)
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return {
        summary: result.slice(0, 100),
        keyRules: [],
        commonMistakes: [],
        memoryTips: [],
        aiExamples: []
      }
    } catch (e: any) {
      console.error('Explain grammar error:', e)
      throw e
    }
  }

  getUserContext(): { grade: string; weakPoints: string[]; streakDays: number } {
    try {
      const wrongQuestions = uni.getStorageSync('wrong_questions') || []
      const tagCounts: Record<string, number> = {}
      wrongQuestions.forEach((q: any) => {
        if (q.tags) {
          q.tags.forEach((t: string) => {
            tagCounts[t] = (tagCounts[t] || 0) + 1
          })
        }
        if (q.type) {
          tagCounts[q.type] = (tagCounts[q.type] || 0) + 1
        }
      })
      const weakPoints = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k]) => k)
      return {
        grade: '九年级',
        weakPoints,
        streakDays: 0
      }
    } catch {
      return { grade: '九年级', weakPoints: [], streakDays: 0 }
    }
  }
}

export const aiService = new AIService()
export type { QuestionAnalysis, WordInfo, WordScanResult, ScannedQuestion, ScannedWord, LearningReport }
