// Shared client for talking to the compiler microservice.
// Used by both the API (/run) and the queue worker.
const COMPILER_URL = process.env.COMPILER_URL || 'http://localhost:7000';
const SUPPORTED_LANGUAGES = ['cpp', 'java', 'py'];

// Sends one execution job to the compiler service.
// Returns { output } on success, or { status, error } on a known failure.
async function runOnCompiler(language, code, input) {
    const resp = await fetch(`${COMPILER_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, input }),
    });
    if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `Compiler service error (${resp.status})`);
    }
    return resp.json();
}

module.exports = { runOnCompiler, SUPPORTED_LANGUAGES, COMPILER_URL };
