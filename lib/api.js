// lib/api.js
const BACKEND_URL = 'http://192.168.0.169:8000';

// ─── RAG Q&A (chatbot) ────────────────────────────────
export const askRAG = async (query, userProfile) => {
  try {
    const response = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, user_profile: userProfile }),
    });
    return await response.json();
  } catch (error) {
    console.error('askRAG error:', error);
    return { error: true, response: 'Unable to connect to the server.' };
  }
};

// ─── Quiz generation ──────────────────────────────────
export const generateQuiz = async (topic, userProfile) => {
  try {
    const response = await fetch(`${BACKEND_URL}/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, user_profile: userProfile }),
    });
    return await response.json();
  } catch (error) {
    console.error('generateQuiz error:', error);
    return { error: true };
  }
};

// ─── Lesson content generation (legacy — kept for reference) ──
export const generateLesson = async (topic, userProfile) => {
  try {
    const response = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: topic,
        user_profile: userProfile,
        override_prompt: `You are a financial literacy educator. Explain "${topic}" clearly and concisely for a university student in Singapore. Use bullet points and short paragraphs. Keep it under 200 words.`,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('generateLesson error:', error);
    return { error: true };
  }
};

// ─── Bot fact chip (RAG-powered inline stat) ──────────
export const getBotFact = async (label, prompt) => {
  try {
    const response = await fetch(`${BACKEND_URL}/bot-fact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, prompt }),
    });
    return await response.json();
  } catch (error) {
    console.error('getBotFact error:', error);
    return { answer: 'Unable to fetch live data right now. Please check your connection.' };
  }
};

// ─── Flashcard answer (legacy — no longer used since flashcards are static) ──
export const getFlashcardAnswer = async (question, ragQuery) => {
  try {
    const response = await fetch(`${BACKEND_URL}/flashcard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, rag_query: ragQuery }),
    });
    return await response.json();
  } catch (error) {
    console.error('getFlashcardAnswer error:', error);
    return { error: true, answer: 'Unable to connect to the server.' };
  }
};

// ─── Lesson section (legacy — no longer used since content is static) ──
export const getLessonSection = async (lessonTopic, sectionHeading, sectionKey, otherSections, userProfile) => {
  try {
    const response = await fetch(`${BACKEND_URL}/lesson-section`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_topic: lessonTopic,
        section_heading: sectionHeading,
        section_key: sectionKey,
        other_sections: otherSections,
        user_profile: userProfile,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('getLessonSection error:', error);
    return { error: true };
  }
};
