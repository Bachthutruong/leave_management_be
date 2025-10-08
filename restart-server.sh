#!/bin/bash

echo "Stopping server..."
pkill -f "ts-node src/index.ts" || echo "No server process found"

echo "Waiting 2 seconds..."
sleep 2

echo "Starting server..."
npm run dev &
echo "Server started in background"

echo "Waiting for server to be ready..."
sleep 5

echo "Testing server health..."
curl -s http://localhost:5002/api/health | jq '.' || echo "Server not ready yet"



