#!/bin/bash
SD="/Users/joe/irvine-all-stars/test-screenshots"

npx agent-browser open "https://irvineallstars.com/apply/coach" 2>&1
sleep 2

# Fill required fields
npx agent-browser fill 'input[id="full_name"]' "Test Coach Johnson" 2>&1
npx agent-browser fill 'input[id="email"]' "testcoach@example.com" 2>&1
npx agent-browser fill 'input[id="phone"]' "949-555-1234" 2>&1
npx agent-browser fill 'input[id="address"]' "123 Main St, Irvine CA 92620" 2>&1

echo "=== Pre-click snapshot ==="
npx agent-browser snapshot -i 2>&1

echo ""
echo "=== Try eval-based button click ==="
npx agent-browser eval "var btns = document.querySelectorAll('button'); var nextBtn = Array.from(btns).find(b => b.textContent.includes('Next') || b.textContent.includes('NEXT')); nextBtn ? (nextBtn.click(), 'clicked') : 'not found'" 2>&1
sleep 2

echo ""
echo "=== Post-click check ==="
echo "URL: $(npx agent-browser get url 2>&1)"
npx agent-browser snapshot -i 2>&1 | head -15
npx agent-browser screenshot "$SD/step2-after-click.png" 2>&1
