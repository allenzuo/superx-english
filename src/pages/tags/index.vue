<template>
  <view class="tags-page">
    <view class="section">
      <view class="section-header">
        <text class="title">我的标签</text>
        <button size="mini" @tap="showAddTag">+ 添加</button>
      </view>
      <view class="tags-list" v-if="myTags.length > 0">
        <view 
          v-for="tag in myTags" 
          :key="tag"
          class="tag-item"
        >
          <text>{{ tag }}</text>
          <text class="remove" @tap="removeTag(tag)">×</text>
        </view>
      </view>
      <view class="empty" v-else>
        还没有自定义标签
      </view>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="title">推荐标签</text>
      </view>
      <view class="tags-list">
        <view 
          v-for="tag in defaultTags" 
          :key="tag"
          class="tag-item"
          @tap="addTag(tag)"
        >
          <text>{{ tag }}</text>
          <text class="add">+</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="title">标签单词统计</text>
      </view>
      <view class="stats-list">
        <view 
          v-for="item in tagStats" 
          :key="item.tag"
          class="stat-item"
          @tap="viewWordsByTag(item.tag)"
        >
          <view class="tag-name">{{ item.tag }}</view>
          <view class="tag-count">{{ item.count }} 个单词</view>
        </view>
      </view>
    </view>

    <view class="add-modal" v-if="showModal">
      <view class="modal-content">
        <view class="modal-header">
          <text>添加标签</text>
          <text class="close" @tap="showModal = false">×</text>
        </view>
        <input 
          class="modal-input" 
          v-model="newTag" 
          placeholder="请输入标签名称"
          focus
        />
        <button class="modal-btn" @tap="confirmAddTag">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const myTags = ref<string[]>([])
const defaultTags = ref<string[]>([])
const tagStats = ref<Array<{ tag: string; count: number }>>([])
const showModal = ref(false)
const newTag = ref('')

onMounted(() => {
  loadTags()
})

function loadTags() {
  const saved = uni.getStorageSync('my_tags')
  myTags.value = saved || []
  
  defaultTags.value = [
    '高频词汇',
    '易错词',
    '中考必备',
    '初中全部',
    '名词',
    '动词',
    '形容词',
    '副词',
    '介词',
    '连词'
  ]
  
  tagStats.value = defaultTags.value.slice(0, 5).map(tag => ({
    tag,
    count: Math.floor(Math.random() * 50) + 10
  }))
}

function showAddTag() {
  newTag.value = ''
  showModal.value = true
}

function confirmAddTag() {
  if (newTag.value.trim()) {
    if (!myTags.value.includes(newTag.value.trim())) {
      myTags.value.push(newTag.value.trim())
      uni.setStorageSync('my_tags', myTags.value)
    }
    showModal.value = false
  }
}

function addTag(tag: string) {
  if (!myTags.value.includes(tag)) {
    myTags.value.push(tag)
    uni.setStorageSync('my_tags', myTags.value)
    uni.showToast({ title: '已添加', icon: 'success' })
  }
}

function removeTag(tag: string) {
  myTags.value = myTags.value.filter(t => t !== tag)
  uni.setStorageSync('my_tags', myTags.value)
}

function viewWordsByTag(tag: string) {
  uni.showToast({ title: `${tag} 单词开发中`, icon: 'none' })
}
</script>

<style scoped>
.tags-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 16px;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
  color: #333;
}

.tag-item .remove {
  color: #ff4d4f;
  font-size: 18px;
}

.tag-item .add {
  color: #667eea;
  font-size: 18px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 20px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.tag-name {
  font-size: 14px;
  color: #333;
}

.tag-count {
  font-size: 12px;
  color: #667eea;
}

.add-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  width: 80%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-header .close {
  font-size: 24px;
  color: #999;
}

.modal-input {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.modal-btn {
  background: #667eea;
  color: #fff;
}
</style>
