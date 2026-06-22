#!/bin/bash
# Deploy script for Ruff Cuts

cd "/Users/paolosarmiento/Documents/Ruff Cuts/RUFF APP"

echo "🚀 Deploying to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Pushed to GitHub successfully!"
    echo "⏳ Netlify will auto-deploy in 2-3 minutes"
    echo "🌐 App URL: https://ruffcuts.app"
else
    echo "❌ Push failed. You may need to authenticate."
    echo ""
    echo "To create a GitHub token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Check 'repo' scope"
    echo "4. Use the token as your password when prompted"
fi
