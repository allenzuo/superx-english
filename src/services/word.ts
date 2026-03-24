import type { Word, WordGrade } from './types'
import wordsData from '@/static/data/words.json'
import wordGradesData from '@/static/data/word_grades.json'

const WORDS_KEY = 'words_data'
const WORD_GRADES_KEY = 'word_grades_data'
const LEARNED_WORDS_KEY = 'learned_words'

class WordService {
  private words: Word[] = []
  private wordGrades: WordGrade[] = []
  private wordToGradesMap: Map<string, string[]> = new Map()
  private isLoaded = false
  private isGradesLoaded = false

  async loadWords(): Promise<Word[]> {
    if (this.isLoaded && this.words.length > 0) {
      return this.words
    }
    
    this.isLoaded = true
    
    console.log('Loading words from import...')
    
    if (wordsData && Array.isArray(wordsData)) {
      this.words = wordsData.map((w: any, index: number) => ({
        id: w.id || `word_${index}`,
        word: w.word || '',
        phonetic: w.phonetic,
        type: w.type,
        meaning: w.meaning,
        frequency: w.frequency,
        example_sentences: w.example_sentences,
        example_translations: w.example_translations,
        usage_notes: typeof w.usage_notes === 'string' ? w.usage_notes : JSON.stringify(w.usage_notes),
        common_mistakes: typeof w.common_mistakes === 'string' ? w.common_mistakes : JSON.stringify(w.common_mistakes),
        memory_methods: typeof w.memory_methods === 'string' ? w.memory_methods : JSON.stringify(w.memory_methods),
        mastery: w.mastery || 'unmastered',
        last_review_time: w.last_review_time
      }))
      console.log('Loaded', this.words.length, 'words')
      return this.words
    }
    
    console.error('Invalid words data format')
    return []
  }

  async loadWordGrades(): Promise<void> {
    if (this.isGradesLoaded) return
    
    try {
      if (wordGradesData && wordGradesData.mappings) {
        this.wordGrades = wordGradesData.mappings.map((m: any) => ({
          word: m.word,
          grade: m.grade,
          semester: m.semester
        }))
        
        wordGradesData.mappings.forEach((m: any) => {
          const wordKey = m.word.toLowerCase()
          if (!this.wordToGradesMap.has(wordKey)) {
            this.wordToGradesMap.set(wordKey, [])
          }
          const grades = this.wordToGradesMap.get(wordKey)!
          if (!grades.includes(m.grade)) {
            grades.push(m.grade)
          }
        })
        
        this.isGradesLoaded = true
        console.log(`Loaded ${this.wordGrades.length} grade mappings`)
      }
    } catch (e) {
      console.error('Failed to load word grades:', e)
    }
  }

  getWords(): Word[] {
    return this.words
  }

  getWordById(id: string): Word | undefined {
    return this.words.find(w => w.id === id)
  }

  getWordByText(word: string): Word | undefined {
    return this.words.find(w => w.word.toLowerCase() === word.toLowerCase())
  }

  getGradesForWord(wordText: string): string[] {
    const wordKey = wordText.toLowerCase()
    return this.wordToGradesMap.get(wordKey) || []
  }

  searchWords(keyword: string): Word[] {
    if (!keyword) return this.words
    const lower = keyword.toLowerCase()
    return this.words.filter(w => 
      w.word.toLowerCase().includes(lower) ||
      w.meaning?.toLowerCase().includes(lower)
    )
  }

  getWordsByGrade(grade: string): Word[] {
    if (!this.isGradesLoaded) return []
    const result: Word[] = []
    this.words.forEach(w => {
      const grades = this.wordToGradesMap.get(w.word.toLowerCase()) || []
      if (grades.includes(grade)) {
        result.push(w)
      }
    })
    return result
  }

  getGradeWordCount(grade: string): number {
    if (!this.isGradesLoaded) return 0
    let count = 0
    this.words.forEach(w => {
      const grades = this.wordToGradesMap.get(w.word.toLowerCase()) || []
      if (grades.includes(grade)) {
        count++
      }
    })
    return count
  }

  getAllGradeCounts(): { grade: string; count: number }[] {
    if (!this.isGradesLoaded) return []
    const gradeList = ['三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级']
    return gradeList.map(grade => ({
      grade,
      count: this.getGradeWordCount(grade)
    }))
  }

  getMasteredWords(): Word[] {
    const masteredIds = uni.getStorageSync(LEARNED_WORDS_KEY) || []
    return this.words.filter(w => masteredIds.includes(w.id))
  }

  getUnmasteredWords(): Word[] {
    const masteredIds = uni.getStorageSync(LEARNED_WORDS_KEY) || []
    return this.words.filter(w => !masteredIds.includes(w.id))
  }

  updateMastery(wordId: string, mastery: Word['mastery']): void {
    const word = this.words.find(w => w.id === wordId)
    if (word) {
      word.mastery = mastery
      word.last_review_time = new Date().toISOString()
      
      const masteredIds = uni.getStorageSync(LEARNED_WORDS_KEY) || []
      if (mastery === 'mastered' && !masteredIds.includes(wordId)) {
        masteredIds.push(wordId)
      } else if (mastery !== 'mastered') {
        const idx = masteredIds.indexOf(wordId)
        if (idx > -1) masteredIds.splice(idx, 1)
      }
      uni.setStorageSync(LEARNED_WORDS_KEY, masteredIds)
    }
  }

  getWordCount(): { total: number; mastered: number; unmastered: number } {
    const masteredIds = uni.getStorageSync(LEARNED_WORDS_KEY) || []
    return {
      total: this.words.length,
      mastered: masteredIds.length,
      unmastered: this.words.length - masteredIds.length
    }
  }

  getGradeWordsCount(): { grade: string; count: number }[] {
    if (!this.isGradesLoaded) return []
    
    const gradeCounts: { [key: string]: number } = {}
    this.wordGrades.forEach(wg => {
      gradeCounts[wg.grade] = (gradeCounts[wg.grade] || 0) + 1
    })
    
    return Object.entries(gradeCounts).map(([grade, count]) => ({
      grade,
      count
    }))
  }

  getRandomWords(count: number): Word[] {
    const shuffled = [...this.words].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }
}

export const wordService = new WordService()
