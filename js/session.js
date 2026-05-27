// ============================================================================
//  session.js — unifies the two account types for the front end.
//  Visitors  = Supabase Auth (sb.auth)
//  Students  = custom JWT stored in localStorage, talked to via student-* funcs
//  Pages call these helpers instead of caring which type the learner is.
// ============================================================================

const STUDENT_TOKEN_KEY = "jcabss_student_token";
const STUDENT_USER_KEY  = "jcabss_student_user";

// ---- student token storage ----
function saveStudentSession(token, user) {
  localStorage.setItem(STUDENT_TOKEN_KEY, token);
  localStorage.setItem(STUDENT_USER_KEY, JSON.stringify(user));
}
function clearStudentSession() {
  localStorage.removeItem(STUDENT_TOKEN_KEY);
  localStorage.removeItem(STUDENT_USER_KEY);
}
function getStudentToken() { return localStorage.getItem(STUDENT_TOKEN_KEY); }
function getStudentUser() {
  try { return JSON.parse(localStorage.getItem(STUDENT_USER_KEY) || "null"); }
  catch { return null; }
}

// ---- the unified "who am I" ----
// Returns { type:'visitor'|'student', id, name, ... } or null.
async function currentLearner() {
  // student session takes precedence if present
  const stoken = getStudentToken();
  const suser = getStudentUser();
  if (stoken && suser) return { ...suser, type: "student" };

  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    return { type: "visitor", id: session.user.id, name: (session.user.email||"").split("@")[0], email: session.user.email };
  }
  return null;
}

// Redirect to login if nobody is signed in. Returns the learner.
async function requireLearner() {
  const l = await currentLearner();
  if (!l) { go("index.html"); return null; }
  return l;
}

async function logoutLearner() {
  clearStudentSession();
  try { await sb.auth.signOut(); } catch {}
  go("index.html");
}

// ---- call the student-data function with the token attached ----
async function studentData(action, payload = {}) {
  const token = getStudentToken();
  const { data, error } = await sb.functions.invoke("student-data", {
    body: { action, payload },
    headers: { "X-Student-Token": token || "" }
  });
  if (error) throw new Error((error.message)||"Request failed");
  if (data && data.error) throw new Error(data.error);
  return data;
}

// ============================================================================
//  Unified data access — works for BOTH visitor and student.
//  Visitor → direct Supabase (RLS protects). Student → student-data function.
// ============================================================================

async function dataListNotes(learner) {
  if (learner.type === "student") return (await studentData("list_notes")).notes;
  const { data } = await sb.from("notes")
    .select("id,title,summary,created_at")
    .eq("learner_type","visitor").eq("learner_id", learner.id)
    .order("created_at",{ascending:false});
  return data || [];
}

async function dataListQuizzes(learner) {
  if (learner.type === "student") return (await studentData("list_quizzes")).quizzes;
  const { data } = await sb.from("quizzes")
    .select("accuracy,completed,created_at")
    .eq("learner_type","visitor").eq("learner_id", learner.id);
  return data || [];
}

async function dataGetNote(learner, id) {
  if (learner.type === "student") return (await studentData("get_note",{id})).note;
  const { data } = await sb.from("notes").select("*").eq("id", id).maybeSingle();
  return data;
}

async function dataCreateNote(learner, note) {
  if (learner.type === "student") return (await studentData("create_note", note)).note;
  const { data, error } = await sb.from("notes").insert({
    learner_id: learner.id, learner_type: "visitor",
    title: note.title, subject: note.subject||null,
    original_content: note.content, summary: note.summary, bullet_points: note.bulletPoints
  }).select().single();
  if (error) throw error;
  sb.from("activity_log").insert({ actor_id: learner.id, actor_type:"visitor", action:"note_created" }).then(()=>{},()=>{});
  return data;
}

async function dataDeleteNote(learner, id) {
  if (learner.type === "student") return studentData("delete_note",{id});
  const { error } = await sb.from("notes").delete().eq("id", id);
  if (error) throw error;
}

async function dataGetQuiz(learner, id) {
  if (learner.type === "student") return (await studentData("get_quiz",{id})).quiz;
  const { data } = await sb.from("quizzes").select("*").eq("id", id).maybeSingle();
  return data;
}

async function dataCreateQuiz(learner, noteId, questions) {
  if (learner.type === "student") return (await studentData("create_quiz",{noteId,questions})).quiz;
  const { data, error } = await sb.from("quizzes").insert({
    learner_id: learner.id, learner_type:"visitor",
    source_type:"note", note_id: noteId, questions, completed:false, score:0, accuracy:0
  }).select().single();
  if (error) throw error;
  return data;
}

async function dataSubmitQuiz(learner, quizId, score, accuracy) {
  if (learner.type === "student") return studentData("submit_quiz",{quizId,score,accuracy});
  await sb.from("quizzes").update({ score, accuracy, completed:true }).eq("id", quizId);
  sb.from("activity_log").insert({ actor_id: learner.id, actor_type:"visitor", action:"quiz_completed" }).then(()=>{},()=>{});
}