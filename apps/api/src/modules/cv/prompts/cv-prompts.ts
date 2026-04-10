export function buildExtractionPrompt(cvText: string): string {
  return `Analyze this CV and extract structured data as JSON:
{
  "name": "string",
  "currentRole": "string", 
  "yearsOfExperience": number,
  "skills": [{ "name": "string", "level": "beginner|intermediate|advanced|expert", "evidence": "string" }],
  "experience": [{ "company": "string", "role": "string", "duration": "string", "highlights": ["string"] }],
  "projects": [{ "name": "string", "description": "string", "technologies": ["string"] }],
  "education": [{ "degree": "string", "institution": "string", "year": "string" }],
  "certifications": ["string"]
}

CV Text:
${cvText}`;
}

export function buildGapAnalysisPrompt(
  structuredData: object,
  careerName: string,
  topicNames: string[],
): string {
  return `Compare this candidate's profile against ${careerName} requirements.
Required topics: ${topicNames.join(', ')}

Candidate profile:
${JSON.stringify(structuredData, null, 2)}

Provide analysis as JSON:
{
  "overallReadiness": "not_ready|needs_work|mostly_ready|strong",
  "readinessScore": number (0-100),
  "strengths": [{ "topic": "string", "evidence": "string", "level": "string" }],
  "gaps": [{ "topic": "string", "severity": "critical|moderate|minor", "recommendation": "string" }],
  "recommendations": ["string"],
  "suggestedFocusAreas": ["string"]
}`;
}
