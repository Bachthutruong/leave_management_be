#!/bin/bash

echo "Testing employee creation API..."

# Test 1: Create employee without email
echo "Test 1: Creating employee without email"
curl -X POST http://localhost:5002/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjA3ZjVkYmU1YzJlMjY0ZGQ3YmQ0MSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY0MzgxMTEsImV4cCI6MTc1NjUyNDUxMX0.yVAyIWRglNFjK2j33cXygNXsfpaderpSBM47hnVzXv0" \
  -d '{"phone":"090123456713","name":"Test User","department":"Test Dept","licensePlate":"TEST123","status":"active"}' \
  -s | jq '.'

echo -e "\n---\n"

# Test 2: Create employee with email
echo "Test 2: Creating employee with email"
curl -X POST http://localhost:5002/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjA3ZjVkYmU1YzJlMjY0ZGQ3YmQ0MSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY0MzgxMTEsImV4cCI6MTc1NjUyNDUxMX0.yVAyIWRglNFjK2j33cXygNXsfpaderpSBM47hnVzXv0" \
  -d '{"phone":"090123456714","name":"Test User 2","department":"Test Dept 2","licensePlate":"TEST456","email":"test@example.com","status":"active"}' \
  -s | jq '.'

echo -e "\n---\n"

# Test 3: Get all employees
echo "Test 3: Getting all employees"
curl -X GET http://localhost:5002/api/employees \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjA3ZjVkYmU1YzJlMjY0ZGQ3YmQ0MSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY0MzgxMTEsImV4cCI6MTc1NjUyNDUxMX0.yVAyIWRglNFjK2j33cXygNXsfpaderpSBM47hnVzXv0" \
  -s | jq '.'
