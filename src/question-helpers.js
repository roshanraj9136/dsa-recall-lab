export const SERVICE_TRACKS = ['accenture-core', 'tcs-core', 'tcs-digital', 'deloitte-tech'];
export const ALL_TRACKS = ['accenture-core', 'tcs-core', 'tcs-digital', 'deloitte-tech', 'saas-12-15'];
export const UPPER_TRACKS = ['tcs-digital', 'deloitte-tech', 'saas-12-15'];
export const PRODUCT_TRACKS = ['deloitte-tech', 'saas-12-15'];
export const SAAS_TRACK = ['saas-12-15'];

export function q(question) {
  return Object.freeze({
    minutes: 25,
    ...question,
    tracks: Object.freeze([...(question.tracks || [])]),
    steps: Object.freeze([...(question.steps || [])]),
    anchors: Object.freeze([...(question.anchors || [])]),
    traps: Object.freeze([...(question.traps || [])]),
    variations: Object.freeze([...(question.variations || [])])
  });
}
