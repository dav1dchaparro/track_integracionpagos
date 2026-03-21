// Base URL of the SmartReceipt FastAPI backend
const BASE = 'http://localhost:8000'

// Default merchant ID used for all requests; can be changed via setMerchant()
let MERCHANT = 'demo_merchant_001'

/**
 * Updates the active merchant ID for all subsequent API calls.
 * Called from App.jsx after the user logs in.
 */
export function setMerchant(id) {
  MERCHANT = id
}

/**
 * Internal helper: performs a GET request to the given path and returns
 * the parsed JSON body. Throws an Error if the HTTP status is not 2xx.
 */
async function get(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/**
 * Fetches the main dashboard summary for the active merchant.
 * @param {number} periodDays - Number of days to include in the report (default: 30)
 * @returns {Promise<Object>} Dashboard data (revenue, transactions, top products, etc.)
 */
export function fetchDashboard(periodDays = 30) {
  return get(`/api/dashboard/${MERCHANT}?period_days=${periodDays}`)
}

/**
 * Fetches the list of previously generated AI insights for the active merchant.
 * Returns an empty array if none exist yet.
 * @returns {Promise<Array>} Array of insight objects
 */
export function fetchInsights() {
  return get(`/api/insights/${MERCHANT}`)
}

/**
 * Triggers the backend to generate new AI insights for the active merchant,
 * based on the given period. This is a POST request that may take a moment.
 * @param {number} periodDays - Number of days of sales data to analyze (default: 30)
 * @returns {Promise<Object>} Generation result from the backend
 */
export function generateInsights(periodDays = 30) {
  return fetch(`${BASE}/api/insights/${MERCHANT}/generate?period_days=${periodDays}`, {
    method: 'POST',
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  })
}

/**
 * Fetches the most recent transactions for the active merchant.
 * @param {number} limit - Maximum number of transactions to return (default: 10)
 * @returns {Promise<Array>} Array of transaction objects
 */
export function fetchTransactions(limit = 10) {
  return get(`/api/transactions/${MERCHANT}?limit=${limit}&offset=0`)
}

// Maps UI date-range labels to their equivalent number of days
export const PERIOD_MAP = { '7D': 7, '30D': 30, '90D': 90 }
