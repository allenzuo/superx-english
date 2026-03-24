# AI 识单词闭环实现计划

## 目标
让用户能够：1) 保存扫描的单词到生词本，2) 在单词本中专门查看"扫描生词"列表，3) 对扫描生词进行练习。

## 架构
- 新增 `ScannedWord` 接口，存储扫描的单词（含来源、是否已掌握）
- 在 `ai.ts` 中添加扫描单词的存储方法
- 实现 `scan/word.vue` 的 `saveToWordBook()` 和 `practiceWords()` 
- 在单词本模块新增「扫描生词」Tab
- 新建 `pages/words/scanned.vue` 展示和管理扫描的单词

## 涉及文件

### 1. `src/services/types.ts`
添加接口：
```typescript
export interface ScannedWord {
  id: string
  word: string
  phonetic?: string
  definition?: string
  example?: string
  mastered: boolean
  scannedAt: string
  source: 'ai_scan' | 'manual'
}
```

### 2. `src/services/ai.ts`
添加方法：
- `saveScannedWords(result: WordScanResult)` — 将扫描结果中的 words 数组保存为 ScannedWord 列表，追加到现有列表
- `getScannedWordsList(): ScannedWord[]` — 读取存储的扫描单词列表
- `updateScannedWordMastery(id: string, mastered: boolean)` — 更新某个单词的掌握状态
- `deleteScannedWord(id: string)` — 删除某个扫描单词
- 添加 STORAGE_KEY: `SCANNED_WORDS_LIST`

### 3. `src/pages/scan/word.vue`
实现两个空方法：
```typescript
// 加入生词本 — 保存到 ScannedWord 存储，显示 toast 提示
function saveToWordBook() {
  if (!wordResult.value) return
  aiService.saveScannedWords(wordResult.value)
  uni.showToast({ title: '已加入生词本', icon: 'success' })
}

// 开始练习 — 提取所有扫描单词，存入临时存储，导航到单词详情页（支持左右滑动）
function practiceWords() {
  if (!wordResult.value?.words.length) return
  const words = wordResult.value.words.map(w => ({
    word: w.word,
    phonetic: w.phonetic,
    type: '',
    meaning: w.definition,
    example: w.example,
    memory_methods: '',
    usage_notes: '',
    common_mistakes: '',
    example_sentences: w.example ? { exam: [w.example] } : undefined,
    example_translations: []
  }))
  const encoded = encodeURIComponent(JSON.stringify(words))
  uni.navigateTo({ url: `/pages/words/detail?wordList=${encoded}&currentIndex=0` })
}
```

### 4. `src/pages/words/index.vue`
添加第3个 Tab「扫描生词」：
```vue
<view class="tab-item" :class="{ active: currentTab === 2 }" @tap="switchTab(2)">
  扫描生词
</view>
```

添加逻辑：
- `currentTab === 2` 时加载扫描单词列表
- 从 aiService.getScannedWordsList() 获取
- 显示方式和现有单词类似，但标记来源为"扫描"

### 5. `src/pages/words/scanned.vue` (新建)
专门展示和管理扫描的单词：
- 顶部：统计（总数 / 已掌握 / 未掌握）
- 单词列表：每个单词显示 word + phonetic + definition + 掌握状态
- 每个单词可点击查看详情（导航到 detail.vue）
- 支持删除操作
- 支持标记掌握/未掌握

### 6. `src/pages/words/detail.vue`
需要支持从扫描单词列表传入数据。当传入的单词不在 words.json 中时，使用传入的 minimal data。

## 实现步骤

### Step 1: 更新 types.ts
添加 ScannedWord 接口

### Step 2: 更新 ai.ts
添加扫描单词的存储、读取、更新、删除方法

### Step 3: 实现 scan/word.vue 的 saveToWordBook 和 practiceWords

### Step 4: 创建 words/scanned.vue
完整实现扫描单词管理页面

### Step 5: 更新 words/index.vue
添加扫描生词 Tab 和对应逻辑

### Step 6: 更新 detail.vue
支持显示不在 words.json 中的单词数据

### Step 7: 注册新页面
在 pages.json 添加 `pages/words/scanned` 条目
