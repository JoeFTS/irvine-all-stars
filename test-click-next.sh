#!/bin/bash
# Minimal test: can we click the Next button?

SD="/Users/joe/irvine-all-stars/test-screenshots"

npx agent-browser open "https://irvineallstars.com/apply/coach" 2>&1
sleep 2

# Fill required fields first
npx agent-browser fill 'input[id="full_name"]' "Test Coach Johnson" 2>&1
npx agent-browser fill 'input[id="email"]' "testcoach@example.com" 2>&1
npx agent-browser fill 'input[id="phone"]' "949-555-1234" 2>&1

# Try clicking Next using various methods
echo ""
echo "=== Attempt 1: scrollintoview then click button element ==="
npx agent-browser scrollintoview 'button' 2>&1
npx agent-browser click 'button' 2>&1
sleep 2
SNAP=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP" | head -20

echo ""
echo "=== Check URL ==="
echo "URL: $(npx agent-browser get url 2>&1)"

# If still on step 1, try finding the button via snapshot and clicking immediately
echo ""
echo "=== Attempt 2: snapshot then immediate click ==="
npx agent-browser snapshot -i 2>&1 | head -20
npx agent-browser click @e12 2>&1
sleep 1
echo "URL: $(npx agent-browser get url 2>&1)"
npx agent-browser snapshot -i 2>&1 | head -10

echo ""
echo "=== Attempt 3: eval-based click ==="
npx agent-browser eval "document.querySelector('button').textContent" 2>&1
npx agent-browser eval "document.querySelector('button').click()" 2>&1
sleep 2
echo "URL: $(npx agent-browser get url 2>&1)"
npx agent-browser snapshot -i 2>&1 | head -10

npx agent-browser screenshot "$SD/click-test.png" 2>&1
