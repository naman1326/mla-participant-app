const SESSION_KEY = "participant_session";

export function saveSession(sessionToken) {
    localStorage.setItem(SESSION_KEY, sessionToken);
}

export function getSession() {
    return localStorage.getItem(SESSION_KEY);
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}