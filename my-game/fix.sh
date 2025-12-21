#!/bin/bash

echo "🔧 Downgrading to Tailwind v3 (Stable)..."

# 1. Force install specific versions that work together
# We explicitly install tailwindcss version 3.4.17 to avoid the v4 error
npm install -D tailwindcss@3.4.17 postcss autoprefixer

# 2. Force-create the PostCSS config (Standard v3 config)
cat > postcss.config.js <<EOF
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# 3. Ensure the CSS file uses v3 syntax (Directives)
cat > src/index.css <<EOF
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}
EOF

# 4. Re-write the Main Entry point (Just to be safe)
cat > src/main.jsx <<EOF
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

echo "✅ Downgrade Complete!"
echo "👉 Run 'npm run dev' to start the game."