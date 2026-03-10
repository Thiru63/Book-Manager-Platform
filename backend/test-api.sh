#!/bin/bash
# Comprehensive API Test Script
BASE="http://localhost:5000"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅ PASS${NC}: $1"; }
fail() { echo -e "${RED}❌ FAIL${NC}: $1 - $2"; }

echo "============================================"
echo "  BookShelf API - Comprehensive Test Suite"
echo "============================================"
echo ""

# 1. Health Check
echo "--- 1. HEALTH CHECK ---"
RES=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
[ "$RES" = "200" ] && pass "GET /api/health => 200" || fail "GET /api/health" "Got $RES"

# 2. Signup (new user for testing)
echo ""
echo "--- 2. AUTH: SIGNUP ---"
SIGNUP=$(curl -s -w "\n%{http_code}" -c /tmp/cookies.txt "$BASE/api/auth/signup" \
  -H 'Content-Type: application/json' \
  -d '{"name":"API Test User","email":"apitest_'$RANDOM'@test.com","password":"TestPass123"}')
STATUS=$(echo "$SIGNUP" | tail -1)
BODY=$(echo "$SIGNUP" | head -1)
[ "$STATUS" = "201" ] && pass "POST /api/auth/signup => 201" || fail "POST /api/auth/signup" "Got $STATUS: $BODY"

# 3. Get Me (authenticated)
echo ""
echo "--- 3. AUTH: GET ME ---"
RES=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/cookies.txt "$BASE/api/auth/me")
[ "$RES" = "200" ] && pass "GET /api/auth/me => 200" || fail "GET /api/auth/me" "Got $RES"

# 4. Get Me (unauthenticated)
echo ""
echo "--- 4. AUTH: UNAUTHORIZED ---"
RES=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/me")
[ "$RES" = "401" ] && pass "GET /api/auth/me (no token) => 401" || fail "GET /api/auth/me (no token)" "Got $RES"

# 5. Login
echo ""
echo "--- 5. AUTH: LOGIN ---"
LOGIN=$(curl -s -w "\n%{http_code}" -c /tmp/cookies2.txt "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@bookshelf.com","password":"SecurePass123"}')
STATUS=$(echo "$LOGIN" | tail -1)
BODY=$(echo "$LOGIN" | head -1)
if [ "$STATUS" = "200" ]; then
  pass "POST /api/auth/login => 200"
  # Use this session for remaining tests
  cp /tmp/cookies2.txt /tmp/cookies.txt
else
  fail "POST /api/auth/login" "Got $STATUS: $BODY"
fi

# 6. Create Book
echo ""
echo "--- 6. BOOKS: CREATE ---"
CREATE=$(curl -s -w "\n%{http_code}" -b /tmp/cookies.txt "$BASE/api/books" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Atomic Habits","author":"James Clear","tags":["Self-improvement","Productivity","Self-actualization (psychology)"],"status":"reading","pageCount":322,"coverUrl":"https://covers.openlibrary.org/b/id/12539702-M.jpg","description":"A book about tiny changes and remarkable results","rating":5}')
STATUS=$(echo "$CREATE" | tail -1)
BODY=$(echo "$CREATE" | head -1)
if [ "$STATUS" = "201" ]; then
  pass "POST /api/books => 201 (with long tags!)"
  BOOK_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['book']['_id'])" 2>/dev/null)
  echo "     Created book ID: $BOOK_ID"
else
  fail "POST /api/books" "Got $STATUS: $BODY"
fi

# 7. Create another book
CREATE2=$(curl -s -w "\n%{http_code}" -b /tmp/cookies.txt "$BASE/api/books" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Deep Work","author":"Cal Newport","tags":["Productivity","Focus"],"status":"want_to_read","pageCount":296}')
STATUS2=$(echo "$CREATE2" | tail -1)
[ "$STATUS2" = "201" ] && pass "POST /api/books => 201 (Deep Work)" || fail "POST /api/books (Deep Work)" "Got $STATUS2"

# 8. Get All Books
echo ""
echo "--- 7. BOOKS: GET ALL ---"
GETALL=$(curl -s -w "\n%{http_code}" -b /tmp/cookies.txt "$BASE/api/books")
STATUS=$(echo "$GETALL" | tail -1)
BODY=$(echo "$GETALL" | head -1)
COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['pagination']['total'])" 2>/dev/null)
[ "$STATUS" = "200" ] && pass "GET /api/books => 200 (Total: $COUNT books)" || fail "GET /api/books" "Got $STATUS"

# 9. Get Books with Filter
echo ""
echo "--- 8. BOOKS: FILTER ---"
RES=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/cookies.txt "$BASE/api/books?status=reading")
[ "$RES" = "200" ] && pass "GET /api/books?status=reading => 200" || fail "GET /api/books?status=reading" "Got $RES"

RES=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/cookies.txt "$BASE/api/books?search=atomic")
[ "$RES" = "200" ] && pass "GET /api/books?search=atomic => 200" || fail "GET /api/books?search=atomic" "Got $RES"

# 10. Get Single Book
echo ""
echo "--- 9. BOOKS: GET BY ID ---"
if [ -n "$BOOK_ID" ]; then
  RES=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/cookies.txt "$BASE/api/books/$BOOK_ID")
  [ "$RES" = "200" ] && pass "GET /api/books/:id => 200" || fail "GET /api/books/:id" "Got $RES"
fi

# 11. Update Book
echo ""
echo "--- 10. BOOKS: UPDATE ---"
if [ -n "$BOOK_ID" ]; then
  UPD=$(curl -s -w "\n%{http_code}" -X PUT -b /tmp/cookies.txt "$BASE/api/books/$BOOK_ID" \
    -H 'Content-Type: application/json' \
    -d '{"currentPage":150,"rating":4}')
  STATUS=$(echo "$UPD" | tail -1)
  [ "$STATUS" = "200" ] && pass "PUT /api/books/:id => 200 (progress + rating)" || fail "PUT /api/books/:id" "Got $STATUS"
fi

# 12. Update Status to completed
if [ -n "$BOOK_ID" ]; then
  UPD=$(curl -s -w "\n%{http_code}" -X PUT -b /tmp/cookies.txt "$BASE/api/books/$BOOK_ID" \
    -H 'Content-Type: application/json' \
    -d '{"status":"completed"}')
  STATUS=$(echo "$UPD" | tail -1)
  BODY=$(echo "$UPD" | head -1)
  COMPLETED=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin)['book']; print('YES' if d.get('completedAt') else 'NO')" 2>/dev/null)
  [ "$STATUS" = "200" ] && pass "PUT /api/books/:id status=completed => 200 (completedAt set: $COMPLETED)" || fail "PUT status=completed" "Got $STATUS"
fi

# 13. Stats
echo ""
echo "--- 11. BOOKS: STATS ---"
STATS=$(curl -s -w "\n%{http_code}" -b /tmp/cookies.txt "$BASE/api/books/stats")
STATUS=$(echo "$STATS" | tail -1)
BODY=$(echo "$STATS" | head -1)
TOTAL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['stats']['totalBooks'])" 2>/dev/null)
[ "$STATUS" = "200" ] && pass "GET /api/books/stats => 200 (Total: $TOTAL)" || fail "GET /api/books/stats" "Got $STATUS"

# 14. Search
echo ""
echo "--- 12. BOOKS: SEARCH ---"
SEARCH=$(curl -s -w "\n%{http_code}" -b /tmp/cookies.txt "$BASE/api/books/search?q=harry+potter")
STATUS=$(echo "$SEARCH" | tail -1)
BODY=$(echo "$SEARCH" | head -1)
SCOUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['books']))" 2>/dev/null)
[ "$STATUS" = "200" ] && pass "GET /api/books/search?q=harry+potter => 200 ($SCOUNT results)" || fail "GET /api/books/search" "Got $STATUS"

# 15. Reading Goal
echo ""
echo "--- 13. USER: READING GOAL ---"
GOAL=$(curl -s -w "\n%{http_code}" -X PUT -b /tmp/cookies.txt "$BASE/api/user/reading-goal" \
  -H 'Content-Type: application/json' \
  -d '{"readingGoal":24}')
STATUS=$(echo "$GOAL" | tail -1)
[ "$STATUS" = "200" ] && pass "PUT /api/user/reading-goal => 200 (set to 24)" || fail "PUT /api/user/reading-goal" "Got $STATUS"

# 16. Refresh Token
echo ""
echo "--- 14. AUTH: REFRESH ---"
REFRESH=$(curl -s -w "\n%{http_code}" -X POST -b /tmp/cookies.txt -c /tmp/cookies.txt "$BASE/api/auth/refresh")
STATUS=$(echo "$REFRESH" | tail -1)
[ "$STATUS" = "200" ] && pass "POST /api/auth/refresh => 200" || fail "POST /api/auth/refresh" "Got $STATUS: $(echo "$REFRESH" | head -1)"

# 17. Delete Book
echo ""
echo "--- 15. BOOKS: DELETE ---"
if [ -n "$BOOK_ID" ]; then
  DEL=$(curl -s -w "\n%{http_code}" -X DELETE -b /tmp/cookies.txt "$BASE/api/books/$BOOK_ID")
  STATUS=$(echo "$DEL" | tail -1)
  [ "$STATUS" = "200" ] && pass "DELETE /api/books/:id => 200" || fail "DELETE /api/books/:id" "Got $STATUS"
fi

# 18. Logout
echo ""
echo "--- 16. AUTH: LOGOUT ---"
LOGOUT=$(curl -s -w "\n%{http_code}" -X POST -b /tmp/cookies.txt "$BASE/api/auth/logout")
STATUS=$(echo "$LOGOUT" | tail -1)
[ "$STATUS" = "200" ] && pass "POST /api/auth/logout => 200" || fail "POST /api/auth/logout" "Got $STATUS"

# Verify logged out
RES=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/cookies.txt "$BASE/api/auth/me")
[ "$RES" = "401" ] && pass "GET /api/auth/me after logout => 401" || fail "After logout" "Got $RES"

echo ""
echo "============================================"
echo "  All API Tests Complete!"
echo "============================================"

# Cleanup
rm -f /tmp/cookies.txt /tmp/cookies2.txt
