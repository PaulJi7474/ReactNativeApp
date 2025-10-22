// Base URL for the Books Form RESTful API
export const API_BASE_URL = "https://comp2140a3.uqcloud.net/api";

// JWT token for authorization, replace with your actual token from My Grades in Blackboard
// From the A2 JSON Web Token column, view Feedback to show your JWT
// The JWT for A3 is the same as A2
export const JWT_TOKEN = "..";

// Your UQ student username, used for row-level security to retrieve your records
export const USERNAME = "";

/**
 * Helper function to handle API requests.
 * It sets the Authorization token and optionally includes the request body.
 *
 * @param {string} endpoint - The API endpoint to call (e.g., "/form", "/field").
 * @param {string} [method='GET'] - The HTTP method to use (GET, POST, PATCH, DELETE).
 * @param {object|null} [body=null] - The request body to send, typically for POST or PATCH.
 * @returns {Promise<object|Array>} - The JSON response from the API.
 * @throws Will throw an error if the HTTP response is not OK.
 */
export async function apiRequest(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`, // Include the JWT token for authentication
    },
  };

  // If the method is POST, PATCH or DELETE, we want the response to include the full representation
  if (method === "POST" || method === "PATCH" || method === "DELETE") {
    options.headers["Prefer"] = "return=representation";
  }

  // If a body is provided, add it to the request and include the username
  if (body) {
    options.body = JSON.stringify({ ...body, username: USERNAME });
  }

  // Make the API request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP error! status: ${response.status} – ${errText}`);
  }

  // Return the response as JSON
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Create a new form record.
 *
 * @param {object} body - The form payload to send to the API.
 * @returns {Promise<object>} - The created form object.
 */
export async function createForm(body) {
  return apiRequest("/form", "POST", body);
}

/**
 * Retrieve forms from the API.
 *
 * @param {object} [options]
 * @param {string} [options.username] - Optional username filter (defaults to configured USERNAME).
 * @param {string} [options.query] - Optional custom query string for advanced filtering.
 * @returns {Promise<Array>} - The list of forms returned by the API.
 */
export async function fetchForms({ username = USERNAME, query = "" } = {}) {
  const search = query || (username ? `/form?username=eq.${username}` : "/form");
  return apiRequest(search);
}

export async function getFormById(id) {
  const results = await apiRequest(`/form?id=eq.${id}`);
  return Array.isArray(results) ? results[0] : results;
}

/**
 * Update an existing form.
 *
 * @param {number|string} id - The form identifier.
 * @param {object} body - The fields to update.
 * @returns {Promise<object>} - The updated form object.
 */
export async function updateForm(id, body) {
  return apiRequest(`/form?id=eq.${id}`, "PATCH", body);
}

/**
 * Delete a form by its ID.
 *
 * @param {number|string} id - The form identifier.
 * @returns {Promise<object|null>} - The deleted form representation, if returned.
 */
export async function deleteForm(id) {
  return apiRequest(`/form?id=eq.${encodeURIComponent(id)}`, "DELETE");
}
