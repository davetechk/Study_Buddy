// ============================================================================
//  ai.js — PLACEHOLDER AI
//  Right now these return fake-but-sensible content so we can prove the whole
//  app flow works. LATER, these two functions will call a Supabase Edge
//  Function that talks to OpenAI. Nothing else in the app changes — only this.
// ============================================================================

// Fake "summary + bullet points" from note text.
async function aiSummarize(content) {
  await fakeDelay();
  const firstLine = (content.trim().split("\n")[0] || "your notes").slice(0, 80);
  return {
    summary:
      "This is a placeholder summary. Once real AI is connected, this paragraph " +
      "will be a clear, concise overview of your note about \u201C" + firstLine + "\u201D, " +
      "written to help you understand it faster than reading the original.",
    bulletPoints: [
      "- Key point one will appear here once AI is connected",
      "- Key point two: the main idea of your note",
      "- Key point three: an important detail to remember",
      "- Key point four: something to focus on",
      "- Key point five: a final takeaway"
    ].join("\n")
  };
}

// Fake multiple-choice questions from note text.
async function aiQuiz(content, count = 5) {
  await fakeDelay();
  const qs = [];
  for (let i = 1; i <= count; i++) {
    qs.push({
      question: "Placeholder question " + i + ": which option is correct? (real questions come once AI is wired up)",
      options: ["Option A", "Option B (correct)", "Option C", "Option D"],
      correctAnswer: 1
    });
  }
  return qs;
}

function fakeDelay() {
  return new Promise(r => setTimeout(r, 700)); // mimics a real API call
}
