<template>
  <view class="article-page">
    <scroll-view class="content" scroll-y>
      <view class="article-title">{{ article.title }}</view>
      <view class="article-content">{{ article.content }}</view>
      
      <view class="questions-section" v-if="article.questions && article.questions.length > 0">
        <view class="section-title">练习题</view>
        
        <view 
          v-for="(q, index) in article.questions" 
          :key="index"
          class="question-item"
        >
          <view class="question-text">{{ index + 1 }}. {{ q.question }}</view>
          <view class="options">
            <view 
              v-for="(option, optIndex) in q.options" 
              :key="optIndex"
              :class="['option', { 
                selected: answers[index] === optIndex,
                correct: showResult && q.answer === optIndex,
                wrong: showResult && answers[index] === optIndex && q.answer !== optIndex
              }]"
              @tap="selectAnswer(index, optIndex)"
            >
              {{ option }}
            </view>
          </view>
        </view>
      </view>
      
      <view class="empty" v-else>
        <text>暂无题目</text>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <button @tap="showResult = !showResult">
        {{ showResult ? '再答一次' : '查看答案' }}
      </button>
      <button type="primary" @tap="submitAnswer" v-if="!showResult">提交</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { readingPracticeService } from '@/services/readingPractice'

interface Question {
  question: string
  options: string[]
  answer: number
}

const article = ref<{
  title: string
  content: string
  questions: Question[]
}>({
  title: '',
  content: '',
  questions: []
})

const answers = ref<number[]>([])
const showResult = ref(false)
const articleType = ref('standard')

onLoad(async (options: any) => {
  let id = 0
  let type = 'standard'
  let title = ''
  
  if (options.id) {
    id = parseInt(options.id)
    type = options.type || 'standard'
    title = options.title || ''
  }
  
  articleType.value = type
  await loadArticle(id, title)
})

async function loadArticle(id: number, title: string) {
  let data: any[] = []
  
  switch (articleType.value) {
    case 'qa':
      data = await readingPracticeService.loadReadingQAData()
      break
    case 'multimodal':
      data = await readingPracticeService.loadMultimodalData()
      break
    case 'cloze_grammar':
      data = await readingPracticeService.loadClozeData()
      break
    default:
      data = await readingPracticeService.loadReadingData()
  }
  
  if (data && Array.isArray(data)) {
    const item = data[id]
    if (item) {
      const rawQuestions = item.questions || item.questionsList || item.exercises || []
      const questions = rawQuestions.map((q: any, idx: number) => {
        const options = q.options || {}
        const optionKeys = Object.keys(options)
        const optionValues = Object.values(options)
        const answerKey = q.answer || ''
        const answerIndex = optionKeys.indexOf(answerKey)
        
        return {
          question: q.question || q.title || '',
          options: optionValues,
          answer: answerIndex >= 0 ? answerIndex : 0
        }
      })
      
      article.value = {
        title: item.title || title || '阅读理解',
        content: item.passage || item.content || item.article || '',
        questions
      }
    }
  }
  answers.value = new Array(article.value.questions.length).fill(-1)
}

function selectAnswer(qIndex: number, optIndex: number) {
  if (!showResult.value) {
    answers.value[qIndex] = optIndex
  }
}

function submitAnswer() {
  let correct = 0
  answers.value.forEach((answer, index) => {
    if (answer === article.value.questions[index].answer) {
      correct++
    }
  })
  
  showResult.value = true
  
  uni.showModal({
    title: '答题结果',
    content: `你答对了 ${correct}/${article.value.questions.length} 题`,
    showCancel: false
  })
}
</script>

<style scoped>
.article-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 20px;
  padding-bottom: 100px;
}

.article-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
}

.article-content {
  font-size: 16px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 24px;
  white-space: pre-wrap;
}

.questions-section {
  margin-top: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.question-item {
  margin-bottom: 24px;
}

.question-text {
  font-size: 15px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 500;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option {
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  border: 1px solid #eee;
}

.option.selected {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.option.correct {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.option.wrong {
  border-color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 16px;
  display: flex;
  gap: 12px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}

.bottom-bar button {
  flex: 1;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
