import Anthropic from "@anthropic-ai/sdk";

const SYSTEM = `You are a senior software engineer doing a thorough code review.
Analyze the provided diff or code and return ONLY valid JSON.

Focus on: bugs, security vulnerabilities, performance issues, code quality, best practices.
Be specific — point to exact lines. Suggest concrete fixes, not vague advice.

Response format:
{
  "summary": "2-3 sentence overall assessment",
  "score": 85,
  "verdict": "approve|request_changes|comment",
  "issues": [
    {
      "id": "issue_1",
      "type": "bug|security|performance|style|maintainability",
      "severity": "critical|high|medium|low|info",
      "line": 42,
      "title": "Short issue title",
      "description": "What is wrong and why it matters",
      "suggestion": "Concrete fix with code example if helpful",
      "code_fix": "optional fixed code snippet"
    }
  ],
  "positives": ["Things done well"],
  "security_scan": {
    "has_sql_injection_risk": false,
    "has_xss_risk": false,
    "has_hardcoded_secrets": false,
    "has_insecure_dependencies": false,
    "notes": []
  },
  "test_coverage_notes": "observations about test coverage"
}`;

export interface ReviewIssue {
  id: string; type: string; severity: string;
  line?: number; title: string; description: string;
  suggestion: string; code_fix?: string;
}

export interface CodeReview {
  summary: string; score: number; verdict: string;
  issues: ReviewIssue[]; positives: string[];
  security_scan: { has_sql_injection_risk: boolean; has_xss_risk: boolean;
    has_hardcoded_secrets: boolean; has_insecure_dependencies: boolean; notes: string[] };
  test_coverage_notes: string;
}

export async function reviewCode(code: string, context?: string, language?: string): Promise<CodeReview> {
  const client = new Anthropic();
  const prompt = [
    language ? `Language: ${language}` : "",
    context ? `Context: ${context}` : "",
    `\nCode to review:\n\`\`\`\n${code}\n\`\`\``,
  ].filter(Boolean).join("\n");

  const resp = await client.messages.create({
    model: "claude-sonnet-4-20250514", max_tokens: 4096, system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (resp.content[0] as any).text.trim()
    .replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "");
  return JSON.parse(raw);
}
