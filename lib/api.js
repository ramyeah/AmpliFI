const BACKEND_URL = 'http://192.168.0.169:8000';

export const askRAG = async (query, userProfile) => {
  try {
    const response = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, user_profile: userProfile })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API error:', error);
    return { error: true, message: error.message };
  }
};

export const generateLesson = async (topic, userProfile) => {
  const query = `Explain ${topic} for a Singapore university student. Include specific Singapore examples, relevant CPF or MAS information, and practical tips.`;
  return await askRAG(query, userProfile);
};

export const getFlashcardAnswer = async (question, ragQuery) => {
  try {
    const response = await fetch(`${BACKEND_URL}/flashcard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, rag_query: ragQuery }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Flashcard API error:', error);
    return { error: true };
  }
};

export const generateQuiz = async (topic, userProfile) => {
  try {
    const response = await fetch(`${BACKEND_URL}/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        topic: topic,
        user_profile: userProfile
      })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Quiz API error:', error);
    return { error: true, message: error.message };
  }


};