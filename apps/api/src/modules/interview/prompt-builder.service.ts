import { Injectable } from '@nestjs/common';
import { InterviewRound, ScenarioTemplate, InterviewMessage, Question, Prisma } from '@prisma/client';
import { ChatMessage } from '../llm/llm.service';

@Injectable()
export class PromptBuilderService {
  buildRoundStartPrompt(
    round: InterviewRound,
    scenario: ScenarioTemplate & { career: { name: string } },
    cvAnalysis?: { structuredData: Prisma.JsonValue },
    knowledgeEntries?: { title: string; content: string }[],
    fixedQuestions?: Question[],
  ): ChatMessage {
    const systemPromptParts: string[] = [
      `You are an experienced technical interviewer conducting a mock interview for a ${scenario.career.name} position.`,
      '',
      `Current round: Round ${round.roundNumber}`,
      `Topic focus: ${round.topicFocus}`,
      `Number of questions to ask: 5`, // Default, can be parameterized later
      '',
    ];

    // Add CV summary if provided
    if (cvAnalysis && cvAnalysis.structuredData) {
      systemPromptParts.push('Candidate profile summary:');
      systemPromptParts.push(JSON.stringify(cvAnalysis.structuredData, null, 2));
      systemPromptParts.push('');
    }

    // Add knowledge base context if provided
    if (knowledgeEntries && knowledgeEntries.length > 0) {
      systemPromptParts.push('Technical reference context:');
      knowledgeEntries.forEach((entry) => {
        systemPromptParts.push(`\n### ${entry.title}`);
        systemPromptParts.push(entry.content);
      });
      systemPromptParts.push('');
    }

    // Add fixed questions if provided
    if (fixedQuestions && fixedQuestions.length > 0) {
      systemPromptParts.push('Include these specific questions in your interview:');
      fixedQuestions.forEach((q, idx) => {
        systemPromptParts.push(`${idx + 1}. ${q.content}`);
      });
      systemPromptParts.push('');
    }

    // Add instructions
    systemPromptParts.push('Instructions:');
    systemPromptParts.push('- Ask one question at a time');
    systemPromptParts.push('- After each answer, briefly evaluate it (what was good, what was missed)');
    systemPromptParts.push('- Include [SCORE:X] (0-10) and [FEEDBACK:...] tags in your evaluation');
    systemPromptParts.push('- Then ask the next question');
    systemPromptParts.push('- Stay focused on the round topic');
    systemPromptParts.push('- Adapt difficulty based on candidate\'s responses');
    systemPromptParts.push('- Start the interview now with your first question.');

    return {
      role: 'system',
      content: systemPromptParts.join('\n'),
    };
  }

  buildFollowUpMessages(messages: InterviewMessage[]): ChatMessage[] {
    return messages.map((msg) => ({
      role: msg.role.toLowerCase() as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));
  }

  buildRoundSummaryPrompt(messages: InterviewMessage[]): ChatMessage[] {
    const conversationHistory = this.buildFollowUpMessages(messages);

    return [
      ...conversationHistory,
      {
        role: 'user',
        content: `Please provide a comprehensive evaluation of this interview round. Analyze the candidate's responses and provide:
1. Overall performance score (0-100)
2. Strengths demonstrated
3. Areas for improvement
4. Specific examples from their answers
5. Recommendations for next steps

Format your response as JSON with the following structure:
{
  "score": <number 0-100>,
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["area1", "area2", ...],
  "examples": ["example1", "example2", ...],
  "recommendations": ["rec1", "rec2", ...]
}`,
      },
    ];
  }

  buildOverallSummaryPrompt(
    roundFeedbacks: Array<{ roundNumber: number; score: number; feedback: Prisma.JsonValue }>,
  ): ChatMessage[] {
    const feedbackSummary = roundFeedbacks
      .map((r) => `\n## Round ${r.roundNumber} (Score: ${r.score}/100)\n${JSON.stringify(r.feedback, null, 2)}`)
      .join('\n');

    return [
      {
        role: 'system',
        content: 'You are an experienced technical interviewer providing final assessment.',
      },
      {
        role: 'user',
        content: `Based on the following round evaluations, provide an overall assessment of the candidate's interview performance:
${feedbackSummary}

Provide a comprehensive final evaluation including:
1. Overall score (0-100) - weighted average with analysis
2. Key strengths across all rounds
3. Critical areas needing improvement
4. Overall readiness assessment
5. Detailed recommendations for career development

Format your response as JSON with the following structure:
{
  "overallScore": <number 0-100>,
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["area1", "area2", ...],
  "readiness": "description of overall readiness",
  "recommendations": ["rec1", "rec2", ...]
}`,
      },
    ];
  }

  buildRoundScoringPrompt(
    messages: InterviewMessage[],
    topicFocus: string,
    roundNumber: number,
  ): ChatMessage[] {
    // Format conversation as Q&A pairs
    const conversationText = messages
      .filter((m) => m.role !== 'SYSTEM')
      .map((m) => {
        const role = m.role === 'USER' ? 'Candidate' : 'Interviewer';
        return `${role}: ${m.content}`;
      })
      .join('\n\n');

    return [
      {
        role: 'system',
        content: 'You are an experienced technical interviewer evaluating candidate responses.',
      },
      {
        role: 'user',
        content: `Review this interview round conversation and provide evaluation.

Round: Round ${roundNumber} | Topic: ${topicFocus}

Conversation:
${conversationText}

Provide evaluation as valid JSON ONLY:
{
  "averageScore": <number 0-10>,
  "summary": "<2-3 sentence summary>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area 1>", "<area 2>"],
  "perAnswerScores": [
    { "questionIndex": 1, "score": <number 0-10>, "topic": "<string>" }
  ]
}`,
      },
    ];
  }

  buildOverallScoringPrompt(
    rounds: Array<{ roundNumber: number; score: number | null; feedback: Prisma.JsonValue }>,
    careerName: string,
  ): ChatMessage[] {
    const roundSummaries = rounds
      .map((r) => `\n## Round ${r.roundNumber} (Score: ${r.score || 0}/10)\n${JSON.stringify(r.feedback, null, 2)}`)
      .join('\n');

    return [
      {
        role: 'system',
        content: 'You are an experienced technical interviewer providing final assessment.',
      },
      {
        role: 'user',
        content: `Review all rounds of this mock interview for ${careerName} position.

Round summaries:
${roundSummaries}

Provide overall assessment as valid JSON ONLY:
{
  "overallScore": <number 0-10>,
  "summary": "<paragraph assessment>",
  "strengths": ["<strength>"],
  "weaknesses": ["<weakness>"],
  "readinessLevel": "<not_ready|needs_practice|mostly_ready|interview_ready>",
  "topRecommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
}`,
      },
    ];
  }
}
