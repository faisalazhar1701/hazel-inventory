#!/bin/bash
BASE_URL="http://localhost:3000"
echo "Testing Backend APIs..."
echo ""

# Core APIs
echo "1. Testing /products..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/products" || echo "Failed: Connection refused (backend not running)"
echo ""

echo "2. Testing /customers..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/customers" || echo "Failed: Connection refused"
echo ""

echo "3. Testing /orders..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/orders" || echo "Failed: Connection refused"
echo ""

echo "4. Testing /warehouses..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/warehouses" || echo "Failed: Connection refused"
echo ""

echo "5. Testing /inventory/stock-movements..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/inventory/stock-movements" || echo "Failed: Connection refused"
echo ""

echo "6. Testing /forecast..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/forecast" || echo "Failed: Connection refused"
echo ""

echo "7. Testing /replenishment-suggestions..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/replenishment-suggestions" || echo "Failed: Connection refused"
echo ""

echo "8. Testing /finance/transactions..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/finance/transactions" || echo "Failed: Connection refused"
echo ""

echo "9. Testing /finance/inventory-valuation..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/finance/inventory-valuation" || echo "Failed: Connection refused"
echo ""

echo "Testing complete."
