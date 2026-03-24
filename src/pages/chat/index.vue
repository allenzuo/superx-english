<template>
  <view class="chat-page">
    <scroll-view class="message-list" scroll-y :scroll-top="scrollTop">
      <view 
        v-for="msg in messages" 
        :key="msg.id"
        :class="['message', msg.role]"
      >
        <view class="avatar">
          {{ msg.role === 'user' ? '我' : 'AI' }}
        </view>
        <view class="content">
          {{ msg.content }}
        </view>
      </view>
      
      <view v-if="isTyping" class="message assistant">
        <view class="avatar">AI</view>
        <view class="content typing">
          <text>正在输入...</text>
        </view>
      </view>
    </scroll-view>

    <view class="input-area">
      <input 
        v-model="inputText" 
        placeholder="请输入问题..." 
        @confirm="sendMessage"
        :adjust-position="false"
      />
      <button @tap="sendMessage" :disabled="!inputText.trim() || isTyping">发送</button>
    </view>

    <view class="quick-questions" v-if="messages.length === 0">
      <view class="title">试试这样问：</view>
      <view 
        v-for="q in quickQuestions" 
        :key="q"
        class="question"
        @tap="sendQuickQuestion(q)"
      >
        {{ q }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { chatService } from '@/services/chat'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const messages = ref<Message[]>([])
const inputText = ref('')
const isTyping = ref(false)
const scrollTop = ref(0)

const quickQuestions = [
  '怎么背单词最有效？',
  '中考英语语法重点有哪些？',
  '听力怎么提高？',
  '阅读理解有什么技巧？',
  '写作怎么得高分？'
]

onMounted(() => {
  loadMessages()
})

function loadMessages() {
  messages.value = chatService.getMessages()
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return

  inputText.value = ''
  isTyping.value = true

  const response = await chatService.sendMessage(text)
  
  messages.value = chatService.getMessages()
  isTyping.value = false
  
  nextTick(() => {
    scrollTop.value = scrollTop.value + 100
  })
}

function sendQuickQuestion(question: string) {
  inputText.value = question
  sendMessage()
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.message-list {
  flex: 1;
  padding: 16px;
  padding-bottom: 100px;
}

.message {
  display: flex;
  margin-bottom: 16px;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #667eea;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.message.assistant .avatar {
  background: #52c41a;
}

.content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 12px;
}

.message.user .content {
  background: #667eea;
  color: #fff;
}

.message.assistant .content {
  background: #fff;
  color: #333;
}

.typing text {
  color: #999;
  font-style: italic;
}

.input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #eee;
}

.input-area input {
  flex: 1;
  height: 40px;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 0 16px;
  font-size: 14px;
}

.input-area button {
  margin-left: 12px;
  background: #667eea;
  color: #fff;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
}

.input-area button[disabled] {
  background: #ccc;
}

.quick-questions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  text-align: center;
}

.quick-questions .title {
  color: #999;
  font-size: 14px;
  margin-bottom: 16px;
}

.quick-questions .question {
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #667eea;
}
</style>
