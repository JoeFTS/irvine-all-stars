#!/bin/bash
SD="/Users/joe/irvine-all-stars/test-screenshots"
mkdir -p "$SD"

# Use a fresh session to avoid auth state leakage
export AGENT_BROWSER_SESSION="coach-test-$(date +%s)"

echo "============================================"
echo "  CLEAN COACH APPLICATION E2E TEST"
echo "  Session: $AGENT_BROWSER_SESSION"
echo "============================================"

echo ""
echo ">>> TEST 1: Navigate to coach application"
npx agent-browser open "https://irvineallstars.com/apply/coach" 2>&1
sleep 3
URL=$(npx agent-browser get url 2>&1)
echo "URL: $URL"
npx agent-browser screenshot "$SD/F1-landing.png" 2>&1
npx agent-browser snapshot -i 2>&1

echo ""
echo ">>> TEST 2: Fill Step 1"
npx agent-browser fill 'input[id="full_name"]' "Test Coach Johnson" 2>&1
npx agent-browser fill 'input[id="email"]' "testcoach@example.com" 2>&1
npx agent-browser fill 'input[id="phone"]' "949-555-1234" 2>&1
npx agent-browser fill 'input[id="address"]' "123 Main St, Irvine CA 92620" 2>&1
npx agent-browser screenshot "$SD/F2-step1-filled.png" 2>&1

# Click Next via eval
npx agent-browser eval "var btns=document.querySelectorAll('button');var b=Array.from(btns).find(function(x){return x.textContent.includes('NEXT')});b?(b.click(),'ok'):'nf'" 2>&1
sleep 2
URL=$(npx agent-browser get url 2>&1)
echo "After Next: URL=$URL"
npx agent-browser screenshot "$SD/F3-step2.png" 2>&1
SNAP=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP"

echo ""
echo ">>> TEST 3: Fill Step 2"
npx agent-browser select 'select[id="current_division"]' "9U-Mustang" 2>&1
npx agent-browser fill 'input[id="years_experience"]' "5" 2>&1
npx agent-browser fill 'textarea[id="previous_allstar_experience"]' "Coached travel ball for 3 years" 2>&1
npx agent-browser screenshot "$SD/F4-step2-filled.png" 2>&1

npx agent-browser eval "var btns=document.querySelectorAll('button');var b=Array.from(btns).find(function(x){return x.textContent.includes('NEXT')});b?(b.click(),'ok'):'nf'" 2>&1
sleep 2
npx agent-browser screenshot "$SD/F5-step3.png" 2>&1
SNAP=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP" | head -20

echo ""
echo ">>> TEST 4: Fill Step 3"
npx agent-browser fill 'textarea[id="coaching_philosophy"]' "Player development first, winning second" 2>&1
npx agent-browser fill 'textarea[id="player_development_approach"]' "Focus on fundamentals and game awareness" 2>&1
npx agent-browser fill 'textarea[id="communication_style"]' "Open door policy with parents" 2>&1
npx agent-browser fill 'textarea[id="tournament_experience"]' "Managed teams in USSSA and PONY tournaments" 2>&1
npx agent-browser screenshot "$SD/F6-step3-filled.png" 2>&1

npx agent-browser eval "var btns=document.querySelectorAll('button');var b=Array.from(btns).find(function(x){return x.textContent.includes('NEXT')});b?(b.click(),'ok'):'nf'" 2>&1
sleep 2
npx agent-browser screenshot "$SD/F7-step4.png" 2>&1
SNAP=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP"

echo ""
echo ">>> TEST 5: Fill Step 4 & Submit"
npx agent-browser check 'input[id="consent_background_check"]' 2>&1
npx agent-browser check 'input[id="consent_safety_certs"]' 2>&1
npx agent-browser check 'input[id="agree_pony_rules"]' 2>&1
npx agent-browser check 'input[id="agree_ipb_policies"]' 2>&1
npx agent-browser check 'input[id="commit_full_season"]' 2>&1
npx agent-browser fill 'textarea[id="why_manage"]' "I want to give back to the community" 2>&1
npx agent-browser fill 'textarea[id="unique_qualities"]' "Strong communication and organizational skills" 2>&1
npx agent-browser fill 'textarea[id="additional_comments"]' "Available for all practices and games" 2>&1
npx agent-browser screenshot "$SD/F8-step4-filled.png" 2>&1

# Submit
npx agent-browser eval "var btns=document.querySelectorAll('button');var b=Array.from(btns).find(function(x){return x.textContent.includes('Submit')});b?(b.click(),'ok'):'nf'" 2>&1
sleep 6

echo ""
echo ">>> TEST 6: Verify submission"
URL=$(npx agent-browser get url 2>&1)
echo "URL: $URL"
npx agent-browser screenshot "$SD/F9-result.png" 2>&1
npx agent-browser snapshot -c 2>&1
echo "--- Errors ---"
npx agent-browser errors 2>&1
echo "--- Console ---"
npx agent-browser console 2>&1

# Close this session
npx agent-browser close 2>&1

echo ""
echo ">>> TEST 7: Admin verification (new session)"
export AGENT_BROWSER_SESSION="admin-test-$(date +%s)"
npx agent-browser open "https://irvineallstars.com/auth/login" 2>&1
sleep 2
npx agent-browser fill 'input[id="email"]' "allstars@irvinepony.com" 2>&1
npx agent-browser fill 'input[id="password"]' "Refreeze8!Decorated!Tuition" 2>&1
npx agent-browser eval "var btns=document.querySelectorAll('button');var b=Array.from(btns).find(function(x){return x.textContent.includes('SIGN IN')});b?(b.click(),'ok'):'nf'" 2>&1
sleep 5
URL=$(npx agent-browser get url 2>&1)
echo "After login: $URL"
npx agent-browser screenshot "$SD/F10-post-login.png" 2>&1

npx agent-browser open "https://irvineallstars.com/admin/applications" 2>&1
sleep 3
npx agent-browser screenshot "$SD/F11-admin-apps.png" 2>&1
npx agent-browser snapshot -c 2>&1

npx agent-browser close 2>&1

echo ""
echo "============================================"
echo "  DONE"
echo "============================================"
