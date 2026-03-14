// lib/api.js
const API_VERSION = 'v3-ai-powered'; // change this to verify hot reload
console.log('api.js loaded:', API_VERSION);
const BACKEND_URL = 'http://192.168.0.169:8000';

// ─── RAG Q&A (chatbot) ────────────────────────────────
export const askRAG = async (query, userProfile) => {
  try {
    const r = await fetch(`${BACKEND_URL}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, user_profile: userProfile }) });
    return await r.json();
  } catch { return { error: true, response: 'Unable to connect to the server.' }; }
};

// ─── Quiz generation ──────────────────────────────────
export const generateQuiz = async (topic, userProfile) => {
  try {
    const r = await fetch(`${BACKEND_URL}/quiz`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, user_profile: userProfile }) });
    return await r.json();
  } catch { return { error: true }; }
};

// ─── Lesson content generation (legacy) ──────────────
export const generateLesson = async (topic, userProfile) => {
  try {
    const r = await fetch(`${BACKEND_URL}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: topic, user_profile: userProfile, override_prompt: `Explain "${topic}" for a Singapore university student. Bullets and short paragraphs. Under 200 words.` }) });
    return await r.json();
  } catch { return { error: true }; }
};

// ─── Bot fact chip ────────────────────────────────────
export const getBotFact = async (label, prompt) => {
  try {
    const r = await fetch(`${BACKEND_URL}/bot-fact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label, prompt }) });
    return await r.json();
  } catch { return { answer: 'Unable to fetch live data right now.' }; }
};

// ─── Simulate: generate month choices ────────────────
export const simulateMonth = async (state, month, event, previousChoices = []) => {
  try {
    const r = await fetch(`${BACKEND_URL}/simulate/month`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ month, income: state.income, income_label: state.incomeLabel, bank_balance: state.bankBalance, savings_balance: state.savingsBalance, credit_card_debt: state.creditCardDebt, savings_rate: state.savingsRate, event_id: event.id, event_text: event.text, previous_choices: previousChoices }) });
    return await r.json();
  } catch { return { error: true }; }
};

// ─── Simulate: ask Fin ────────────────────────────────
export const askFin = async (question, state, month, event, optionsShown = []) => {
  try {
    const r = await fetch(`${BACKEND_URL}/simulate/ask-fin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, month, income: state.income, income_label: state.incomeLabel, bank_balance: state.bankBalance, savings_balance: state.savingsBalance, credit_card_debt: state.creditCardDebt, event_text: event.text, options_shown: optionsShown }) });
    return await r.json();
  } catch { return { response: 'Unable to reach Fin right now.' }; }
};

// ─── Simulate: insight report ────────────────────────
export const getSimInsight = async (payload) => {
  try {
    const r = await fetch(`${BACKEND_URL}/simulate/insight`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return await r.json();
  } catch { return { report: null }; }
};

// ─── Flashcard (legacy) ───────────────────────────────
export const getFlashcardAnswer = async (question, ragQuery) => {
  try {
    const r = await fetch(`${BACKEND_URL}/flashcard`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, rag_query: ragQuery }) });
    return await r.json();
  } catch { return { error: true, answer: 'Unable to connect.' }; }
};

// ─── Lesson section (legacy) ─────────────────────────
export const getLessonSection = async (lessonTopic, sectionHeading, sectionKey, otherSections, userProfile) => {
  try {
    const r = await fetch(`${BACKEND_URL}/lesson-section`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lesson_topic: lessonTopic, section_heading: sectionHeading, section_key: sectionKey, other_sections: otherSections, user_profile: userProfile }) });
    return await r.json();
  } catch { return { error: true }; }
};


// ═══════════════════════════════════════════════════════
// LIFE SIM — STAGE 1 CONVERSATION (RAG-powered via /ask)
// All calls go through the existing RAG pipeline.
// ragAsk(query, overridePrompt, userProfile) → { response }
// ═══════════════════════════════════════════════════════

export const ragAsk = async (query, overridePrompt, userProfile = {}) => {
  let rawText = '';
  try {
    const r = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, override_prompt: overridePrompt, user_profile: userProfile }),
    });
    rawText = await r.text();
    const data = JSON.parse(rawText);
    if (!data.response) throw new Error('no response field');
    console.log('[ragAsk] OK:', query.slice(0, 35), '→', data.response.slice(0, 55));
    return { response: data.response };
  } catch (e) {
    console.error('[ragAsk] FAILED:', query.slice(0, 35), e.message, rawText.slice(0, 60));
    throw e;
  }
};

// ── Fin frames WHY retirement age matters ────────────────────────────────────
export const simFrameAge = async ({ userName, income, incomeLabel }) => {
  const s = Math.round(income * 0.2);
  try {
    return await ragAsk(
      'FI number retirement age financial independence 4% rule Singapore',
      `You are Fin, a direct Singapore financial advisor talking to ${userName} ($${income.toLocaleString()}/month, saves $${s.toLocaleString()}/month at 20%).

In 2-3 short conversational sentences: explain why retirement age dramatically changes how much they need — retiring at 45 vs 65 roughly triples the number (fewer years to save, more years to fund it). Reference their income. End by asking when they want to stop needing to work. Sound like a smart friend, not a textbook. No "Great!" or "It's important to note".`,
      { name: userName }
    );
  } catch {
    return { response: `Here's what most people miss — the age you retire changes your FI Number by 2-3x. Retiring at 45 vs 65 means you have fewer years to build it AND more years to live off it. On $${income.toLocaleString()}/month, when do you want to stop needing to work?` };
  }
};

// ── Fin reacts to their chosen retirement age ────────────────────────────────
export const simReactAge = async ({ userName, income, incomeLabel, retireAge }) => {
  const years = retireAge - 24;
  const s = Math.round(income * 0.2);
  try {
    return await ragAsk(
      `retirement planning age ${retireAge} savings compounding Singapore`,
      `You are Fin. ${userName} wants to retire at ${retireAge} — that's ${years} years away. They earn $${income.toLocaleString()}/month, saving $${s.toLocaleString()}/month.

2 sentences max. Give an honest, specific reaction to ${retireAge}: ${retireAge <= 45 ? `it's ambitious — be real about what needs to be true on $${s.toLocaleString()}/month` : retireAge <= 55 ? `it's achievable but only if they start investing now — make compounding feel real with their $${s.toLocaleString()}/month` : `they have time — note the tradeoff is funding more retirement years`}. Use their actual numbers.`,
      { name: userName }
    );
  } catch {
    const t = retireAge <= 45
      ? `${retireAge} is ambitious — ${years} years means you need both a high savings rate and strong investment returns on $${s.toLocaleString()}/month. It's doable, but there's no room to delay starting.`
      : `${years} years is a solid runway — at $${s.toLocaleString()}/month invested consistently, compounding does most of the heavy lifting. The key is starting now.`;
    return { response: t };
  }
};

// ── Fin frames the lifestyle cost builder ────────────────────────────────────
export const simFrameLifestyle = async ({ userName, income, retireAge }) => {
  try {
    return await ragAsk(
      'Singapore retirement living costs healthcare housing monthly expenses estimate',
      `You are Fin. ${userName} wants to retire at ${retireAge} in Singapore.

2-3 sentences: explain why people underestimate retirement costs. Pick the most surprising angle — healthcare out-of-pocket costs ($500-800/month after 60 even with MediShield), or more free time means more spending. Use real Singapore figures. End: "Let's build your actual number — tap each category below." No bullet points, sound human.`,
      { name: userName }
    );
  } catch {
    return { response: `Most people underestimate their retirement costs — healthcare alone can run $500-800/month out-of-pocket in Singapore after 60, even with MediShield Life. And retirement doesn't mean spending less; more free time usually means more spending. Let's build your actual number — tap each category below to set what you'd realistically spend.` };
  }
};

// ── Fin reacts to the FI Number — honest assessment of whether it's reachable ─
export const simReactFFN = async ({ userName, income, incomeLabel, retireAge, monthlyTotal, ffn }) => {
  const years = retireAge - 24;
  const s = Math.round(income * 0.2);
  const r = 0.06 / 12;
  const n = years * 12;
  const fv = Math.round(s * ((Math.pow(1 + r, n) - 1) / r));
  const reachable = fv >= ffn;
  const shortfall = Math.max(0, ffn - fv);

  try {
    return await ragAsk(
      'financial independence number savings investment returns Singapore realistic',
      `You are Fin. ${userName}'s FI Number: $${ffn.toLocaleString()} ($${monthlyTotal.toLocaleString()}/month × 12 × 25).
Income: $${income.toLocaleString()}/month. Saves $${s.toLocaleString()}/month (20%). ${years} years to retire at ${retireAge}.
Investing $${s.toLocaleString()}/month at 6%/year for ${years} years → ~$${fv.toLocaleString()} projected. ${reachable ? `✓ This COVERS their $${ffn.toLocaleString()} FI Number.` : `✗ $${shortfall.toLocaleString()} SHORT of $${ffn.toLocaleString()}.`}

3-4 sentences: explain the FI Number clearly (monthly × 12 × 25 = 4% rule). Be honest — does $${s.toLocaleString()}/month invested at 6% actually get them there? ${reachable ? 'Confirm it works and explain how compounding does the heavy lifting.' : `Be direct about the $${shortfall.toLocaleString()} gap — what changes it (higher savings rate, better returns, or lower lifestyle costs).`} End: "Does this feel right, or adjust your costs?" 3 sentences MAX. No paragraphs. Sound like a real advisor — direct and specific, not a textbook.`,
      { name: userName }
    );
  } catch {
    const fb = reachable
      ? `Your FI Number is $${ffn.toLocaleString()} — $${monthlyTotal.toLocaleString()}/month × 12 × 25, the amount where 4% annual withdrawal covers your lifestyle indefinitely. Investing $${s.toLocaleString()}/month at 6% for ${years} years gets you to ~$${fv.toLocaleString()}, which covers it. Does this feel right?`
      : `Your FI Number is $${ffn.toLocaleString()}. Honest picture: investing $${s.toLocaleString()}/month at 6% for ${years} years gets you ~$${fv.toLocaleString()} — $${shortfall.toLocaleString()} short. You'd need to save more, earn higher returns, or trim your retirement lifestyle. Does this feel right, or do you want to adjust?`;
    return { response: fb, reaches_ffn: reachable, fv_invested: fv, shortfall };
  }
};

// ── Fin reacts to the short-term goal ────────────────────────────────────────
export const simReactGoal = async ({ userName, income, goalLabel, goalAmount }) => {
  const s = Math.round(income * 0.2);
  const months = Math.ceil(goalAmount / s);
  try {
    return await ragAsk(
      `savings goal ${goalLabel} Singapore student`,
      `You are Fin. ${userName} wants to save $${goalAmount.toLocaleString()} for "${goalLabel}". They save $${s.toLocaleString()}/month — so ${months} months to reach this goal.

2 sentences. React genuinely to the specific goal: ${goalLabel.toLowerCase().includes('phone') || goalLabel.toLowerCase().includes('laptop') || goalLabel.toLowerCase().includes('tech') ? 'tech is human capital investment' : goalLabel.toLowerCase().includes('trip') || goalLabel.toLowerCase().includes('travel') || goalLabel.toLowerCase().includes('home') ? 'travel and connection have real value' : goalLabel.toLowerCase().includes('emergency') || goalLabel.toLowerCase().includes('fund') ? 'emergency fund is the highest-ROI financial move they can make right now' : 'find something genuine to say about this specific goal'}. Then: "At $${s.toLocaleString()}/month, you'd get there in ${months} month${months === 1 ? '' : 's'}." Make it feel achievable. No generic opener.`,
      { name: userName }
    );
  } catch {
    const isSmall = goalAmount < s * 3;
    const isLarge = goalAmount > s * 12;
    const msg = isSmall
      ? `$${goalAmount.toLocaleString()} for ${goalLabel} is a quick win — at $${s.toLocaleString()}/month you'd get there in ${months} month${months === 1 ? '' : 's'}, which builds real momentum.`
      : isLarge
      ? `$${goalAmount.toLocaleString()} is a meaningful target for ${goalLabel} — about ${months} months at your current savings rate, though any windfalls would shorten that.`
      : `$${goalAmount.toLocaleString()} for ${goalLabel} — at $${s.toLocaleString()}/month you'd get there in ${months} months. Your FI Blueprint is ready below.`;
    return { response: msg, months_to_goal: months };
  }
};