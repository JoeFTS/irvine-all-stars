#!/bin/bash
SD="/Users/joe/irvine-all-stars/test-screenshots"
mkdir -p "$SD"

click_next() {
  npx agent-browser eval "var btns = document.querySelectorAll('button'); var btn = Array.from(btns).find(function(b) { return b.textContent.includes('NEXT') || b.textContent.includes('Next'); }); btn ? (btn.click(), 'clicked next') : 'next not found'" 2>&1
}

click_submit() {
  npx agent-browser eval "var btns = document.querySelectorAll('button'); var btn = Array.from(btns).find(function(b) { return b.textContent.includes('Submit') || b.textContent.includes('SUBMIT'); }); btn ? (btn.click(), 'clicked submit') : 'submit not found'" 2>&1
}

echo "============================================"
echo "  COACH APPLICATION END-TO-END TEST"
echo "============================================"
echo ""

echo ">>> TEST 1: Navigate to coach application"
npx agent-browser open "https://irvineallstars.com/apply/coach" 2>&1
sleep 2
URL=$(npx agent-browser get url 2>&1)
echo "URL: $URL"
npx agent-browser screenshot "$SD/T1-landing.png" 2>&1
echo "RESULT: $(if [[ "$URL" == *"/apply/coach"* ]]; then echo 'PASS'; else echo 'FAIL'; fi)"
npx agent-browser snapshot -i 2>&1

echo ""
echo ">>> TEST 2: Fill Step 1 (Contact Info)"
npx agent-browser fill 'input[id="full_name"]' "Test Coach Johnson" 2>&1
npx agent-browser fill 'input[id="email"]' "testcoach@example.com" 2>&1
npx agent-browser fill 'input[id="phone"]' "949-555-1234" 2>&1
npx agent-browser fill 'input[id="address"]' "123 Main St, Irvine CA 92620" 2>&1
npx agent-browser screenshot "$SD/T2-step1-filled.png" 2>&1

echo "Clicking Next..."
click_next
sleep 2
npx agent-browser screenshot "$SD/T2-step2-arrived.png" 2>&1
SNAP=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP" | head -20
echo "RESULT: $(echo "$SNAP" | grep -q 'EXPERIENCE' && echo 'PASS - on Step 2' || echo 'FAIL - not on Step 2')"

echo ""
echo ">>> TEST 3: Fill Step 2 (Experience)"
# Select division using the select element
npx agent-browser select 'select[id="current_division"]' "9U-Mustang" 2>&1
npx agent-browser fill 'input[id="years_experience"]' "5" 2>&1
npx agent-browser fill 'textarea[id="previous_allstar_experience"]' "Coached travel ball for 3 years" 2>&1
npx agent-browser screenshot "$SD/T3-step2-filled.png" 2>&1

echo "Clicking Next..."
click_next
sleep 2
npx agent-browser screenshot "$SD/T3-step3-arrived.png" 2>&1
SNAP=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP" | head -15
echo "RESULT: $(echo "$SNAP" | grep -q 'PHILOSOPHY' && echo 'PASS - on Step 3' || echo 'FAIL - not on Step 3')"

echo ""
echo ">>> TEST 4: Fill Step 3 (Philosophy)"
npx agent-browser fill 'textarea[id="coaching_philosophy"]' "Player development first, winning second" 2>&1
npx agent-browser fill 'textarea[id="player_development_approach"]' "Focus on fundamentals and game awareness" 2>&1
npx agent-browser fill 'textarea[id="communication_style"]' "Open door policy with parents" 2>&1
npx agent-browser fill 'textarea[id="tournament_experience"]' "Managed teams in USSSA and PONY tournaments" 2>&1
npx agent-browser screenshot "$SD/T4-step3-filled.png" 2>&1

echo "Clicking Next..."
click_next
sleep 2
npx agent-browser screenshot "$SD/T4-step4-arrived.png" 2>&1
SNAP=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP" | head -25
echo "RESULT: $(echo "$SNAP" | grep -q 'COMPLIANCE\|consent\|checkbox' && echo 'PASS - on Step 4' || echo 'FAIL - not on Step 4')"

echo ""
echo ">>> TEST 5: Fill Step 4 (Compliance & Submit)"
npx agent-browser check 'input[id="consent_background_check"]' 2>&1
npx agent-browser check 'input[id="consent_safety_certs"]' 2>&1
npx agent-browser check 'input[id="agree_pony_rules"]' 2>&1
npx agent-browser check 'input[id="agree_ipb_policies"]' 2>&1
npx agent-browser check 'input[id="commit_full_season"]' 2>&1
npx agent-browser fill 'textarea[id="why_manage"]' "I want to give back to the community" 2>&1
npx agent-browser fill 'textarea[id="unique_qualities"]' "Strong communication and organizational skills" 2>&1
npx agent-browser fill 'textarea[id="additional_comments"]' "Available for all practices and games" 2>&1
npx agent-browser screenshot "$SD/T5-step4-filled.png" 2>&1

echo "Clicking Submit..."
click_submit
sleep 5
npx agent-browser screenshot "$SD/T5-submitted.png" 2>&1

echo ""
echo ">>> TEST 6: Verify submission"
URL=$(npx agent-browser get url 2>&1)
echo "URL: $URL"
SNAP=$(npx agent-browser snapshot -c 2>&1)
echo "$SNAP"
echo "RESULT: $(echo "$SNAP" | grep -qi 'submitted\|thank\|success\|received' && echo 'PASS - Success message shown' || echo 'FAIL or PENDING - Check screenshot')"

echo "--- Console logs ---"
npx agent-browser console 2>&1
echo "--- Errors ---"
npx agent-browser errors 2>&1

echo ""
echo ">>> TEST 7: Admin verification"
npx agent-browser open "https://irvineallstars.com/auth/login" 2>&1
sleep 2
npx agent-browser snapshot -i 2>&1

npx agent-browser fill 'input[id="email"]' "allstars@irvinepony.com" 2>&1
npx agent-browser fill 'input[id="password"]' "Refreeze8!Decorated!Tuition" 2>&1
npx agent-browser screenshot "$SD/T7-login-filled.png" 2>&1

# Click sign in via eval
npx agent-browser eval "var btns = document.querySelectorAll('button'); var btn = Array.from(btns).find(function(b) { return b.textContent.includes('SIGN IN') || b.textContent.includes('Sign In'); }); btn ? (btn.click(), 'clicked sign in') : 'sign in not found'" 2>&1
sleep 5
URL=$(npx agent-browser get url 2>&1)
echo "URL after login: $URL"
npx agent-browser screenshot "$SD/T7-post-login.png" 2>&1

if [[ "$URL" == *"login"* ]]; then
  echo "Login may have failed - checking for errors"
  npx agent-browser snapshot -c 2>&1
fi

npx agent-browser open "https://irvineallstars.com/admin/applications" 2>&1
sleep 3
URL=$(npx agent-browser get url 2>&1)
echo "Admin apps URL: $URL"
npx agent-browser screenshot "$SD/T7-admin-apps.png" 2>&1
SNAP=$(npx agent-browser snapshot -c 2>&1)
echo "$SNAP"
echo "RESULT: $(echo "$SNAP" | grep -qi 'Test Coach Johnson' && echo 'PASS - Test submission found in admin' || echo 'FAIL or NOT FOUND - Test submission not visible')"

echo ""
echo "============================================"
echo "  ALL TESTS COMPLETE"
echo "============================================"
