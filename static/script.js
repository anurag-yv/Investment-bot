// Enhanced with better event handling and animations
document.addEventListener('DOMContentLoaded', () => {
    // Front Page Elements
    const frontPage = document.getElementById('front-page');
    const mainInterface = document.getElementById('main-interface');
    const startBtn = document.getElementById('start-btn');
    
    // Menu Elements
    const hamburger = document.querySelector('.hamburger');
    const menu = document.querySelector('.menu');
    
    // Form Elements
    const investmentForm = document.getElementById('investment-form');
    const loadingElement = document.getElementById('loading');
    const resultsElement = document.getElementById('results');
    
    // Initialize front page transition
    startBtn.addEventListener('click', () => {
        frontPage.classList.add('hidden');
        mainInterface.classList.remove('hidden');
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Enhanced menu toggle
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('hidden');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== hamburger) {
            menu.classList.add('hidden');
        }
    });
    
    // Menu actions with better feedback
    document.getElementById('about-dev').addEventListener('click', (e) => {
       // e.preventDefault();
         showAlert('Developed by Investment Insights Team\nA smart tool for your investment journey!');
    });
    
    document.getElementById('dashboard').addEventListener('click', (e) => {
       // e.preventDefault();
        showAlert('Dashboard feature coming in the next update!');
    });
    
    document.getElementById('know-more').addEventListener('click', (e) => {
        //e.preventDefault();
        showAlert('Learn more about investing at reputable sources like Investopedia.');
    });
    
    // Fetch Trending Stocks with loading state
    fetchTrendingStocks();
    
    // Enhanced search functionality
    setupSearch();
    
    // Improved form submission
    if (investmentForm) {
        investmentForm.addEventListener('submit', handleFormSubmission);
    }
});

async function fetchTrendingStocks() {
    const trendingList = document.getElementById('trending-list');
    if (!trendingList) return;
    
    try {
        // Show loading state
        trendingList.innerHTML = '<div class="loading">Loading trends...</div>';
        
        const response = await fetch('http://localhost:5000/api/trending');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        
        // Render trending cards with animation
        trendingList.innerHTML = data.trending.map((stock, index) => `
            <div class="trending-card" data-symbol="${stock.symbol}" style="animation-delay: ${index * 0.1}s">
                <h4>${stock.symbol}</h4>
                <p>$${stock.price.toFixed(2)}</p>
                <span class="${stock.change >= 0 ? 'positive' : 'negative'}">
                    ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%
                </span>
            </div>
        `).join('');
        
        // Add interactivity to trending cards
        document.querySelectorAll('.trending-card').forEach(card => {
            card.addEventListener('click', () => {
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    const symbol = card.getAttribute('data-symbol');
                    window.location.href = `/static/details.html?symbol=${symbol}`;
                }, 200);
            });
            
            // Hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'all 0.2s ease';
            });
        });
    } catch (error) {
        trendingList.innerHTML = `
            <div class="error-message">
                <p>Unable to load trends. Please try again later.</p>
                <button onclick="fetchTrendingStocks()">Retry</button>
            </div>
        `;
        console.error('Error fetching trending stocks:', error);
    }
}

function setupSearch() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    if (!searchBtn || !searchInput) return;
    
    // Click handler
    searchBtn.addEventListener('click', () => {
        handleSearch();
    });
    
    // Enter key handler
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Input animation
    searchInput.addEventListener('focus', () => {
        searchInput.parentElement.style.transform = 'scale(1.02)';
    });
    
    searchInput.addEventListener('blur', () => {
        searchInput.parentElement.style.transform = 'scale(1)';
    });
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const symbol = searchInput.value.trim().toUpperCase();
    
    if (!symbol) {
        showAlert('Please enter a valid stock symbol (e.g., AAPL, MSFT)');
        searchInput.focus();
        return;
    }
    
    // Add visual feedback
    const btn = document.getElementById('search-btn');
    btn.textContent = 'Searching...';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = `/static/details.html?symbol=${symbol}`;
    }, 500);
}

async function handleFormSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = {
        target_amount: form.querySelector('#target-amount').value,
        risk_tolerance: form.querySelector('#risk-tolerance').value,
        horizon: form.querySelector('#horizon').value
    };
    
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const message = document.getElementById('message');
    const suggestionsDiv = document.getElementById('suggestions');
    
    // Reset and show loading
    results.classList.add('hidden');
    loading.classList.remove('hidden');
    form.querySelector('button').disabled = true;
    
    try {
        const response = await fetch('http://localhost:5000/api/investments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        if (data.status === 'error') throw new Error(data.message);
        
        // Display results
        loading.classList.add('hidden');
        message.textContent = data.message;
        suggestionsDiv.innerHTML = data.suggestions.map(suggestion => `
            <div class="suggestion-card">
                <h3>${suggestion.symbol}</h3>
                <p>Price: $${suggestion.price.toFixed(2)}</p>
                <p>Suggested Shares: ${suggestion.suggested_shares}</p>
                <p>Volatility: ${suggestion.volatility}</p>
                <a href="/static/details.html?symbol=${suggestion.symbol}" class="details-btn">View Details</a>
            </div>
        `).join('');
        
        results.classList.remove('hidden');
        
        // Smooth scroll to results
        setTimeout(() => {
            results.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } catch (error) {
        loading.classList.add('hidden');
        message.textContent = `Error: ${error.message}`;
        results.classList.remove('hidden');
        console.error('Error fetching suggestions:', error);
    } finally {
        form.querySelector('button').disabled = false;
    }
}

function showAlert(message) {
    const alert = document.createElement('div');
    alert.className = 'custom-alert';
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(alert);
        }, 300);
    }, 3000);
}

// Add custom alert styles dynamically
const style = document.createElement('style');
style.textContent = `
    .custom-alert {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: #FFD700;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
        max-width: 80%;
        text-align: center;
    }
    .custom-alert.show {
        opacity: 1;
    }
`;
document.head.appendChild(style);