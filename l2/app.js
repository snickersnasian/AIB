let reviews = [];

async function loadReviews() {
    const response = await fetch('reviews_test.tsv');
    const text = await response.text();
    return new Promise((resolve) => {
        Papa.parse(text, {
            header: true,
            delimiter: '\t',
            complete: (result) => resolve(result.data)
        });
    });
}

async function callApi(prompt, text, modelUrl) {
    const token = document.getElementById('token').value;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const spinner = document.getElementById('spinner');
    const errorDiv = document.getElementById('error');
    spinner.style.display = 'block';
    errorDiv.style.display = 'none';

    try {
        const response = await fetch(modelUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ inputs: `${prompt}${text}` })
        });

        if (response.status === 402 || response.status === 429) {
            throw new Error('API rate limit exceeded or invalid token.');
        }

        if (!response.ok) {
            throw new Error('API request failed.');
        }

        const data = await response.json();
        return data[0][0].label.toLowerCase();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        return null;
    } finally {
        spinner.style.display = 'none';
    }
}

function selectRandomReview() {
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    resultDiv.style.display = 'none';
    errorDiv.style.display = 'none';

    if (reviews.length === 0) {
        errorDiv.textContent = 'No reviews loaded.';
        errorDiv.style.display = 'block';
        return;
    }

    const review = reviews[Math.floor(Math.random() * reviews.length)];
    resultDiv.innerHTML = `<p><strong>Review:</strong> ${review.text}</p>`;
    resultDiv.dataset.text = review.text;
    resultDiv.style.display = 'block';
}

async function analyzeSentiment() {
    const resultDiv = document.getElementById('result');
    if (!resultDiv.dataset.text) return;

    const sentiment = await callApi('Classify this review as positive, negative, or neutral: ', resultDiv.dataset.text, 'https://api-inference.huggingface.co/models/siebert/sentiment-roberta-large-english');
    if (sentiment) {
        const icon = sentiment === 'positive' ? '👍' : sentiment === 'negative' ? '👎' : '❓';
        resultDiv.innerHTML = `<p><strong>Review:</strong> ${resultDiv.dataset.text}</p><p><strong>Sentiment:</strong> ${icon}</p>`;
        resultDiv.style.display = 'block';
    }
}

async function countNouns() {
    const resultDiv = document.getElementById('result');
    if (!resultDiv.dataset.text) return;

    const nounLevel = await callApi('Count the nouns in this review and return only High (>15), Medium (6-15), or Low (<6): ', resultDiv.dataset.text, 'https://api-inference.huggingface.co/models/bert-base-uncased');
    if (nounLevel) {
        const icon = nounLevel === 'high' ? '🟢' : nounLevel === 'medium' ? '🟡' : '🔴';
        resultDiv.innerHTML = `<p><strong>Review:</strong> ${resultDiv.dataset.text}</p><p><strong>Noun Count:</strong> ${icon} (${nounLevel})</p>`;
        resultDiv.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    reviews = await loadReviews();
});
