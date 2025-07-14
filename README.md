# Arduino LLM Agent
```llm-arduino-mcp```

> An intelligent backend server that uses Large Language Models (LLMs) to generate, compile, and upload Arduino, ESP8266, and ESP32 firmware automatically — powered by Ollama and Arduino CLI.


**LLM + Arduino Machine Code Pipeline**

Generate, compile, and upload Arduino sketches automatically using natural language prompts and local Ollama LLM models.

## Features
- Multiple board support (Arduino Uno, ESP8266, ESP32)
- Local LLM for private codegen (no OpenAI cloud keys needed)
- Automated compile & upload using Arduino CLI
- Flexible backend API for integration with web UI

## Quick Start
1. Install and run Ollama (`ollama serve`)
   - ```ollama run llama3.2```
2. Install and configure `arduino-cli`
3. Clone this repo and `npm run start` (or `bun run` version)
4. Send POST request with your prompt:
   ```bash
   curl -X POST http://localhost:3000/generate-arduino \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Write Arduino code to blink LED on pin 2 using ESP32."}'


## Prerequisites

- Install arduino-cli
  - Refer: https://arduino.github.io/arduino-cli/1.2/
  - Add arduino-cli to the system path
- Ensure Ollama is setup on your machine
  - Refer: https://ollama.com/download

```bash
curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh
```
Or download a copy of the Arduino CLI, place it in a directory of your choice, and make sure to add it to your system’s PATH according to your operating system.

## To install dependencies:

```bash
bun install
```

## Update the server.js

- Update Ollama model as per your Ollama setup
  - Tested with llama3.2:latest
- Update Port for you board
```typescript
const OLLAMA_URL = 'http://localhost:11434/api/chat'; // Change if your Ollama server is running on a different port
const SERIAL_PORT = 'COM5';        // Change as per your board
const OLLAMA_MODEL = 'llama3.2:latest'; // Change as per your Ollama setup
```

## To run:

```bash
bun run start
```

# Usage
- Make sure the Arduino Board is attached to the com port
- Run following from the terminal

```bash
curl --location 'http://localhost:3000/generate-arduino' \
--header 'Content-Type: application/json' \
--data '{
    "prompt": "Write Arduino code for ESP8266 board to blink an LED on pin LED_BUILTIN every 3 seconds. Do not include any libraries."
}'

```
