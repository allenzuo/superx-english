<template>
  <view class="grammar-detail-page">
    <view class="header">
      <view class="title">{{ topicName }}</view>
      <view class="progress">共 {{ lessons.length }} 节课程</view>
    </view>

    <view v-if="isLoading" class="loading">
      <text>加载中...</text>
    </view>

    <scroll-view v-else class="lesson-list" scroll-y>
      <view 
        v-for="(lesson, index) in lessons" 
        :key="index"
        class="lesson-card"
        @tap="startLesson(lesson)"
      >
        <view class="lesson-number">{{ index + 1 }}</view>
        <view class="lesson-content">
          <view class="lesson-title">{{ lesson.title }}</view>
        </view>
        <view class="lesson-arrow">›</view>
      </view>
    </scroll-view>

    <view class="lesson-modal" v-if="currentLesson">
      <view class="modal-mask" @tap="closeLesson"></view>
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">{{ currentLesson.title }}</text>
          <text class="modal-close" @tap="closeLesson">✕</text>
        </view>
        
        <scroll-view class="modal-body" scroll-y>
          <view class="section">
            <view class="section-title">📖 语法讲解</view>
            <view class="grammar-content" v-html="formatContent(currentLesson.content)"></view>
          </view>

          <view class="section" v-if="currentLesson.examples && currentLesson.examples.length > 0">
            <view class="section-title">📝 例句</view>
            <view v-for="(ex, idx) in currentLesson.examples" :key="idx" class="example-item">
              <view class="example-sentence">{{ ex.sentence }}</view>
              <view class="example-translation">{{ ex.translation }}</view>
              <view class="example-analysis" v-if="ex.analysis">
                <text class="analysis-label">解析：</text>
                <text>{{ ex.analysis }}</text>
              </view>
            </view>
          </view>

          <view class="section" v-if="currentLesson.exercises && currentLesson.exercises.length > 0">
            <view class="section-title">✏️ 练习</view>
            <view 
              v-for="(ex, idx) in currentLesson.exercises" 
              :key="idx"
              class="exercise-item"
            >
              <view class="exercise-q">{{ idx + 1 }}. {{ ex.question }}</view>
              <view 
                v-for="(opt, optIdx) in Object.entries(ex.options)" 
                :key="optIdx"
                :class="['option', { 
                  selected: selectedAnswers[idx] === optIdx,
                  correct: showResults && opt[0] === ex.answer,
                  wrong: showResults && selectedAnswers[idx] === optIdx && opt[0] !== ex.answer
                }]"
                @tap="selectAnswer(idx, optIdx)"
              >
                <text class="opt-label">{{ opt[0] }}.</text>
                <text class="opt-text">{{ opt[1] }}</text>
              </view>
              <view class="explanation" v-if="showResults">
                <text class="explanation-label">解析：</text>
                <text>{{ ex.explanation }}</text>
              </view>
            </view>
          </view>
          </scroll-view>

        <view class="ai-grammar-panel" v-if="aiGrammarExplanation">
          <view class="ai-grammar-title">🤖 AI深度讲解</view>
          <view class="ai-grammar-section" v-if="aiGrammarExplanation.keyRules && aiGrammarExplanation.keyRules.length > 0">
            <view class="ai-section-title">📌 核心规则</view>
            <view class="ai-section-item" v-for="(rule, idx) in aiGrammarExplanation.keyRules" :key="idx">{{ rule }}</view>
          </view>
          <view class="ai-grammar-section" v-if="aiGrammarExplanation.commonMistakes && aiGrammarExplanation.commonMistakes.length > 0">
            <view class="ai-section-title">⚠️ 常见错误</view>
            <view class="ai-section-item" v-for="(m, idx) in aiGrammarExplanation.commonMistakes" :key="idx">{{ m }}</view>
          </view>
          <view class="ai-grammar-section" v-if="aiGrammarExplanation.memoryTips && aiGrammarExplanation.memoryTips.length > 0">
            <view class="ai-section-title">🧠 记忆技巧</view>
            <view class="ai-section-item" v-for="(tip, idx) in aiGrammarExplanation.memoryTips" :key="idx">{{ tip }}</view>
          </view>
          <view class="ai-grammar-section" v-if="aiGrammarExplanation.aiExamples && aiGrammarExplanation.aiExamples.length > 0">
            <view class="ai-section-title">📝 AI例句</view>
            <view class="ai-example" v-for="(ex, idx) in aiGrammarExplanation.aiExamples" :key="idx">
              <view class="ai-example-sentence">{{ ex.sentence }}</view>
              <view class="ai-example-translation">{{ ex.translation }}</view>
              <view class="ai-example-analysis" v-if="ex.analysis">{{ ex.analysis }}</view>
            </view>
          </view>
          <button class="ai-close-btn" @tap="closeAIGrammar">收起AI解析</button>
        </view>

        <view class="modal-footer">
          <button class="ai-deep-btn" @tap="askAIGrammar">
            🤖 AI深入讲解
          </button>
          <button v-if="!showResults && currentLesson.exercises" @tap="checkAnswers">检查答案</button>
          <button v-else type="primary" @tap="closeLesson">完成学习</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { grammarService, type GrammarLesson } from '@/services/grammar'
import { aiService } from '@/services/ai'

const topicId = ref('')
const topicName = ref('语法学习')
const lessons = ref<GrammarLesson[]>([])
const currentLesson = ref<GrammarLesson | null>(null)
const selectedAnswers = ref<number[]>([])
const showResults = ref(false)
const isLoading = ref(true)
const aiGrammarLoading = ref(false)
const aiGrammarExplanation = ref<any>(null)

onMounted(async () => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const options = (page as any).options || {}
  
  if (options.id) {
    topicId.value = options.id
    topicName.value = decodeURIComponent(options.name || '语法学习')
    
    await grammarService.loadGrammar()
    lessons.value = grammarService.getLessonsByTopicId(topicId.value)
  }
  isLoading.value = false
})

function startLesson(lesson: GrammarLesson) {
  currentLesson.value = lesson
  selectedAnswers.value = new Array(lesson.exercises?.length || 0).fill(-1)
  showResults.value = false
}

function closeLesson() {
  currentLesson.value = null
  aiGrammarExplanation.value = null
}

async function askAIGrammar() {
  if (!currentLesson.value || aiGrammarLoading.value) return
  aiGrammarLoading.value = true
  uni.showLoading({ title: 'AI分析中...' })
  try {
    aiGrammarExplanation.value = await aiService.explainGrammar(
      currentLesson.value.title,
      currentLesson.value.content || ''
    )
  } catch (e) {
    console.error('AI grammar error:', e)
    uni.showToast({ title: 'AI解析失败', icon: 'none' })
  }
  aiGrammarLoading.value = false
  uni.hideLoading()
}

function closeAIGrammar() {
  aiGrammarExplanation.value = null
}

function selectAnswer(qIdx: number, optIdx: number) {
  if (showResults.value) return
  selectedAnswers.value[qIdx] = optIdx
}

function checkAnswers() {
  showResults.value = true
}

function formatContent(content: string): string {
  if (!content) return ''
  
  // Split into lines
  const lines = content.split('\n')
  const result: string[] = []
  let i = 0
  
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Empty line - skip
    if (trimmed === '') {
      i++
      continue
    }
    
    // H2 Header
    if (trimmed.startsWith('## ')) {
      result.push(`<div style="font-size:18px;font-weight:bold;color:#1a1a1a;margin:16px 0 10px 0;padding:6px 0;border-bottom:2px solid #667eea;">${parseInline(trimmed.substring(3))}</div>`)
      i++
      continue
    }
    
    // H3 Header
    if (trimmed.startsWith('### ')) {
      result.push(`<div style="font-size:16px;font-weight:bold;color:#333;margin:14px 0 8px 0;padding:6px 8px;border-left:4px solid #667eea;background:#f8f9ff;">${parseInline(trimmed.substring(4))}</div>`)
      i++
      continue
    }
    
    // H4 Header
    if (trimmed.startsWith('#### ')) {
      result.push(`<div style="font-size:15px;font-weight:bold;color:#444;margin:12px 0 6px 0;">${parseInline(trimmed.substring(5))}</div>`)
      i++
      continue
    }
    
    // Table detection - starts with |
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      result.push(parseTable(tableLines))
      continue
    }
    
    // Unordered list
    if (trimmed.match(/^[-*] /)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^[-*] /)) {
        const itemText = lines[i].trim().substring(2)
        items.push(`<div style="margin:6px 0 6px 16px;padding-left:8px;">• ${parseInline(itemText)}</div>`)
        i++
      }
      result.push(`<div style="margin:8px 0;">${items.join('')}</div>`)
      continue
    }
    
    // Bullet list (• marker)
    if (trimmed.startsWith('• ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('• ')) {
        const itemText = lines[i].trim().substring(2)
        // Check for indented sub-content
        const subItems: string[] = []
        let j = i + 1
        while (j < lines.length) {
          const nextLine = lines[j]
          if (nextLine.match(/^[\s]{2,}[\S]/) || nextLine.startsWith('\t') || nextLine.startsWith('>')) {
            const subText = nextLine.replace(/^[\s]{1,3}/, '').trim()
            if (subText) {
              subItems.push(`<div style="margin:4px 0 4px 32px;font-size:14px;color:#555;line-height:1.8;">${parseInline(subText)}</div>`)
            }
            j++
          } else {
            break
          }
        }
        const itemContent = `<div style="margin:6px 0 6px 8px;font-size:15px;color:#333;line-height:1.9;">`
          + `<div style="margin-bottom:2px;"><span style="color:#c41e3a;font-weight:bold;margin-right:4px;">•</span>${parseInline(itemText)}</div>`
          + (subItems.length > 0 ? subItems.join('') : '')
          + `</div>`
        items.push(itemContent)
        i = j
      }
      result.push(`<div style="margin:8px 0;">${items.join('')}</div>`)
      continue
    }

    // Ordered list - detect number and handle indentation
    if (trimmed.match(/^\d+\. /)) {
      const items: string[] = []
      while (i < lines.length) {
        const currLine = lines[i].trim()
        // Check if this is an ordered list item
        const numMatch = currLine.match(/^(\d+)\.\s+(.*)/)
        if (!numMatch) break
        const origNum = numMatch[1]
        let itemText = numMatch[2]
        i++

        // Check if next lines are indented (sub-content / examples)
        const subItems: string[] = []
        while (i < lines.length) {
          const nextLine = lines[i]
          // Indented line (starts with 2+ spaces or \t or >)
          if (nextLine.match(/^[\s]{2,}[\S]/) || nextLine.startsWith('\t') || nextLine.startsWith('>')) {
            const subText = nextLine.replace(/^[\s]{1,3}/, '').trim()
            if (subText) {
              subItems.push(`<div style="margin:4px 0 4px 32px;font-size:14px;color:#555;line-height:1.8;">${parseInline(subText)}</div>`)
            }
            i++
          } else {
            break
          }
        }

        // Build item: original number + parsed text + sub-items
        const itemContent = `<div style="margin:6px 0;font-size:15px;color:#333;line-height:1.9;">`
          + `<div style="font-weight:bold;color:#1a1a1a;margin-bottom:2px;">${origNum}. ${parseInline(itemText)}</div>`
          + (subItems.length > 0 ? subItems.join('') : '')
          + `</div>`
        items.push(itemContent)
      }
      result.push(`<div style="margin:8px 0 8px 8px;">${items.join('')}</div>`)
      continue
    }

    // Regular paragraph
    const paraLines: string[] = []
    while (i < lines.length) {
      const curr = lines[i].trim()
      if (curr === '') break
      if (curr.startsWith('|')) break
      if (curr.startsWith('###')) break
      if (curr.startsWith('##')) break
      if (curr.match(/^[-*] /)) break
      if (curr.match(/^• /)) break
      if (curr.match(/^\d+\. /)) break
      paraLines.push(lines[i])
      i++
    }

    if (paraLines.length > 0) {
      // Each line as its own paragraph div
      const paraDivs = paraLines.map(line => {
        const text = line.trim()
        return `<div style="font-size:15px;color:#333;line-height:1.9;margin:10px 0;text-align:justify;">${parseInline(text)}</div>`
      })
      result.push(paraDivs.join(''))
    }
  }

  return result.join('')
}

// Parse inline markdown (bold, italic, code, etc.) - using inline styles
function parseInline(text: string): string {
  if (!text) return ''
  
  const parts: string[] = []
  let lastEnd = 0
  
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g
  let match
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastEnd) {
      parts.push(escapeHtml(text.substring(lastEnd, match.index)))
    }
    
    if (match[1].startsWith('***')) {
      parts.push(`<span style="color:#c41e3a;font-weight:bold;font-style:italic;">${match[2]}</span>`)
    } else if (match[1].startsWith('**')) {
      parts.push(`<span style="color:#c41e3a;font-weight:bold;">${match[3]}</span>`)
    } else if (match[1].startsWith('*')) {
      parts.push(`<span style="color:#1890ff;font-style:italic;">${match[4]}</span>`)
    } else if (match[1].startsWith('`')) {
      parts.push(`<span style="background:#f0f0f0;padding:2px 4px;border-radius:3px;font-family:monospace;color:#c41e3a;">${match[5]}</span>`)
    }
    
    lastEnd = match.index + match[0].length
  }
  
  if (lastEnd < text.length) {
    parts.push(escapeHtml(text.substring(lastEnd)))
  }
  
  return parts.join('')
}

// Parse table with inline styles
function parseTable(tableLines: string[]): string {
  if (tableLines.length < 2) return ''
  
  const rows: string[] = []
  let isHeader = true
  
  for (const line of tableLines) {
    if (line.trim().match(/^\|[-:\s|]+\|$/)) {
      isHeader = false
      continue
    }
    
    const cells = line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim())
    
    if (cells.length > 0) {
      const cellHtml = cells.map(cell => {
        const cellContent = parseInline(cell)
        if (isHeader) {
          return `<div style="flex:1;padding:8px 6px;font-weight:bold;color:#333;border-bottom:2px solid #667eea;word-break:break-word;">${cellContent}</div>`
        } else {
          return `<div style="flex:1;padding:8px 6px;color:#666;border-bottom:1px solid #eee;word-break:break-word;">${cellContent}</div>`
        }
      }).join('')
      
      const bgStyle = isHeader ? 'background:#f8f9ff;' : ''
      rows.push(`<div style="display:flex;${bgStyle}border-bottom:1px solid #eee;">${cellHtml}</div>`)
    }
  }
  
  return `<div style="margin:12px 0;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">${rows.join('')}</div>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
</script>

<style scoped>
.grammar-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  color: #fff;
}

.title {
  font-size: 20px;
  font-weight: bold;
}

.progress {
  font-size: 14px;
  opacity: 0.8;
  margin-top: 8px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #999;
}

.lesson-list {
  padding: 12px;
  height: calc(100vh - 100px);
}

.lesson-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.lesson-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #667eea;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 16px;
}

.lesson-content {
  flex: 1;
}

.lesson-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.lesson-arrow {
  font-size: 24px;
  color: #ccc;
}

.lesson-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 20px 20px 0 0;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 24px;
  color: #999;
}

.modal-body {
  flex: 1;
  padding: 20px;
  max-height: 60vh;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.grammar-content {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
}

.example-item {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.example-sentence {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
}

.example-translation {
  font-size: 13px;
  color: #999;
}

.example-analysis {
  font-size: 13px;
  color: #667eea;
  margin-top: 8px;
  padding: 8px;
  background: #f0f4ff;
  border-radius: 6px;
}

.analysis-label {
  font-weight: bold;
  margin-right: 4px;
}

.exercise-item {
  margin-bottom: 16px;
}

.exercise-q {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  font-weight: 500;
}

.option {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  margin-bottom: 6px;
}

.option.selected {
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid #667eea;
}

.option.correct {
  background: rgba(82, 196, 26, 0.1);
  border: 1px solid #52c41a;
}

.option.wrong {
  background: rgba(255, 77, 79, 0.1);
  border: 1px solid #ff4d4f;
}

.opt-label {
  font-weight: bold;
  margin-right: 8px;
  color: #666;
}

.opt-text {
  font-size: 14px;
  color: #333;
}

.explanation {
  background: #fffbe6;
  padding: 10px;
  border-radius: 6px;
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}

.explanation-label {
  color: #faad14;
  font-weight: bold;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.modal-footer button {
  width: 100%;
  height: 44px;
}

.ai-deep-btn {
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  margin-bottom: 12px;
}

.ai-grammar-panel {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  background: #f8f9ff;
  max-height: 400rpx;
  overflow-y: auto;
}

.ai-grammar-title {
  font-size: 16px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 16px;
}

.ai-grammar-section {
  margin-bottom: 16px;
}

.ai-section-title {
  font-size: 14px;
  font-weight: bold;
  color: #555;
  margin-bottom: 8px;
}

.ai-section-item {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  padding: 4px 0;
  border-bottom: 1rpx solid #eee;
}

.ai-example {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}

.ai-example-sentence {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.ai-example-translation {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.ai-example-analysis {
  font-size: 12px;
  color: #667eea;
}

.ai-close-btn {
  width: 100%;
  height: 36px;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  margin-top: 8px;
}
</style>
