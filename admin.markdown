---
layout: page
title: Links
permalink: /admin/
---

<html>
<head>
<title>Admin - News Panel</title>
</head>

<body>

<!-- Admin Section (hidden unless password entered) -->
        <section class="section" style="max-width: 600px; margin-left: auto; margin-right: auto;">
            <div class="interactive-section">
                <h3 style="margin-bottom: 1.5rem; text-align: center;">Admin Panel</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <input type="password" id="password" placeholder="Admin Password" 
                           style="padding: 0.75rem; background: var(--secondary); border: 1px solid var(--border); 
                                  border-radius: 6px; color: var(--text); font-size: 1rem;">
                    <input type="text" id="subject" placeholder="Subject" 
                           style="padding: 0.75rem; background: var(--secondary); border: 1px solid var(--border); 
                                  border-radius: 6px; color: var(--text); font-size: 1rem;">
                    <textarea id="message" placeholder="Message" rows="4"
                              style="padding: 0.75rem; background: var(--secondary); border: 1px solid var(--border); 
                                     border-radius: 6px; color: var(--text); font-size: 1rem; resize: vertical;"></textarea>
                    <button onclick="postNews()" class="btn btn-primary" style="width: 100%;">Post</button>
                </div>
            </div>
        </section>
        <script src="/script.js"></script>
        </body>
        </html>
