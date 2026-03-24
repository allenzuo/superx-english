<template>
  <view class="wrong-page">
    <view class="tabs">
      <view 
        :class="['tab', { active: currentTab === 'unmastered' }]"
        @tap="switchTab('unmastered')"
      >
        未掌握 ({{ unmasteredCount }})
      </view>
      <view 
        :class="['tab', { active: currentTab === 'mastered' }]"
        @tap="switchTab('mastered')"
      >
        已掌握 ({{ masteredCount }})
      </view>
    </view>

    <scroll-view class="question-list" scroll-y>
      <view v-if="filteredQuestions.length === 0" class="empty">
        <text class="empty-icon">🎉</text>
        <text class="empty-text">太棒了！暂无错题</text>
        <text class="empty-hint">去真题练习积累错题吧</text>
      </view>
      
      <view 
        v-for="(item, index) in filteredQuestions" 
        :key="item.id"
        class="question-card"
        @tap="showDetail(item)"
      >
        <view class="question-header">
          <text class="question-type">{{ getTypeLabel(item.type) }}</text>
          <text class="question-date">{{ formatDate(item.date) }}</text>
          <text v-if="item.mastery === 'mastered'" class="reviewed-tag">已掌握</text>
          <text v-else class="unmastered-tag">复习{{ item.reviewCount }}次</text>
        </view>
        <view class="question-content">{{ item.question }}</view>
        
        <!-- Show options if available -->
        <view class="options" v-if="item.options && item.options.length > 0">
          <view 
            v-for="(opt, optIdx) in item.options" 
            :key="optIdx"
            :class="['option', { 
              correct: opt === item.correctAnswer,
              wrong: opt === item.yourAnswer && opt !== item.correctAnswer
            }]"
          >
            <text class="option-label">{{ String.fromCharCode(65 + optIdx) }}.</text>
            <text class="option-text">{{ opt }}</text>
          </view>
        </view>
        
        <view class="your-answer">
          <text class="label">你的答案：</text>
          <text class="answer wrong">{{ item.yourAnswer }}</text>
        </view>
        <view class="correct-answer" v-if="item.yourAnswer !== item.correctAnswer">
          <text class="label">正确答案：</text>
          <text class="answer correct">{{ item.correctAnswer }}</text>
        </view>
        <view class="explanation" v-if="item.explanation">
          <text class="label">解析：</text>
          <text class="explanation-text">{{ item.explanation }}</text>
        </view>
        <view class="actions">
          <button size="mini" @tap.stop="askAIForQuestion(item)">🤖 AI解析</button>
          <button size="mini" @tap.stop="removeFromWrong(item)">移出错题本</button>
          <button size="mini" type="primary" @tap.stop="retryQuestion(item)">重新作答</button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { wrongQuestionService, type WrongQuestion } from '@/services/wrongQuestion'
import { aiService } from '@/services/ai'

const currentTab = ref<'unmastered' | 'mastered'>('unmastered')

const wrongQuestions = ref<WrongQuestion[]>([])
const aiExplaining = ref<string | null>(null)
const aiExplanationContent = ref<any>(null)

const filteredQuestions = computed(() => {
  return wrongQuestionService.getQuestionsByMastery(currentTab.value)
})

const totalCount = computed(() => wrongQuestionService.getCount())
const unmasteredCount = computed(() => wrongQuestionService.getUnmasteredCount())
const masteredCount = computed(() => wrongQuestionService.getMasteredCount())

onMounted(() => {
  console.log('=== wrong/index onMounted ===')
  wrongQuestionService.loadQuestions()
  loadWrongQuestions()
  console.log('=== wrong/index mounted done ===')
})

function loadWrongQuestions() {
  wrongQuestionService.loadQuestions()
  wrongQuestions.value = wrongQuestionService.getQuestions()
}

function switchTab(tab: 'unmastered' | 'mastered') {
  currentTab.value = tab
  wrongQuestions.value = wrongQuestionService.getQuestionsByMastery(tab)
  aiExplaining.value = null
  aiExplanationContent.value = null
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'single': '单选题',
    'grammar': '语法',
    'vocabulary': '词汇',
    'reading': '阅读',
    'listening': '听力',
    'writing': '写作',
    'cloze': '完形填空',
    'dialogue': '情景对话'
  }
  return labels[type] || type
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function showDetail(item: WrongQuestion) {
  const questionData = encodeURIComponent(JSON.stringify(item))
  uni.navigateTo({
    url: `/pages/wrong/detail?data=${questionData}`
  })
}

function removeFromWrong(item: WrongQuestion) {
  wrongQuestionService.updateMastery(item.questionId, 'mastered')
  wrongQuestions.value = wrongQuestionService.getQuestionsByMastery(currentTab.value)
  uni.showToast({ title: '已移到已掌握', icon: 'success' })
}

async function askAIForQuestion(item: WrongQuestion) {
  if (aiExplaining.value === item.questionId) return
  aiExplaining.value = item.questionId
  uni.showLoading({ title: 'AI分析中...' })
  try {
    const explanation = await aiService.explainQuestion(
      item.question,
      item.options || [],
      item.correctAnswer,
      item.yourAnswer,
      item.type
    )
    aiExplanationContent.value = explanation
    uni.showModal({
      title: `🤖 AI解析：${item.topic || item.type}`,
      content: formatAIExplanation(explanation),
      showCancel: false,
      confirmText: '知道了'
    })
  } catch (e) {
    console.error('AI explanation error:', e)
    uni.showToast({ title: 'AI解析失败', icon: 'none' })
  }
  aiExplaining.value = null
  uni.hideLoading()
}

function formatAIExplanation(exp: any): string {
  if (!exp) return '暂无解析'
  const parts: string[] = []
  if (exp.knowledgePoint) parts.push(`📚 知识点：${exp.knowledgePoint}`)
  if (exp.explanation) parts.push(`\n🔍 详细解析：${exp.explanation}`)
  if (exp.memoryTip) parts.push(`\n🧠 记忆技巧：${exp.memoryTip}`)
  if (exp.relatedGrammar) parts.push(`\n📖 相关语法：${exp.relatedGrammar}`)
  return parts.join('\n') || '暂无详细解析'
}

function retryQuestion(item: WrongQuestion) {
  // Navigate to practice page with the specific wrong question
  const questionData = encodeURIComponent(JSON.stringify({
    questionId: item.questionId,
    question: item.question,
    options: item.options,
    correctAnswer: item.correctAnswer,
    yourAnswer: item.yourAnswer,
    explanation: item.explanation,
    type: item.type,
    analysis: item.explanation
  }))
  uni.navigateTo({
    url: `/pages/exam/practice?type=wrongQuestion&data=${questionData}`
  })
}
</script>

<style scoped>
.wrong-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 12px;
  gap: 12px;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 12px;
  font-size: 15px;
  color: #666;
  background: #f5f5f5;
  border-radius: 8px;
}

.tab.active {
  background: #667eea;
  color: #fff;
  font-weight: bold;
}

.stats-bar {
  display: flex;
  background: #fff;
  padding: 20px;
  margin-bottom: 12px;
}

.stat {
  flex: 1;
  text-align: center;
}

.stat .value {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  display: block;
}

.stat .label {
  font-size: 12px;
  color: #999;
}

.question-list {
  padding: 12px;
  height: calc(100vh - 100px);
}

.empty {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #999;
}

.empty-hint {
  font-size: 14px;
  color: #ccc;
  margin-top: 8px;
}

.question-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.question-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.question-type {
  font-size: 12px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.question-date {
  font-size: 12px;
  color: #999;
  flex: 1;
}

.reviewed-tag {
  font-size: 12px;
  color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.unmastered-tag {
  font-size: 12px;
  color: #faad14;
  background: rgba(250, 173, 20, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.question-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
}

.options {
  margin-bottom: 12px;
}

.option {
  display: flex;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 14px;
}

.option.correct {
  background: rgba(82, 196, 26, 0.1);
  border: 1px solid #52c41a;
}

.option.wrong {
  background: rgba(255, 77, 79, 0.1);
  border: 1px solid #ff4d4f;
}

.option-label {
  margin-right: 8px;
  color: #666;
  font-weight: bold;
}

.option-text {
  color: #333;
}

.your-answer, .correct-answer {
  font-size: 14px;
  margin-bottom: 8px;
}

.your-answer .label, .correct-answer .label {
  color: #666;
}

.answer.wrong {
  color: #ff4d4f;
  font-weight: bold;
}

.answer.correct {
  color: #52c41a;
  font-weight: bold;
}

.explanation {
  background: #fffbe6;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.explanation .label {
  color: #faad14;
  font-weight: bold;
  font-size: 14px;
}

.explanation-text {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.actions button:first-child {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
}
</style>
