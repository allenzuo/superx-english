# 中考英语·真题吃透 - 微信小程序设计文档

> 基于 Flutter superx 完整逆向分析
> 版本: 1.1
> 日期: 2026-03-11
> 更新: 增加听力话题、阅读6题型、诊断测试详细规格

---

## 目录

1. [项目概述](#1-项目概述)
2. [数据架构](#2-数据架构)
3. [页面清单](#3-页面清单)
4. [数据流向](#4-数据流向)
5. [服务层设计](#5-服务层设计)
6. [存储设计](#6-存储设计)
7. [交互设计](#7-交互设计)
8. [AI功能设计](#8-ai功能设计)
9. [实现优先级](#9-实现优先级)

---

## 1. 项目概述

### 1.1 应用信息

| 项目 | 内容 |
|------|------|
| 应用名称 | 中考英语·真题吃透 |
| 目标用户 | 初中生（初一~初三） |
| 核心功能 | 中考英语全科备考 |
| 技术框架 | uni-app (Vue 3 + TypeScript) |
| 目标平台 | 微信小程序 |

### 1.2 核心功能模块 (Flutter完整版)

```
首页 (Bottom Tab 0)
├── 学情诊断 (DiagnosticTestScreen)
│   └── 50题综合诊断: 听力8+单选12+完形10+阅读10+语法10
│       ├── 听力: short_dialogue(2) + long_dialogue(3) + monologue(3)
│       ├── 单选: 12题
│       ├── 完形: 10题
│       ├── 阅读: 10题
│       └── 语法: 10题
│   └── 诊断历史记录 (t_diagnosis_history)
│
├── 不背单词入口
│   ├── 单词百日斩 (HundredDaysScreen) - 每日30词
│   └── 选择年级 (GradeSelectionScreen) - 7个年级（三年级到九年级）
│
├── 今日任务 (DailyTasks) - 动态显示4个任务
│   ├── 单选题练习 → PracticeScreen(type: 'single')
│   ├── 阅读理解练习 → PracticeScreen(type: 'reading')
│   ├── 完形填空练习 → PracticeScreen(type: 'cloze')
│   └── 每日单词 → HundredScreen
│
├── 决胜中考 (8模块网格)
│   ├── 满分语法 → GrammarScreen(module: '冠词')
│   ├── 赢在听力 → ListeningTypeScreen
│   ├── 玩转短语 → GrammarScreen(module: '短语')
│   ├── 长难句 → GrammarScreen(module: '长难句')
│   ├── 完型填空 → GrammarScreen(module: '完形')
│   ├── 阅读理解 → ReadingScreen(type: 'reading')
│   ├── 高分作文 → WritingScreen
│   └── 情景对话 → GrammarScreen(module: '情景')
│
├── 做题小能手
│   ├── 按题型 → TypeSelectionScreen
│   │   ├── 单选题
│   │   ├── 完形填空
│   │   ├── 阅读理解
│   │   └── 情景对话
│   ├── 按年份 → YearSelectionScreen (2024-2008)
│   └── 作文专区 → WritingScreen
│
└── 薄弱点强化
    └── 动态显示用户薄弱知识点标签 → PracticeScreen(weakPoint)

单词本 (Bottom Tab 1)
├── 全部单词 (3508词)
├── 已掌握
└── 未掌握

错题本 (Bottom Tab 2)
├── 未掌握
└── 已掌握

我的 (Bottom Tab 3)
├── 个人资料
├── 学习统计
├── 成就徽章
├── 标签管理
└── 设置
```
---

## 2. 数据架构

### 2.1 数据文件清单

#### 2.1.1 单词数据

| 文件名 | 大小 | 数量 | 说明 |
|--------|------|------|------|
| `words.json` | ~8MB | 3508词 | 主词库（带例句、记忆法等） |
| `word_grades.json` | ~180KB | 9823条 | 单词→年级映射 |

**words.json 数据结构：**
```typescript
interface Word {
  id: string
  word: string              // 单词本身
  phonetic: string          // 音标 "/æt/"
  type: string             // 词性 "prep."
  meaning: string          // 含义 "在"
  frequency: number        // 词频
  example_sentences: {      // 例句
    exam: string[]          // 考试例句
    spoken: string[]        // 口语例句
  }
  example_translations: string[]  // 例句翻译
  usage_notes: string       // 用法提示
  common_mistakes: string   // 常见错误
  memory_methods: string   // 记忆方法
  mastery: 'unmastered' | 'mastering' | 'mastered'  // 掌握程度
  last_review_time: string  // 上次复习时间
}
```

**word_grades.json 数据结构：**
```typescript
interface WordGrade {
  word: string      // 单词
  grade: string    // 年级 (三年级~九年级)
  semester: string  // 学期 (上册/下册)
}
```

#### 2.1.2 题目数据

| 文件名 | 大小 | 数量 | 说明 |
|--------|------|------|------|
| `questions_shanghai_full.json` | ~700KB | 8298题 | 上海中考真题 |
| `listening_questions.json` | ~450KB | 7777题 | 听力题目 |

**听力话题分类 (topics):**
```
- 日常生活 (Daily Life)
- 学校生活 (School Life)
- 人与人之间的关系 (Relationships)
- 环境保护 (Environment)
- 健康 (Health)
- 饮食 (Food & Diet)
- 文化 (Culture)
- 购物 (Shopping)
- 旅游 (Travel)
- 交通 (Transportation)
- 职业 (Career)
- 兴趣爱好 (Hobbies)
- 节假日活动 (Holidays)
- 天气与气候 (Weather)
- 娱乐 (Entertainment)
```

**听力题型:**
```
- short_dialogue: 短对话 (2-3轮)
- long_dialogue: 长对话 (5-7轮)
- monologue: 独白
- dictation: 听写填空
```

**听力功能:**
- 速度控制: 0.75x / 1.0x / 1.25x
- 技能提示: 听力技巧解析 (提前看题、预测内容、捕捉关键词)

**questions_shanghai_full.json 数据结构：**
```typescript
interface Question {
  id: string
  year: number           // 年份 2008-2024
  type: string           // 类型: single, reading, cloze, dialogue
  difficulty: string     // 难度: easy, medium, hard
  content: string        // 题目内容
  options: { [key: string]: string }  // 选项 { A: "...", B: "...", ... }
  answer: string         // 正确答案 "A"
  analysis: string       // 解析
  tags: string[]         // 标签 ["名词", "冠词", ...]
  source: string         // 来源
  reading_article_id?: string  // 关联阅读文章ID
}
```

**listening_questions.json 数据结构：**
```typescript
interface ListeningQuestion {
  id: string
  type: string           // short_dialogue, long_dialogue, monologue, dictation
  topic: string          // 话题
  audio_text: string     // 听力原文
  question: string       // 问题
  options: string[]       // 选项
  correct_answer: number // 正确答案索引 0-3
  analysis: string       // 解析
  difficulty: number    // 难度 1-5
  year: number          // 年份
  tags: string[]        // 标签
}
```

#### 2.1.3 语法数据 (21个文件)

| 文件名 | 主题 | 包含内容 |
|--------|------|----------|
| `grammar_lessons_mingci.json` | 名词 | 3节课 |
| `grammar_lessons_guanci.json` | 冠词 | 3节课 |
| `grammar_lessons_daici.json` | 代词 | 4类 |
| `grammar_lessons_shuci.json` | 数词 | 4类 |
| `grammar_lessons_bijiaoji.json` | 形容词/副词 | 6级 |
| `grammar_lessons_qingtaidongci.json` | 情态动词 | 3节 |
| `grammar_lessons_dongcishitai.json` | 动词时态 | 12种 |
| `grammar_lessons_dongciyutai.json` | 动词语态 | 3节 |
| `grammar_lessons_lianci.json` | 连词 | 3节 |
| `grammar_lessons_jiandanju.json` | 简单句 | 3节 |
| `grammar_lessons_fuheju.json` | 复合句 | 3大类 |
| `grammar_lessons_zhuweiyizhi.json` | 主谓一致 | 3节 |
| `grammar_lessons_daozhuangju.json` | 倒装句 | 3节 |
| `grammar_lessons_feiweiyudongci.json` | 非谓语动词 | 3节 |
| `grammar_lessons_changnanju.json` | 长难句 | 语法融合 |
| `grammar_lessons_duanyu.json` | 短语 | 高频固定搭配 |
| `grammar_lessons_tingli.json` | 听力技巧 | 综合运用 |
| `grammar_lessons_wanxingtiankong.json` | 完形填空 | 3大类型 |
| `grammar_lessons_yuedulijie.json` | 阅读理解 | 4大题型 |
| `grammar_lessons_zuowen.json` | 作文 | 高分技巧 |
| `grammar_lessons_qingjingduihua.json` | 情景对话 | 10大场景 |

**语法文件数据结构：**
```typescript
interface GrammarTopic {
  id: string
  name: string           // "2-冠词-三大类冠词学习"
  icon: string           // 图标
  color: string         // 颜色
  lessons: GrammarLesson[]
}

interface GrammarLesson {
  id: string
  title: string         // 课程标题
  content: string      // 语法讲解 (Markdown格式)
  examples: GrammarExample[]
  exercises: GrammarExercise[]
}

interface GrammarExample {
  sentence: string      // 例句
  translation: string   // 翻译
  analysis: string     // 分析
}

interface GrammarExercise {
  question: string
  options: { [key: string]: string }
  answer: string
  explanation: string
}
```

**作文3Tab结构:**
```
Tab 1: 作文欣赏 - 范文展示
Tab 2: 仿写练习 - 模板仿写
Tab 3: AI批改 - DeepSeek智能批改

### 2.2 本地存储设计

#### 2.2.1 用户数据 (t_user_profile)

```typescript
interface UserProfile {
  id: number           // 用户ID (默认1)
  name: string        // 用户名
  avatar: string      // 头像URL
  level: number       // 等级
  exp: number         // 经验值
  
  // 扩展字段
  grade: string       // 当前年级 (七年级/八年级/九年级)
  school: string      // 学校
  target_school: string  // 目标高中
  study_goal: string  // 学习目标
  
  // 学习统计
  total_study_time: number  // 总学习时长(分钟)
  total_questions: number   // 总做题数
  correct_rate: number      // 总正确率
  streak_days: number       // 连续学习天数
  last_study_date: string   // 最后学习日期
  
  created_at: string   // 创建时间
  tags: string[]       // 自定义标签
  word_tags: { [word: string]: number }  // 单词标签
}
```

#### 2.2.2 错题数据 (t_wrong_questions)

```typescript
interface WrongQuestion {
  id: string                    // 记录ID
  question_id: string           // 原题ID
  question: string              // 题目内容
  options: string[]             // 选项
  your_answer: string          // 用户的答案
  correct_answer: string       // 正确答案
  explanation: string          // 解析
  type: string                 // 题目类型
  tags: string[]               // 标签
  date: string                 // 错题日期
  reviewed: boolean            // 是否已复习
  mastery: 'unmastered' | 'mastering' | 'mastered'  // 掌握程度
  review_count: number         // 复习次数
  last_review_time: string     // 上次复习时间
  next_review_date: string     // 下次复习日期 (艾宾浩斯遗忘曲线)
}
```

**复习间隔:** [1, 3, 7, 14, 30] 天

#### 2.2.3 薄弱点数据 (t_weak_points)

```typescript
interface WeakPoint {
  id: string
  tag: string              // 标签 (如"名词", "冠词")
  error_count: number      // 错误次数
  total_count: number      // 总答题次数
  correct_rate: number      // 正确率 0.0-1.0
  priority: number         // 优先级 1-5
  updated_at: string       // 更新时间
}
```

**优先级计算:**
- 正确率<30%: 优先级5
- 正确率<50%: 优先级4
- 正确率<70%: 优先级3
- 正确率<90%: 优先级2
- 其他: 优先级1

#### 2.2.4 学习记录 (t_learning_records)

```typescript
interface LearningRecord {
  id: string
  date: string           // 日期
  task_type: string      // 任务类型
  total_count: number    // 总题数
  correct_count: number  // 正确数
  study_time: number     // 学习时长(分钟)
  exp_gained: number     // 获得经验
}
```

#### 2.2.5 每日任务 (t_daily_tasks)

```typescript
interface DailyTask {
  id: string
  date: string           // 日期
  task_type: string      // 任务类型 
    // do_single: 单选题
    // do_reading: 阅读理解
    // do_cloze: 完形填空
    // review_wrong: 错题复习
    // learn_words: 每日单词
    // streak: 连续学习
  target: number         // 目标数量
  progress: number       // 当前进度
  completed: boolean     // 是否完成
  exp_reward: number     // 经验奖励
}
```

#### 2.2.6 诊断历史 (t_diagnosis_history)

```typescript
interface DiagnosisRecord {
  id: string
  date: string           // 诊断日期
  total_score: number    // 总分
  listening_score: number // 听力得分
  single_score: number   // 单选得分
  cloze_score: number    // 完形得分
  reading_score: number // 阅读得分
  grammar_score: number // 语法得分
  
  // 各维度分析
  weak_tags: string[]    // 薄弱标签
  strong_tags: string[] // 掌握标签
  
  // 建议
  suggestions: string[]  // 学习建议
  
  completed: boolean     // 是否完成
}
```

---

## 3. 页面清单

### 3.1 页面路由表

| 路由 | 文件 | 功能 |
|------|------|------|
| `/pages/home/index` | home/index.vue | 首页 |
| `/pages/diagnostic/index` | diagnostic/index.vue | 学情诊断 |
| `/pages/diagnostic/test` | diagnostic/test.vue | 诊断测试(50题) |
| `/pages/diagnostic/result` | diagnostic/result.vue | 诊断结果 |
| `/pages/chat/index` | chat/index.vue | AI对话 |
| `/pages/scan/word` | scan/word.vue | AI识单词 |
| `/pages/scan/question` | scan/question.vue | AI识题 |
| `/pages/report/index` | report/index.vue | AI学习报告 |
| `/pages/vip/index` | vip/index.vue | 会员中心 |

### 3.2 页面详细规格

#### 3.2.1 首页 (home/index.vue)

**功能:**
- 用户问候+日期显示
- 学习统计 (已学单词、错题数、连续天数)
- AI专区入口 (4个功能)
- 决胜中考模块 (横向滚动8个卡片)
- 学习中心网格 (9个功能入口)
- 今日任务进度

**数据:**
- 用户信息: localStorage (`user_profile`)
- 学习统计: localStorage (`practice_stats`)
- 每日任务: localStorage (`daily_task`)

**交互:**
- 点击卡片跳转对应页面
- 下拉刷新更新数据

---

#### 3.2.2 单词本 (words/index.vue)

**功能:**
- 显示单词总数、已掌握/未掌握数量
- 搜索单词
- 三个Tab: 全部/已掌握/未掌握
- 单词列表 (分页加载)
- 点击进入单词详情

**数据源:**
- `/static/data/words.json`
- localStorage (`learned_words`)

**交互:**
- 搜索: 实时过滤
- 切换Tab: 重新筛选
- 上拉加载更多
- 点击单词: 跳转详情页

---

#### 3.2.3 单词详情 (words/detail.vue)

**功能:**
- 单词显示 (听写模式: 隐藏单词)
- 音标显示
- 词性+词义 (记忆模式显示)
- 记忆妙法 (紫色区域)
- 用法提示 (黄色区域)
- 重点例句 (蓝色卡片,可滑动)
- 易错分析 (红色区域)
- 发音按钮 (TTS)
- 掌握状态切换

**数据源:**
- words.json (完整数据)

**交互:**
- 📝 听写: 切换显示/隐藏单词
- 🧠 记忆: 切换显示/隐藏记忆专区
- 📢 讲课: 自动朗读所有内容
- ✓ 掌握: 切换掌握状态

---

#### 3.2.4 年级单词 (words/grade.vue)

**功能:**
- 7个年级选择: 三年级~九年级
- 每个年级显示单词数量
- 单词分页列表
- 掌握状态管理

**数据源:**
- `/static/data/words.json`
- `/static/data/word_grades.json`

---

#### 3.2.5 真题练习 (practice/index.vue)

**功能:**
- 四大入口:
  - 随机练习
  - 按题型 (单选/完形/阅读/对话)
  - 按年份 (2020-2024)
  - 作文专区
- 薄弱专项显示
- 学习记录统计

**数据源:**
- `/static/data/questions_shanghai_full.json`
- localStorage (`practice_stats`)

---

#### 3.2.6 答题页面 (exam/practice.vue)

**功能:**
- 顶部: 题目序号 + 进度条
- 题目类型 + 难度 + 年份
- 题目内容
- 选项列表 (A/B/C/D)
- 提交按钮
- 结果显示 (正确/错误)
- 解析显示
- 错题自动记录
- 完成页面 (正确数/错误数/正确率)

**数据源:**
- QuestionService

**交互:**
- 选择答案
- 提交: 显示结果,答错自动加入错题本
- 下一题/查看结果

---


#### 3.2.7  **决胜中考模块映射:**(zhongkao/index.vue)

**功能:**
- 8大模块展示
- 模块卡片 (图标+名称+描述+颜色)
- 点击进入对应语法学习

| 模块 | 文件关键词 |
|------|-----------|
| 满分语法 | 语法 |
| 赢在听力 | 听力 |listening_questions.json
| 玩转短语 | 短语 |grammar_lessons_duanyu.json
| 长难句 | 长难句 |grammar_lessons_changnanju.json
| 完型填空 | 完形 |grammar_lessons_wanxingtiankong.json
| 阅读理解 | 阅读 |grammar_lessons_yuedulijie.json
| 高分作文 | 作文 |grammar_lessons_zuowen.json
| 情景对话 | 情景 |grammar_lessons_qingjingduihua.json



#### 以 满分语法 为例 (grammar/index.vue)

**功能:**
- 支持模块筛选 (通过URL参数)
- 语法专题卡片列表
- 点击进入详情

**数据源:**
- `/static/data/grammar_lessons_*.json`(14个文件)
- `/static/data/grammar_lessons_bijiaoji.json`
- `/static/data/grammar_lessons_daici.json`
- `/static/data/grammar_lessons_daozhuangju.json`
- `/static/data/grammar_lessons_dongcishitai.json`
- `/static/data/grammar_lessons_dongciyutai.json`
- `/static/data/grammar_lessons_feiweiyudongci.json`
- `/static/data/grammar_lessons_fuheju.json`
- `/static/data/grammar_lessons_guanci.json`
- `/static/data/grammar_lessons_jiandanju.json`
- `/static/data/grammar_lessons_lianci.json`
- `/static/data/grammar_lessons_mingci.json`
- `/static/data/grammar_lessons_qingtaidongci.json`
- `/static/data/grammar_lessons_shuci.json`
- `/static/data/grammar_lessons_zhuweiyizhi.json`

---

语法详情 (grammar/detail.vue)

**功能:**
- 三Tab切换: 讲解/例句/练习
- 语法讲解 (Markdown渲染)
- 例句列表 (带翻译)
- 练习题 (选择+解析)
- 答案检查

**交互:**
- Tab切换
- 选择答案
- 检查答案
- 答错加入错题本

---

#### 3.2.9 听力练习 (listening/index.vue)

**功能:**
- 按年份+类型分组
- 听力材料列表
- 开始练习
- 听力答题

**数据源:**
- `/static/data/listening_questions.json`

**交互:**
- 选择年份+类型
- 开始练习
- 播放音频 (使用TTS模拟)
- 答题

---

#### 3.2.10 错题本 (wrong/index.vue)

**功能:**
- 两个Tab: 未掌握/已掌握
- 错题列表
- 显示: 题型、日期、是否已复习
- 显示用户答案 + 正确答案
- 解析显示
- 移除错题
- 重新作答

**数据源:**
- localStorage (`wrong_questions`)
- WrongQuestionService

**交互:**
- 滑动删除
- 点击查看详情
- 重新作答: 跳转到答题页面

---


---

#### 3.2.12 单词百日斩 (hundred/index.vue)

**功能:**
- 100天网格显示
- 进度显示
- 点击天数进入学习

**数据源:**
- words.json
- localStorage (`day_plan_*`)

---

#### 3.2.13 学情诊断 (diagnostic/index.vue + test.vue)

**功能:**
- 诊断说明: 50题综合测评
- 开始测试按钮
- 50题答题流程:
  - 听力8题 (short_dialogue×2 + long_dialogue×3 + monologue×3)
  - 单选12题
  - 完形10题
  - 阅读10题
  - 语法10题
- 进度显示
- 结果分析页面:
  - 总分显示
  - 各题型得分
  - 薄弱知识点标签
  - 学习建议

**数据源:**
- questions_shanghai_full.json
- listening_questions.json

**交互:**
- 开始测试
- 答题 (单选形式)
- 提交答案
- 查看结果

---

#### 3.2.14 AI 功能页面

| 页面 | 功能 | AI后端 |
|------|------|--------|
| scan/word | 拍照识别单词 | DeepSeek Vision |
| scan/question | 拍照识别题目 | DeepSeek Vision |
| chat/index | AI对话助手 | DeepSeek |
| report/index | 学习报告生成 | DeepSeek |

### 3.3 导航流程图

#### 首页入口 → 功能页面

```
首页 (home/index)
│
├─[学情诊断] → diagnostic/index → diagnostic/test → diagnostic/result
│
├─[不背单词] → hundred/index → hundred/words (每日30词)
│             words/grade (按年级)
│
├─[今日任务] → practice/index (4个任务入口)
│
├─[决胜中考-8模块] → zhongkao/index
│   │
│   ├─满分语法 → grammar/index (module: '语法')
│   ├─赢在听力 → listening/index
│   ├─玩转短语 → grammar/index (module: '短语')
│   ├─长难句 → grammar/index (module: '长难句')
│   ├─完型填空 → grammar/index (module: '完形')
│   ├─阅读理解 → reading/index(module: '阅读理解')
│   ├─高分作文 → writing/index(module: '作文')
│   └─情景对话 → grammar/index (module: '情景')
│
├─[做题小能手] → practice/index
│   │
│   ├─随机练习 → exam/practice (random)
│   ├─按题型 → practice/type → exam/practice (type: xxx)
│   ├─按年份 → practice/year → exam/practice (year: xxx)
│   └─作文专区 → writing/index
│
└─[薄弱点强化] → exam/practice (weakPoint)
```

#### 底部Tab导航

```
Tab 0: 首页 → home/index
Tab 1: 单词 → words/index
Tab 2: 错题 → wrong/index
Tab 3: 我的 → profile/index
```

---

## 4. 数据流向

### 4.1 整体数据流

```
┌─────────────────────────────────────────────────────────────┐
│                      静态资源 (JSON)                          │
│  words.json | questions.json | grammar_lessons_*.json       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service 层                              │
│  WordService | QuestionService | GrammarService             │
│  ListeningService | WrongQuestionService                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      页面 (Vue组件)                          │
│  pages/xxx/*.vue                                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      本地存储                                │
│  localStorage: user_profile, learned_words, wrong_questions │
│              practice_stats, daily_task, day_plan_*          │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 题目练习数据流

```
用户选择练习类型
       │
       ▼
practice/index.vue
       │ 设置 practice_type, practice_year/question_type
       ▼
exam/practice.vue
       │ 调用 QuestionService
       ▼
QuestionService.getQuestions() → 过滤题目
       │
       ├─ 随机: getRandomQuestions(10)
       ├─ 年份: getQuestionsByYear(year)
       ├─ 题型: getQuestionsByType(type)
       └─ 薄弱: getQuestionsByTopic(topic)
       │
       ▼
用户答题
       │
       ├─ 正确 → 更新统计
       │
       └─ 错误 → WrongQuestionService.addWrongQuestion()
                         │
                         ▼
                 存储到 localStorage
```

### 4.3 错题复习数据流

```
用户进入错题本
       │
       ▼
wrong/index.vue
       │
       ▼
加载 localStorage 中的错题
       │
       ▼
显示: 未掌握 | 已掌握 两个Tab
       │
       ▼
用户点击"重新作答"
       │
       ▼
exam/practice.vue (special mode)
       │
       ▼
用户答题
       │
       ├─ 正确 → 判断是否全对
       │          ├─ 全对 → 标记为"已掌握"
       │          └─ 未全对 → 删除该错题
       │
        └─ 错误 → 复习次数+1, 计算下次复习日期
```

### 4.4 听力练习数据流

```
用户进入听力
        │
        ▼
listening/index.vue
        │
        ├─ 选择题型 (短对话/长对话/独白/听写)
        └─ 筛选话题 (可选)
              │
              ▼
        显示听力材料列表
              │
              ▼
        选择材料开始练习
              │
              ▼
        listening/practice.vue
              │
              ├─ 显示技巧提示 (可选)
              ├─ 播放音频 (TTS模拟)
              ├─ 速度控制 (0.75x/1.0x/1.25x)
              │
              ▼
        用户答题
              │
              ├─ 正确 → 更新统计
              │
              └─ 错误 → 加入错题本
```

### 4.5 诊断测试数据流

```
用户点击"学情诊断"
        │
        ▼
diagnostic/index.vue
        │ 显示诊断说明
        │ 50题: 听力8+单选12+完形10+阅读10+语法10
        ▼
用户开始测试
        │
        ▼
diagnostic/test.vue
        │
        ├─ 听力8题 (自动播放)
        ├─ 单选12题
        ├─ 完形10题
        ├─ 阅读10题
        └─ 语法10题
        │
        ▼
提交答案
        │
        ▼
计算得分 + 分析薄弱点
        │
        ▼
diagnostic/result.vue
        │
        ├─ 总分显示
        ├─ 各题型得分
        ├─ 薄弱知识点标签
        └─ 学习建议
        │
        ▼
存储到 t_diagnosis_history
```

---

## 5. 服务层设计

### 5.1 服务文件结构

```
src/services/
├── types.ts              # 类型定义
├── auth.ts              # 认证服务
├── user.ts              # 用户服务
├── word.ts              # 单词服务
├── question.ts          # 题目服务
├── grammar.ts           # 语法服务
├── listening.ts         # 听力服务
├── wrongQuestion.ts     # 错题服务
├── weakPoint.ts         # 薄弱点服务
├── ai.ts                # AI服务 (DeepSeek)
├── tts.ts               # TTS服务
├── vip.ts               # 会员服务
└── storage.ts           # 本地存储封装
```

### 5.2 核心服务接口

#### WordService

```typescript
class WordService {
  // 加载单词
  loadWords(): Promise<void>
  
  // 获取单词
  getWords(): Word[]
  getWordById(id: string): Word | undefined
  getWordByText(word: string): Word | undefined
  
  // 掌握状态
  updateMastery(wordId: string, mastery: string): void
  getMasteredWords(): Word[]
  getUnmasteredWords(): Word[]
  
  // 搜索
  searchWords(keyword: string): Word[]
  
  // 统计
  getWordCount(): { total: number, mastered: number, unmastered: number }
}
```

#### QuestionService

```typescript
class QuestionService {
  // 加载题目
  loadQuestions(): Promise<void>
  
  // 获取题目
  getQuestions(filter?: QuestionFilter): Question[]
  getRandomQuestions(count: number): Question[]
  getQuestionsByYear(year: number): Question[]
  getQuestionsByType(type: string): Question[]
  getQuestionsByTopic(topic: string): Question[]
  
  // 统计
  getYears(): number[]
  getTypes(): string[]
  getQuestionCount(): number
}
```

#### GrammarService

```typescript
class GrammarService {
  // 加载语法
  loadGrammar(): Promise<void>
  
  // 获取数据
  getTopics(): GrammarTopic[]
  getTopicById(id: string): GrammarTopic | undefined
  getLessonsByTopicId(topicId: string): GrammarLesson[]
  getLessonById(topicId: string, lessonId: string): GrammarLesson | undefined
  
  // 获取全部练习题
  getAllExercisesAsQuestions(): Question[]
}
```

#### WrongQuestionService

```typescript
class WrongQuestionService {
  // 加载错题
  loadQuestions(): void
  
  // 获取错题
  getQuestions(): WrongQuestion[]
  getQuestionsByMastery(mastery: string): WrongQuestion[]
  getReviewableQuestions(): WrongQuestion[]
  
  // 添加错题
  addWrongQuestion(question: Question, userAnswer: string): void
  
  // 更新状态
  updateMastery(questionId: string, mastery: string): void
  deleteWrongQuestion(questionId: string): void
  markAllMastered(questionIds: string[]): void
  
  // 统计
  getCount(): { total: number, mastered: number, unmastered: number }
}
```

#### AIService

```typescript
class AIService {
  // 识单词 (图片识别)
  recognizeWord(imageBase64: string): Promise<{ word: string, meaning: string }>
  
  // 识题目 (图片识别)
  recognizeQuestion(imageBase64: string): Promise<Question>
  
  // 分析薄弱点
  analyzeWeakPoints(wrongQuestions: WrongQuestion[]): Promise<WeakPointAnalysis>
  
  // 生成学习报告
  generateReport(userStats: UserStats): Promise<StudyReport>
  
  // AI对话
  chat(message: string, history: ChatMessage[]): Promise<string>
  
  // 检查API配置
  isConfigured(): boolean
  setApiKey(key: string): void
}
```

---

## 6. 存储设计

### 6.1 localStorage 键值表

| 键名 | 类型 | 说明 |
|------|------|------|
| `user_profile` | object | 用户信息 |
| `learned_words` | string[] | 已掌握的单词列表 |
| `wrong_questions` | object[] | 错题本数据 |
| `practice_stats` | object | 练习统计 {total, correct, accuracy} |
| `daily_task` | object | 今日任务 |
| `practice_type` | string | 当前练习类型 |
| `practice_year` | number | 练习年份 |
| `practice_question_type` | string | 练习题目类型 |
| `practice_topic` | string | 练习话题 |
| `day_plan_start_date` | string | 百日计划开始日期 |
| `day_plan_current_day` | number | 当前天数 |
| `day_plan_completed_days` | number[] | 已完成的天数列表 |
| `day_words_day` | number | 当前每日单词天数 |
| `day_{n}_words` | object[] | 第n天学习的单词 |
| `day_{n}_completed` | boolean | 第n天是否完成 |
| `settings_api_key` | string | API密钥 |
| `settings_llm_provider` | string | LLM提供商 |

### 6.2 数据迁移说明

**从Flutter SQLite到微信小程序localStorage:**

| Flutter表 | 小程序存储 | 迁移方式 |
|-----------|-----------|----------|
| t_user_profile | user_profile | JSON序列化 |
| t_high_freq_words | learned_words | 只需单词列表 |
| t_wrong_questions | wrong_questions | JSON序列化 |
| t_weak_points | weak_points | JSON序列化 |
| t_daily_tasks | daily_task | JSON序列化 |

---

## 7. 交互设计

### 7.1 题目答题流程

```
┌──────────────────────────────────────────────┐
│  1. 进入答题页                               │
│     - 显示loading                             │
│     - 加载题目数据                           │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  2. 显示题目                                 │
│     - 序号/总题数                            │
│     - 题目类型/难度/年份                    │
│     - 题目内容                               │
│     - 选项列表 (A/B/C/D)                    │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  3. 用户选择答案                             │
│     - 高亮选中项                             │
│     - 启用提交按钮                          │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  4. 提交答案                                 │
│     - 显示结果 (✓/✗)                        │
│     - 显示解析                               │
│     - 答错: 自动加入错题本                   │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  5. 下一题/完成                             │
│     - 下一题: 重复步骤2-5                  │
│     - 完成: 显示统计                         │
└──────────────────────────────────────────────┘
```

### 7.2 错题本交互

```
┌──────────────────────────────────────────────┐
│  显示错题列表                                │
│  ┌────────────────────────────────────────┐ │
│  │ [题型] [日期] [已复习/未复习]          │ │
│  │ 题目内容...                            │ │
│  │ A. 选项1  B. 选项2                     │ │
│  │ 你的答案: A ✗  正确答案: B ✓           │ │
│  │ 解析: ...                              │ │
│  │ [移除] [重新作答]                       │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│  重新作答                                    │
│     ↓                                       │
│  跳转到答题页面 (单题模式)                  │
│     ↓                                       │
│  答对: 从错题本删除                          │
│  答错: 复习次数+1, 计算下次复习日期          │
└──────────────────────────────────────────────┘
```

### 7.3 单词学习交互

```
┌──────────────────────────────────────────────┐
│  单词详情页                                  │
│  ┌────────────────────────────────────────┐ │
│  │ [听写] [记忆] [讲课]                   │ │
│  │                                        │ │
│  │           abandon                      │ │
│  │         /əˈbændən/                     │ │
│  │                                        │ │
│  │         放弃；遗弃 (v.)                │ │
│  │                                        │ │
│  │  [🔊 发音]  [★ 掌握]                  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ▼ 点击"记忆"后显示:                         │
│  ┌────────────────────────────────────────┐ │
│  │ 🧠 记忆妙法                            │ │
│  │ ab-去 +andon命令 → 命令离开 → 放弃    │ │
│  │                                        │ │
│  │ 💡 用法提示                            │ │
│  │ abandon doing sth = 放弃做某事         │ │
│  │                                        │ │
│  │ 📖 重点例句                            │ │
│  │ He abandoned his wife and children.    │ │
│  │ 他遗弃了妻子和孩子。                    │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

## 8. AI功能设计

### 8.1 AI服务架构

```typescript
interface AIServiceConfig {
  provider: 'deepseek' | 'qwen'  // 设置页选择
  apiKey: string                 // 用户输入的API Key
  baseURL: string                // API地址
}

// DeepSeek API 调用
async function chat(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(config.baseURL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7
    })
  })
  return response.choices[0].message.content
}
```

### 8.2 功能实现

| 功能 | 实现方式 | API |
|------|----------|-----|
| AI识单词 | 图片→Base64→Vision API→返回单词 | DeepSeek Vision |
| AI识题 | 图片→Base64→Vision API→返回题目 | DeepSeek Vision |
| AI对话 | 用户消息→Chat API→返回回答 | DeepSeek Chat |
| AI学习报告 | 用户数据→Chat API→生成报告 | DeepSeek Chat |
| AI薄弱点分析 | 错题数据→Chat API→分析 | DeepSeek Chat |

### 8.3 Demo模式

无API Key时:
- 模拟返回预设答案
- 显示"Demo模式"提示
- 不调用真实API

---

---

## 附录

### A. 数据文件位置

```
项目根目录/
└── src/
    └── static/
        └── data/
            ├── words.json                    # 单词
            ├── word_grades.json              # 单词年级
            ├── questions_shanghai_full.json  # 真题
            ├── listening_questions.json      # 听力
            └── grammar_lessons_*.json       # 21个文件
```

### B. Flutter→小程序字段映射

| Flutter字段 | 小程序字段 | 说明 |
|-------------|------------|------|
| exampleSentences.exam | example_sentences.exam | 考试例句 |
| exampleSentences.spoken | example_sentences.spoken | 口语例句 |
| commonMistakes | common_mistakes | 常见错误 |
| memoryMethods | memory_methods | 记忆方法 |
| usageNotes | usage_notes | 用法提示 |
| lastReviewTime | last_review_time | 上次复习 |

