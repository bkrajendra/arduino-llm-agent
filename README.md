# Arduino LLM Agent

## Prerequisites

- Install arduino-cli
  - Refer: https://arduino.github.io/arduino-cli/1.2/
  - Add arduino-cli to the system path
- Ensure Ollama is setup on your machine
  - Refer: https://ollama.com/download

```bash
curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh
```
Or download and copy arduino-cli to a directory and make sure to add it to path based on your OS


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
