#!/bin/bash

# Wait for Ollama to be ready
echo "Waiting for Ollama service..."
until curl -s -f http://localhost:11434/api/tags >/dev/null 2>&1; do
    sleep 2
done

echo "Ollama service is ready. Pulling llama3.2 model..."
ollama pull llama3.2

echo "Creating Mario model..."
ollama create mario -f /root/Modelfile

echo "Mario model setup complete!"
