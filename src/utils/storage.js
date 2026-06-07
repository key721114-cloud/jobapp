export const KEYS = {
  EXPERIENCES: 'jah_experiences',
  COMPANIES: 'jah_companies',
  COVER_LETTERS: 'jah_cover_letters',
  API_KEY: 'jah_api_key',
}

export function getItem(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
