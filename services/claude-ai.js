const axios = require('axios');
const emailPrompts = require('../prompts/email-prompts');
const extractionPrompts = require('../prompts/extraction-prompts');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Call Claude API
 */
async function callClaude(prompt, systemPrompt, maxTokens = 1024) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  try {
    const response = await axios.post(ANTHROPIC_API_URL, {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      system: systemPrompt
    }, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    if (response.data.content && response.data.content[0]) {
      return response.data.content[0].text;
    }

    throw new Error('No content in Claude response');
  } catch (error) {
    console.error('Claude API error:', error.response?.data || error.message);
    throw new Error(`Claude API error: ${error.message}`);
  }
}

/**
 * Analyze email to determine intent and sentiment
 */
async function analyzeEmail({ from, to, subject, body, html, clientId }) {
  const language = process.env.DEFAULT_RESPONSE_LANGUAGE || 'en';
  const systemPrompt = emailPrompts.getAnalysisSystemPrompt(language);

  const prompt = `
Analyze this email and provide structured output as JSON:

FROM: ${from}
TO: ${to}
SUBJECT: ${subject}
BODY: ${body}

Respond with ONLY valid JSON (no markdown, no code blocks) with these fields:
{
  "category": "lead_inquiry|support|complaint|billing|spam|feedback|other",
  "sentiment": "positive|neutral|negative",
  "urgency": "high|medium|low",
  "intent": "brief description of what they want",
  "hasAttachments": false,
  "requiresHuman": boolean
}
  `;

  const response = await callClaude(prompt, systemPrompt, 512);

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse Claude response:', response);
    return {
      category: 'other',
      sentiment: 'neutral',
      urgency: 'medium',
      intent: subject,
      hasAttachments: false,
      requiresHuman: false
    };
  }
}

/**
 * Generate email response
 */
async function generateEmailResponse({ email, analysis, clientId }) {
  const language = process.env.DEFAULT_RESPONSE_LANGUAGE || 'en';
  const systemPrompt = emailPrompts.getResponseSystemPrompt(language, analysis.category);

  const businessName = process.env.BUSINESS_NAME || 'Our Team';
  const businessEmail = process.env.BUSINESS_EMAIL || 'noreply@example.com';

  const prompt = `
Generate a professional email response to this ${analysis.category} email.

ORIGINAL EMAIL:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

ANALYSIS:
- Category: ${analysis.category}
- Sentiment: ${analysis.sentiment}
- Urgency: ${analysis.urgency}
- Intent: ${analysis.intent}

Write a professional, concise response (2-3 paragraphs max) that:
1. Acknowledges their inquiry
2. Addresses their main concern
3. Provides next steps or call to action

Use a friendly but professional tone. Include signature from ${businessName}.
  `;

  const response = await callClaude(prompt, systemPrompt, 1024);

  return response.trim();
}

/**
 * Categorize a lead
 */
async function categorizeLead({ name, company, email, message, clientId }) {
  const systemPrompt = `You are a lead qualification expert. Analyze lead information and provide structured categorization.`;

  const prompt = `
Analyze this lead and provide ONLY valid JSON (no markdown) with:

Name: ${name || 'Unknown'}
Company: ${company || 'Unknown'}
Email: ${email || 'Unknown'}
Message: ${message || ''}

Response format:
{
  "quality": "hot|warm|cold",
  "industry": "string or null",
  "budget": "unknown|low|medium|high",
  "timeframe": "immediate|soon|future|unclear",
  "decision_maker": boolean,
  "score": 0-100
}
  `;

  const response = await callClaude(prompt, systemPrompt, 512);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return {
      quality: 'warm',
      industry: null,
      budget: 'unknown',
      timeframe: 'unclear',
      decision_maker: false,
      score: 50
    };
  }
}

/**
 * Extract structured data from document
 */
async function extractDocumentData({ content, documentType, language = 'en', clientId }) {
  const systemPrompt = extractionPrompts.getExtractionSystemPrompt(documentType, language);

  const prompt = `
Extract all relevant data from this ${documentType} and return ONLY valid JSON (no markdown).

DOCUMENT CONTENT:
${content}

Extract all fields relevant to this document type. Return a flat JSON object with string values.
  `;

  const response = await callClaude(prompt, systemPrompt, 2048);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse extraction response:', response);
    return {
      error: 'Failed to parse document',
      raw_content: content.substring(0, 500)
    };
  }
}

/**
 * Summarize content
 */
async function summarizeContent({ content, maxLength = 200, clientId }) {
  const systemPrompt = 'You are an expert at creating concise, accurate summaries.';

  const prompt = `
Summarize this content in ${maxLength} characters or less:

${content}

Provide ONLY the summary, no other text.
  `;

  const response = await callClaude(prompt, systemPrompt, 512);
  return response.trim().substring(0, maxLength);
}

/**
 * Generate product recommendation
 */
async function generateRecommendation({ userProfile, productCatalog, clientId }) {
  const systemPrompt = 'You are an expert sales consultant providing personalized product recommendations.';

  const prompt = `
Based on this user profile and available products, recommend the best product.

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

AVAILABLE PRODUCTS:
${JSON.stringify(productCatalog, null, 2)}

Provide a recommendation with brief justification in JSON format:
{
  "recommended_product": "name",
  "match_score": 0-100,
  "key_benefits": ["benefit1", "benefit2"],
  "reason": "brief explanation"
}
  `;

  const response = await callClaude(prompt, systemPrompt, 1024);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return {
      recommended_product: 'Standard Package',
      match_score: 50,
      key_benefits: ['Core features'],
      reason: 'Default recommendation'
    };
  }
}

/**
 * Validate data quality
 */
async function validateData({ data, schema, clientId }) {
  const systemPrompt = 'You are a data quality expert. Validate data against schemas and identify issues.';

  const prompt = `
Validate this data against the schema:

DATA:
${JSON.stringify(data, null, 2)}

SCHEMA:
${JSON.stringify(schema, null, 2)}

Return JSON with:
{
  "valid": boolean,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"]
}
  `;

  const response = await callClaude(prompt, systemPrompt, 1024);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return {
      valid: true,
      issues: [],
      suggestions: []
    };
  }
}

module.exports = {
  callClaude,
  analyzeEmail,
  generateEmailResponse,
  categorizeLead,
  extractDocumentData,
  summarizeContent,
  generateRecommendation,
  validateData
};
