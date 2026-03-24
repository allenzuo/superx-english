# AI 识题闭环实现计划

## 目标
让用户能够：1) 查看识别出的题目全文，2) 保存到错题本，3) 从历史记录中查看详情，4) 跳转到相关语法学习。

## 架构
- 扩展 `QuestionScanResult` 接口，添加 `questionText` 字段保存AI从图片中提取的题目原文
- 新建 `scan/question-detail.vue` 页面，展示：原始图片 + 提取的题目 + AI分析 + 操作按钮
- 更新 history tab，点击条目跳转到 detail 页面
- 添加"加入错题本"功能

## 涉及文件

### 1. `src/services/types.ts`
添加 `ScannedQuestion` 接口（用于详细展示）：

```typescript
export interface ScannedQuestion {
  id: string
  questionText: string      // AI从图片提取的题目原文
  imagePath?: string        // 原始图片路径（本地存储）
  analysis: QuestionAnalysis
  source: 'wrong_questions' | 'upload'
  scanDate: string
}
```

### 2. `src/services/ai.ts`
- 修改 `scanQuestionImage()`: 从AI返回中提取 `questionText` 字段，保存到 `ScannedQuestion`
- 修改 `analyzeWrongQuestions()`: 同样保存 `questionText`
- 更新 `QuestionScanResult` 接口在 ai.ts 中的定义（删除旧定义，改为从 types.ts import）
- 添加 `saveToWrongQuestions(result: ScannedQuestion)` 方法：把扫描结果转为 `WrongQuestion` 存入错题本
- 更新 STORAGE_KEYS 添加 `SCAN_QUESTIONS_DETAIL`

### 3. `src/pages/scan/question-detail.vue` (新建)
新建页面，展示扫描题目的完整信息：

**模板内容**：
- 顶部：原始图片（如果有）
- 题目文本区域
- AI分析卡片：题目类型、难度、知识点标签
- 详细分析文本
- 学习建议文本
- 底部操作栏：「加入错题本」「查看相关语法」「继续扫描」

**脚本逻辑**：
- `onLoad()` 从 `options.id` 或 `options.index` 加载存储的 `ScannedQuestion`
- `saveToWrongQuestions()` 调用 ai.ts 的方法
- `goToGrammar()` 根据 knowledgePoints 导航到对应语法页面

### 4. `src/pages/scan/question.vue`
- 修改 history tab item，点击后 `navigateTo` 到 `/pages/scan/question-detail` 页面，传入 `id`
- 传入 `index` 参数用于 detail 页面反向查询

## 实现步骤

### Step 1: 更新 types.ts
添加 ScannedQuestion 接口

### Step 2: 更新 ai.ts
- 扩展 STORAGE_KEYS
- 修改 scanQuestionImage() 返回 ScannedQuestion 格式
- 修改 analyzeWrongQuestions() 返回 ScannedQuestion 格式  
- 添加 saveToWrongQuestions() 方法

### Step 3: 创建 question-detail.vue
完整实现详情页

### Step 4: 更新 scan/question.vue history tab
更新 viewHistoryDetail() 和 history item 点击事件

### Step 5: 注册页面
在 pages.json 添加 `pages/scan/question-detail` 条目
