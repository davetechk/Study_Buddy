// ============================================================================
//  ai.js — REAL AI (via Supabase Edge Function "ai-generate" → Gemini)
//  Same function names and return shapes as the placeholder version, so
//  nothing else in the app changes. To switch AI providers later, you only
//  change the Edge Function — not this file.
// ============================================================================

async function aiSummarize(content, teacherMaterial = "") {
  const { data, error } = await sb.functions.invoke("ai-generate", {
    body: { action: "summary", content, teacherMaterial }
  });
  if (error) throw new Error(humanError(error));
  if (data && data.error) throw new Error(data.error);
  return {
    summary: data.summary || "Could not generate summary.",
    bulletPoints: data.bulletPoints || "- Could not generate bullet points.",
    blended: !!data.blended
  };
}

async function aiQuiz(content, count = 5, teacherMaterial = "") {
  const { data, error } = await sb.functions.invoke("ai-generate", {
    body: { action: "quiz", content, count, teacherMaterial }
  });
  if (error) throw new Error(humanError(error));
  if (data && data.error) throw new Error(data.error);
  const qs = Array.isArray(data.questions) ? data.questions : [];
  return qs.filter(q =>
    q && typeof q.question === "string" &&
    Array.isArray(q.options) && q.options.length >= 2 &&
    Number.isInteger(q.correctAnswer)
  );
}

function humanError(error) {
  try {
    if (error.context && error.context.status) {
      return "AI service error (" + error.context.status + "). Check the function logs.";
    }
  } catch (e) {}
  return error.message || "AI service is unavailable right now.";
}