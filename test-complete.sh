#!/bin/bash
export AGENT_BROWSER_SESSION="coach-e2e-test"
SD="/Users/joe/irvine-all-stars/test-screenshots"
mkdir -p "$SD"

# Helper: click button by text (case-insensitive)
click_btn() {
  npx agent-browser eval "var b=Array.from(document.querySelectorAll('button')).find(function(x){return x.textContent.toLowerCase().indexOf('$1')>=0});b?(b.click(),'clicked $1'):'$1 not found'" 2>&1
}

echo "============================================"
echo "  COACH APPLICATION E2E TEST (FINAL)"
echo "============================================"

# Close any existing session
npx agent-browser close 2>&1 >/dev/null

echo ""
echo ">>> TEST 1: Navigate to /apply/coach"
npx agent-browser open "https://irvineallstars.com/apply/coach" 2>&1
sleep 3
URL=$(npx agent-browser get url 2>&1)
echo "URL: $URL"
if [[ "$URL" == *"/apply/coach"* ]]; then
  echo "RESULT: PASS"
else
  echo "RESULT: FAIL - redirected to $URL"
fi
npx agent-browser screenshot "$SD/01-landing.png" 2>&1
npx agent-browser snapshot -i 2>&1

echo ""
echo ">>> TEST 2: Fill Step 1 (Contact Info) + Next"
npx agent-browser fill 'input[id="full_name"]' "Test Coach Johnson" 2>&1
npx agent-browser fill 'input[id="email"]' "testcoach@example.com" 2>&1
npx agent-browser fill 'input[id="phone"]' "949-555-1234" 2>&1
npx agent-browser fill 'input[id="address"]' "123 Main St, Irvine CA 92620" 2>&1
npx agent-browser screenshot "$SD/02-step1-filled.png" 2>&1
click_btn "next"
sleep 2
npx agent-browser screenshot "$SD/03-step2.png" 2>&1
SNAP=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP" | head -15
if echo "$SNAP" | grep -q "EXPERIENCE"; then
  echo "RESULT: PASS - Step 2 reached"
else
  echo "RESULT: FAIL - Step 2 not reached"
fi

echo ""
echo ">>> TEST 3: Fill Step 2 (Experience) + Next"
npx agent-browser select 'select[id="current_division"]' "9U-Mustang" 2>&1
npx agent-browser fill 'input[id="years_experience"]' "5" 2>&1
npx agent-browser fill 'textarea[id="previous_allstar_experience"]' "Coached travel ball for 3 years" 2>&1
npx agent-browser screenshot "$SD/04-step2-filled.png" 2>&1
click_btn "next"
sleep 2
npx agent-browser screenshot "$SD/05-step3.png" 2>&1
SNAP=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP" | head -15
if echo "$SNAP" | grep -q "coaching_philosophy\|PHILOSOPHY"; then
  echo "RESULT: PASS - Step 3 reached"
else
  echo "RESULT: FAIL - Step 3 not reached"
fi

echo ""
echo ">>> TEST 4: Fill Step 3 (Philosophy) + Next"
npx agent-browser fill 'textarea[id="coaching_philosophy"]' "Player development first, winning second" 2>&1
npx agent-browser fill 'textarea[id="player_development_approach"]' "Focus on fundamentals and game awareness" 2>&1
npx agent-browser fill 'textarea[id="communication_style"]' "Open door policy with parents" 2>&1
npx agent-browser fill 'textarea[id="tournament_experience"]' "Managed teams in USSSA and PONY tournaments" 2>&1
npx agent-browser screenshot "$SD/06-step3-filled.png" 2>&1
click_btn "next"
sleep 2
npx agent-browser screenshot "$SD/07-step4.png" 2>&1
SNAP=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP" | head -25
if echo "$SNAP" | grep -q "consent_background_check\|COMPLIANCE"; then
  echo "RESULT: PASS - Step 4 reached"
else
  echo "RESULT: FAIL - Step 4 not reached"
fi

echo ""
echo ">>> TEST 5: Fill Step 4 (Compliance) + Submit"
npx agent-browser check 'input[id="consent_background_check"]' 2>&1
npx agent-browser check 'input[id="consent_safety_certs"]' 2>&1
npx agent-browser check 'input[id="agree_pony_rules"]' 2>&1
npx agent-browser check 'input[id="agree_ipb_policies"]' 2>&1
npx agent-browser check 'input[id="commit_full_season"]' 2>&1
npx agent-browser fill 'textarea[id="why_manage"]' "I want to give back to the community" 2>&1
npx agent-browser fill 'textarea[id="unique_qualities"]' "Strong communication and organizational skills" 2>&1
npx agent-browser fill 'textarea[id="additional_comments"]' "Available for all practices and games" 2>&1
npx agent-browser screenshot "$SD/08-step4-filled.png" 2>&1
click_btn "submit"
sleep 6

echo ""
echo ">>> TEST 6: Verify submission result"
URL=$(npx agent-browser get url 2>&1)
echo "URL: $URL"
npx agent-browser screenshot "$SD/09-submission-result.png" 2>&1
SNAP=$(npx agent-browser snapshot -c 2>&1)
echo "$SNAP"
if echo "$SNAP" | grep -qi "submitted\|received\|thank"; then
  echo "RESULT: PASS - Success message shown"
else
  echo "RESULT: FAIL - No success message"
fi
echo "--- Errors ---"
npx agent-browser errors 2>&1
echo "--- Console ---"
npx agent-browser console 2>&1

npx agent-browser close 2>&1

echo ""
echo ">>> TEST 7: Admin verification"
export AGENT_BROWSER_SESSION="admin-verify"
npx agent-browser open "https://irvineallstars.com/auth/login" 2>&1
sleep 3
npx agent-browser fill 'input[id="email"]' "allstars@irvinepony.com" 2>&1
npx agent-browser fill 'input[id="password"]' "Refreeze8!Decorated!Tuition" 2>&1
click_btn "sign in"
sleep 5
URL=$(npx agent-browser get url 2>&1)
echo "After login: $URL"
npx agent-browser screenshot "$SD/10-admin-dashboard.png" 2>&1

npx agent-browser open "https://irvineallstars.com/admin/applications" 2>&1
sleep 3
npx agent-browser screenshot "$SD/11-admin-applications.png" 2>&1
SNAP=$(npx agent-browser snapshot -c 2>&1)
echo "$SNAP"
if echo "$SNAP" | grep -qi "Test Coach Johnson"; then
  echo "RESULT: PASS - Test submission visible in admin"
else
  echo "RESULT: FAIL - Test submission NOT visible in admin"
fi

npx agent-browser close 2>&1

echo ""
echo "============================================"
echo "  ALL TESTS COMPLETE"
echo "============================================"
