// TaskFlow Frontend Config
// After deploying backend on Railway, update this URL
const CONFIG = {
  API_URL: 'http://localhost:8000'
};

// Auto-set API URL on load
(function() {
  if (!localStorage.getItem('api_url')) {
    localStorage.setItem('api_url', CONFIG.API_URL);
  }
})();
