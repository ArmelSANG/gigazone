// Configuration Supabase centralisée
export const SUPABASE_URL = 'https://dfflzuwyntrdfxujvsqr.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmZmx6dXd5bnRyZGZ4dWp2c3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDE4NjMsImV4cCI6MjA4NDgxNzg2M30.tZgXgUUalq-5y7nh1fxA5mo5CsGJU2_8l_T-z1Cc-24';

// Headers pour les requêtes GET
const getHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

// Headers pour les mutations (POST/PATCH) - besoin de return=representation
const mutationHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// GET request (auto-pagination pour dépasser la limite de 1000 lignes)
export const supabaseGet = async (endpoint) => {
  // Si l'endpoint a déjà un limit, pas de pagination auto
  if (endpoint.includes('limit=')) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, { headers: getHeaders });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Supabase GET error:', error);
      return null;
    }
  }
  
  const PAGE_SIZE = 1000;
  let allData = [];
  let offset = 0;
  let hasMore = true;
  
  try {
    while (hasMore) {
      const separator = endpoint.includes('?') ? '&' : '?';
      const paginatedEndpoint = `${endpoint}${separator}limit=${PAGE_SIZE}&offset=${offset}`;
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${paginatedEndpoint}`, { headers: getHeaders });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        offset += PAGE_SIZE;
        if (data.length < PAGE_SIZE) hasMore = false;
      }
    }
    return allData;
  } catch (error) {
    console.error('Supabase GET error:', error);
    return allData.length > 0 ? allData : null;
  }
};

// POST request
export const supabasePost = async (endpoint, data) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      method: 'POST',
      headers: mutationHeaders,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Supabase POST error:', error);
    return null;
  }
};

// PATCH request
export const supabasePatch = async (endpoint, data) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      method: 'PATCH',
      headers: mutationHeaders,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Supabase PATCH error:', error);
    return null;
  }
};

// DELETE request
export const supabaseDelete = async (endpoint) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    return response.ok;
  } catch (error) {
    console.error('Supabase DELETE error:', error);
    return false;
  }
};

// Upload file to Storage
export const supabaseUpload = async (bucket, path, file) => {
  try {
    console.log('Upload starting:', { bucket, path, fileType: file.type, fileSize: file.size });
    
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: file
    });
    
    const responseText = await response.text();
    console.log('Upload response:', response.status, responseText);
    
    if (!response.ok) {
      // Parser l'erreur JSON si possible
      let errorMsg = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorMsg = errorJson.message || errorJson.error || responseText;
      } catch (e) {}
      
      throw new Error(`${response.status}: ${errorMsg}`);
    }
    
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    console.log('Upload success:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Supabase Upload error:', error);
    // Retourner l'erreur au lieu de null pour l'afficher
    throw error;
  }
};

// Supprimer un fichier du Storage
export const supabaseStorageDelete = async (bucket, path) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log('Storage delete:', response.status, path);
    return response.ok;
  } catch (error) {
    console.error('Storage delete error:', error);
    return false;
  }
};

// Extraire le chemin storage depuis une URL publique Supabase
export const extractStoragePath = (publicUrl, bucket) => {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.substring(idx + marker.length);
};

// Realtime subscription helper
export const supabaseSubscribe = (table, callback) => {
  // Note: Pour une vraie implémentation Realtime, utiliser le client Supabase JS
  // Ceci est une simulation avec polling
  const interval = setInterval(async () => {
    const data = await supabaseGet(`${table}?order=created_at.desc&limit=10`);
    if (data) callback(data);
  }, 5000);
  
  return () => clearInterval(interval);
};

// Appel Edge Function Aro
export const callAroAPI = async (message, history = []) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/aro-chat`, {
      method: 'POST',
      headers: mutationHeaders,
      body: JSON.stringify({ message, history })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.response || null;
  } catch (error) {
    console.error('Aro API error:', error);
    return null;
  }
};
