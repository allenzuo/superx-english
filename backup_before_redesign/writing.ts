interface WritingEssay {
  version: string
  type: string
  year: number
  difficulty: string
  source: string
  scoringCriteria: {
    fullScore: number
    levels: {
      level: string
      score: string
      description: string
    }[]
  }
  sampleEssays: {
    scene: string
    title: string
    requirements: string
    essays: {
      level: string
      score: number
      content: string
      analysis: string
    }[]
  }[]
}

interface WritingTip {
  title: string
  content: string
  icon: string
}

class WritingService {
  private essayData: WritingEssay | null = null
  private isLoaded = false

  async loadData(): Promise<void> {
    if (this.isLoaded) return
    
    try {
      const res = await new Promise<any>((resolve, reject) => {
        uni.request({
          url: '/static/data/writing_essay.json',
          success: (res) => resolve(res.data),
          fail: reject
        })
      })
      
      if (res) {
        this.essayData = res
        this.isLoaded = true
      }
    } catch (e) {
      console.error('Failed to load writing data:', e)
    }
  }

  getScoringCriteria() {
    return this.essayData?.scoringCriteria || null
  }

  getSampleEssays() {
    return this.essayData?.sampleEssays || []
  }

  getSampleEssaysCount(): number {
    return this.essayData?.sampleEssays?.length || 0
  }

  getWritingTips(): WritingTip[] {
    return [
      {
        title: '审题要仔细',
        content: '拿到作文题后，先仔细阅读题目要求，明确：\n• 写作类型（记叙文/议论文/说明文）\n• 字数要求\n• 必须包含的内容要点\n• 是否需要个人观点',
        icon: 'search'
      },
      {
        title: '结构要清晰',
        content: '中考英语作文通常采用三段式结构：\n• 开头：点明主题，引出下文\n• 主体：详细描述，适当发挥\n• 结尾：总结全文，升华主题',
        icon: 'view_agenda'
      },
      {
        title: '句型要多样',
        content: '避免只用简单句，尽量使用：\n• 并列句（and, but, or）\n• 复合句（when, if, because, that）\n• 高级句型（倒装、强调、非谓语）',
        icon: 'swap_horiz'
      },
      {
        title: '词汇要升级',
        content: '用高级词汇替代低级词汇：\n• good → excellent / fantastic\n• happy → delighted / thrilled\n• many → numerous / a variety of\n• important → significant / crucial',
        icon: 'text_fields'
      },
      {
        title: '过渡要自然',
        content: '使用过渡词使文章流畅：\n• 递进：also, besides, moreover\n• 转折：however, although, but\n• 总结：in conclusion, in short\n• 举例：for example, such as',
        icon: 'sync_alt'
      }
    ]
  }
}

export const writingService = new WritingService()
