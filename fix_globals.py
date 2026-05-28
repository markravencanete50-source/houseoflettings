content = "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --navy: #0a1f44;\n  --navy-light: #1a3a6b;\n  --gold: #c9a84c;\n  --charcoal: #0d0d0d;\n  --bg: #ffffff;\n  --bg-alt: #f7f8fa;\n  --text: #0a1f44;\n  --text-muted: #6b7280;\n  --border: #e5e7eb;\n}\n\n* { box-sizing: border-box; margin: 0; padding: 0; }\n\nhtml { scroll-behavior: smooth; }\n\nbody {\n  font-family: system-ui, -apple-system, sans-serif;\n  background-color: var(--bg);\n  color: var(--text);\n  line-height: 1.6;\n}\n\na { color: inherit; text-decoration: none; }\nimg { max-width: 100%; height: auto; display: block; }\n"

with open("app/globals.css", "w", newline="\n") as f:
    f.write(content)

print("globals.css written successfully!")
