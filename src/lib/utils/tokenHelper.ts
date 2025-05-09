import { getAuthToken, getCookie } from '@/lib/utils/cookies';

/**
 * Function to check if a token is a JWT
 * JWTs typically have 3 parts separated by dots and start with 'ey'
 */
export function isJWT(token: string): boolean {
  return token.includes('.') && token.split('.').length === 3 && token.startsWith('ey');
}

/**
 * Format auth header based on token format
 * Some APIs expect "Bearer token", others just "token"
 */
export function formatAuthHeader(token: string): string {
  // If looks like JWT, use Bearer format
  if (isJWT(token)) {
    return `Bearer ${token}`;
  }
  // Otherwise return as-is
  return token;
}

/**
 * Debug the token retrieval system
 * Logs helpful information about available tokens
 */
export function debugAuthTokens(): void {
  const standardToken = getCookie('accessToken');
  const legacyToken = getCookie('__frsadfrusrtkn');
  const finalToken = getAuthToken();
  
  console.log('=== AUTH TOKEN DEBUG ===');
  console.log('Standard token exists:', standardToken ? 'Yes' : 'No');
  console.log('Legacy token exists:', legacyToken ? 'Yes' : 'No');
  console.log('Final token from getAuthToken():', finalToken ? 'Token found' : 'No token');
  
  if (finalToken) {
    console.log('Token characteristics:', {
      length: finalToken.length,
      isJWT: isJWT(finalToken),
      source: standardToken ? 'accessToken cookie' : (legacyToken ? 'legacy cookie' : 'unknown')
    });
  }
  
  console.log('========================');
}

/**
 * Helper to make authenticated API requests
 * Tries both with and without Bearer prefix if needed
 */
export async function makeAuthenticatedRequest(
  url: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<Response> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  // First try with standard Bearer format (or appropriate format based on token type)
  const authHeader = formatAuthHeader(token);
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    credentials: 'include'
  };
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  // If unauthorized and we used Bearer prefix, try without it as fallback
  if (response.status === 401 && authHeader.startsWith('Bearer ')) {
    console.log('Trying fallback authentication format...');
    
    const fallbackOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token // Without Bearer prefix
      }
    };
    
    return fetch(url, fallbackOptions);
  }
  
  return response;
}