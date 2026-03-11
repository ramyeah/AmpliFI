from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.rag import get_rag_response
from app.rag import index, embedding_model, openai_client

app = FastAPI(title="AmpliFI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── /ask ─────────────────────────────────────────────
class QueryRequest(BaseModel):
    query: str
    user_profile: dict = None
    override_prompt: str = None

@app.get("/")
def root():
    return {"status": "AmpliFI backend is running"}

@app.post("/ask")
def ask(request: QueryRequest):
    result = get_rag_response(request.query, request.user_profile, request.override_prompt)
    return result

# ─── /quiz ────────────────────────────────────────────
class QuizRequest(BaseModel):
    topic: str
    user_profile: dict = None

@app.post("/quiz")
def generate_quiz(request: QuizRequest):
    query_vector = embedding_model.encode(request.topic).tolist()
    results = index.query(vector=query_vector, top_k=3, include_metadata=True)
    top_matches = [r for r in results.matches if r.score >= 0.35]
    context = "\n\n".join([m.metadata.get("text", "") for m in top_matches]) if top_matches else "Use your knowledge of Singapore personal finance."

    name = request.user_profile.get("name", "the user") if request.user_profile else "the user"

    prompt = f"""Generate exactly 5 multiple choice quiz questions about "{request.topic}" for a Singapore university student named {name}.

CONTEXT:
{context}

Respond with ONLY this JSON, no other text:
{{
  "questions": [
    {{
      "question": "Question text?",
      "options": ["A) option", "B) option", "C) option", "D) option"],
      "correct": "A",
      "explanation": "Why A is correct"
    }}
  ]
}}"""

    completion = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
        temperature=0.3
    )

    return {
        "response": completion.choices[0].message.content,
        "disclaimer": False
    }

# ─── /flashcard ───────────────────────────────────────
class FlashcardRequest(BaseModel):
    rag_query: str
    question: str

@app.post("/flashcard")
def get_flashcard_answer(request: FlashcardRequest):
    query_vector = embedding_model.encode(request.rag_query).tolist()
    results = index.query(vector=query_vector, top_k=3, include_metadata=True)
    top_matches = [r for r in results.matches if r.score >= 0.35]
    context = "\n\n".join([m.metadata.get("text", "") for m in top_matches]) if top_matches else "Use your knowledge of Singapore personal finance."

    prompt = f"""You are a Singapore financial literacy flashcard assistant.
Answer this flashcard question concisely for a university student in Singapore.
Keep the answer to 2-4 sentences maximum. Include specific Singapore figures where relevant.

CONTEXT FROM OFFICIAL SOURCES:
{context}

QUESTION: {request.question}

ANSWER:"""

    completion = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        temperature=0.2
    )

    return {
        "answer": completion.choices[0].message.content,
        "disclaimer": False
    }

# ─── /lesson-section ──────────────────────────────────
class LessonSectionRequest(BaseModel):
    lesson_topic: str
    section_heading: str
    section_key: str
    other_sections: list[str] = []
    user_profile: dict = None

@app.post("/lesson-section")
def get_lesson_section(request: LessonSectionRequest):
    specific_query = f"{request.lesson_topic} {request.section_heading}"
    query_vector = embedding_model.encode(specific_query).tolist()
    results = index.query(vector=query_vector, top_k=3, include_metadata=True)
    top_matches = [r for r in results.matches if r.score >= 0.35]
    context = "\n\n".join([m.metadata.get("text", "") for m in top_matches]) if top_matches else "Use your knowledge of Singapore personal finance."

    name = request.user_profile.get("name", "the student") if request.user_profile else "the student"
    other = ", ".join(request.other_sections) if request.other_sections else "none"

    prompt = f"""You are AmpliFI, a Singapore financial literacy educator writing ONE specific section of a lesson.

LESSON TOPIC: {request.lesson_topic}
THIS SECTION: {request.section_heading}
OTHER SECTIONS IN THIS LESSON (DO NOT cover these): {other}

STRICT RULES:
- Write ONLY about "{request.section_heading}" — nothing else
- Keep it concise: 150-250 words maximum
- NEVER write prose paragraphs — use ONLY structured formats
- Always use Singapore-specific figures, rates, and examples (in SGD)
- Address the student directly as "{name}"

REQUIRED FORMATS (use ALL that are relevant):
1. **Bold Term**: short definition on same line
2. Bullet points for lists of facts
3. Numbered steps for processes
4. Markdown tables for comparisons
5. Callout for Singapore tips: > ⚠️ **Singapore Tip:** your tip here
6. Callout for key takeaway: > 💡 **Key Takeaway:** one sentence summary

CONTEXT FROM OFFICIAL SOURCES:
{context}

Write the "{request.section_heading}" section now:"""

    completion = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400,
        temperature=0.2
    )

    return {
        "response": completion.choices[0].message.content,
        "disclaimer": False
    }

# ─── /bot-fact ────────────────────────────────────────
class BotFactRequest(BaseModel):
    label: str
    prompt: str

@app.post("/bot-fact")
def get_bot_fact(request: BotFactRequest):
    query_vector = embedding_model.encode(request.prompt).tolist()
    results = index.query(vector=query_vector, top_k=3, include_metadata=True)
    top_matches = [r for r in results.matches if r.score >= 0.35]
    context = "\n\n".join([m.metadata.get("text", "") for m in top_matches]) if top_matches else ""

    prompt = f"""Answer in 2-3 sentences maximum. Be specific — include real Singapore figures where possible.
Question: {request.label}
Context: {context}
Answer:"""

    completion = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=120,
        temperature=0.2
    )
    return {"answer": completion.choices[0].message.content}