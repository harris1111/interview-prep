import { Injectable } from '@nestjs/common';

export interface ParsedQuestion {
  question: string;
  answer: string;
  topicName: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
}

export interface ChunkedContent {
  title: string;
  content: string;
  headingLevel: number;
}

@Injectable()
export class MarkdownParserService {
  detectFileType(content: string): 'question-bank' | 'study-guide' {
    // Detect question bank pattern: **Q: or **Q.**
    const questionPattern = /\*\*Q[:\.]?\s+/i;
    return questionPattern.test(content) ? 'question-bank' : 'study-guide';
  }

  parseQuestionBank(content: string, _filename: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    let currentTopic = 'General';
    let currentDifficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' = 'MEDIUM';

    const lines = content.split('\n');
    let currentQuestion = '';
    let currentAnswer = '';
    let isReadingAnswer = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for H2 topic headings
      if (line.startsWith('## ') && !line.startsWith('### ')) {
        currentTopic = line.replace(/^##\s+/, '').trim();
        continue;
      }

      // Check for H3 difficulty headings
      if (line.startsWith('### ')) {
        const heading = line.replace(/^###\s+/, '').trim().toLowerCase();
        if (heading.includes('basic') || heading.includes('beginner')) {
          currentDifficulty = 'EASY';
        } else if (heading.includes('intermediate')) {
          currentDifficulty = 'MEDIUM';
        } else if (heading.includes('advanced')) {
          currentDifficulty = 'HARD';
        } else if (heading.includes('expert')) {
          currentDifficulty = 'EXPERT';
        }
        continue;
      }

      // Check for question pattern
      const questionMatch = line.match(/^\*\*Q[:\.]?\s+(.+)\*\*$/i);
      if (questionMatch) {
        // Save previous Q/A pair if exists
        if (currentQuestion && currentAnswer) {
          questions.push({
            question: currentQuestion,
            answer: currentAnswer.trim(),
            topicName: currentTopic,
            difficulty: currentDifficulty,
          });
        }
        currentQuestion = questionMatch[1].trim();
        currentAnswer = '';
        isReadingAnswer = false;
        continue;
      }

      // Check for answer pattern
      if (line.toUpperCase().startsWith('A:') || line.toUpperCase().startsWith('**A:**')) {
        isReadingAnswer = true;
        const answerContent = line.replace(/^\*?\*?A:\*?\*?\s*/i, '').trim();
        if (answerContent) {
          currentAnswer = answerContent;
        }
        continue;
      }

      // Accumulate answer lines
      if (isReadingAnswer && line && !line.startsWith('#')) {
        currentAnswer += (currentAnswer ? '\n' : '') + line;
      }
    }

    // Save last Q/A pair
    if (currentQuestion && currentAnswer) {
      questions.push({
        question: currentQuestion,
        answer: currentAnswer.trim(),
        topicName: currentTopic,
        difficulty: currentDifficulty,
      });
    }

    return questions;
  }

  chunkByHeadings(content: string, maxChars: number = 2000): ChunkedContent[] {
    const chunks: ChunkedContent[] = [];
    const lines = content.split('\n');

    let currentTitle = 'Introduction';
    let currentContent = '';
    let currentLevel = 2;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for headings
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);

      if (h2Match || h3Match) {
        // Save previous chunk if exists
        if (currentContent.trim()) {
          if (currentContent.length > maxChars) {
            // Split large chunks further
            const parts = this.splitLargeChunk(currentContent, maxChars);
            parts.forEach((part, idx) => {
              chunks.push({
                title: idx === 0 ? currentTitle : `${currentTitle} (Part ${idx + 1})`,
                content: part,
                headingLevel: currentLevel,
              });
            });
          } else {
            chunks.push({
              title: currentTitle,
              content: currentContent.trim(),
              headingLevel: currentLevel,
            });
          }
        }

        // Start new chunk
        currentTitle = h2Match ? h2Match[1].trim() : (h3Match ? h3Match[1].trim() : 'Section');
        currentLevel = h2Match ? 2 : 3;
        currentContent = '';
      } else {
        currentContent += line + '\n';
      }
    }

    // Save last chunk
    if (currentContent.trim()) {
      if (currentContent.length > maxChars) {
        const parts = this.splitLargeChunk(currentContent, maxChars);
        parts.forEach((part, idx) => {
          chunks.push({
            title: idx === 0 ? currentTitle : `${currentTitle} (Part ${idx + 1})`,
            content: part,
            headingLevel: currentLevel,
          });
        });
      } else {
        chunks.push({
          title: currentTitle,
          content: currentContent.trim(),
          headingLevel: currentLevel,
        });
      }
    }

    return chunks;
  }

  private splitLargeChunk(content: string, maxChars: number): string[] {
    const parts: string[] = [];
    const paragraphs = content.split('\n\n');
    let currentPart = '';

    for (const para of paragraphs) {
      if ((currentPart + para).length > maxChars && currentPart) {
        parts.push(currentPart.trim());
        currentPart = para;
      } else {
        currentPart += (currentPart ? '\n\n' : '') + para;
      }
    }

    if (currentPart.trim()) {
      parts.push(currentPart.trim());
    }

    return parts;
  }
}
