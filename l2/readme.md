Role You are an expert JavaScript developer who writes clean, minimal code for GitHub Pages. Follow every requirement exactly—no extra libraries, comments, or text.

Context • Static site only (index.html + app.js)• Data file: reviews_test.tsv (has a text column)• Papa Parse via CDN must load & parse TSV.• One mandatory input field for Hugging Face API token.• Use fetch for API calls with the latest Hugging Face format (POST to https://api-inference.huggingface.co/models/siebert/sentiment-roberta-large-english, body: { "inputs": reviewText }, optional Authorization header).
• UI buttons

For noun counting use hf model: vblagoje/bert-english-uncased-finetuned-pos

Select Random Review → show random review text.
Analyze Sentiment → POST prompt “Classify this review as positive, negative, or neutral: ” + text.
Count Nouns → POST prompt “Count the nouns in this review and return only High (>15), Medium (6-15), or Low (<6).” + text.
• Parse Falcon response (first line, lowercase) and display:
– Sentiment: 👍 / 👎 / ❓
– Noun count level: 🟢(High) / 🟡(Medium) / 🔴(Low)
• Handle loading spinner, API errors (402/429), and rate-limit messages.
• All logic in vanilla JS (fetch, async/await).
• No server-side code.
Samples from reviews_test.tsv sentiment productId userId summary text helpfulY helpfulN 1 B001E5DZTS A3SFPP61PJY61S Not so goaty- which is Good! Wonderful product! I began to use it for my daughter who was about to turn a year old. She took it with no problems! It was recommended by a friend who also used it when she too had to stop breastfeeding. Much better for a child in my eyes. I had tried a formula sample I had received in the mail- it left a greasy film in the bottle... gross. This does not! My daughter will drink it warm or cold- so easy for on the go as well. The canned was a bit harsh and she wasn't into it.. it tastes like a goat smells- this just has a suttle hint of goat. LoL 0 0 1 B002JX7GVM A3KNE6IZQU0MJV O.N.E. Coconut Water! I got the O.N.E. Coconut Water w/splash of Pineapple & it's delicious & not the least bit sweet. Just very refreshing!! LOVE IT and will continue using it. Saw this on Dr. Oz as he recommended it. 1 0

Instruction Generate the complete code for “Review Analyzer”:

index.html
– Responsive UI with minimal CSS.
– Token input, three buttons, result card, error div, spinner.
– Link Font Awesome 6.4 CDN and Papa Parse 5.4.1 CDN.
app.js
– TSV fetch + Papa Parse → reviews array.
– Event handlers for each button.
– Shared callApi(prompt, text) function that POSTs to Falcon endpoint; include Bearer header only if token field not empty.
– Sentiment logic: ???? – Noun-level logic: ???? – Graceful error handling & UI reset.
Output Format

A single code block containing the full index.html.
A single code block containing the full app.js.
No prose, no explanations, no extra files.