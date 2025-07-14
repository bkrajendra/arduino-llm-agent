const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const MCP = require('./contextManager');

const app = express();
app.use(bodyParser.json());


const OLLAMA_URL = 'http://localhost:11434/api/chat'; // Change if your Ollama server is running on a different port
const SERIAL_PORT = 'COM5';        // Change as per your board
const OLLAMA_MODEL = 'llama3.2:latest'; // Change as per your Ollama setup

const SYSTEM_PROMPT = `
You are an expert Arduino programmer.
Generate only valid Arduino code inside **one** markdown code block.
Also, at the end of your response, print the board FQBN on a separate line starting with "BOARD:".
Examples: BOARD: esp8266:esp8266:nodemcuv2, BOARD: esp32:esp32:esp32dev, BOARD: arduino:avr:uno.
If the user did not specify a board, use "BOARD: arduino:avr:uno".
Do not add any other text or explanation.
`;

const DEFAULT_BOARD = 'arduino:avr:uno';
// const ARDUINO_BOARD = 'arduino:avr:uno';   // Change if needed
// const ARDUINO_BOARD = "esp8266:esp8266:nodemcuv2"; 

// Serve a test UI
app.use(express.static(path.join(__dirname, 'public')));

// List all contexts
app.get('/contexts', (req, res) => {
  const contexts = MCP.getAllContexts();
  res.send({ contexts });
});

// Create a new context
app.post('/contexts', (req, res) => {
  const { name, system_prompt } = req.body;
  if (!name || !system_prompt) {
    return res.status(400).send({ error: 'name and system_prompt are required' });
  }
  try {
    const id = MCP.createContext(name, system_prompt);
    res.send({ id, message: 'Context created successfully.' });
  } catch (err) {
    res.status(500).send({ error: err.toString() });
  }
});

// Get context by ID
app.get('/contexts/:id', (req, res) => {
  const ctx = MCP.getContextById(req.params.id);
  if (!ctx) {
    return res.status(404).send({ error: 'Context not found.' });
  }
  res.send({ context: ctx });
});


// API endpoint to generate Arduino code
app.post('/generate-arduino', async (req, res) => {
  try {
    console.log('[Stage 1] Received request to /generate');
    const userPrompt = req.body.prompt;
    if (!userPrompt) {
      console.warn('[Stage 1] Missing prompt in request body');
      return res.status(400).send({ error: 'Missing prompt' });
    }

    // 1. Call Ollama ===
    console.log('[Stage 2] Calling Ollama API...');
    const ollamaResponse = await axios.post(OLLAMA_URL, {
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ]
    });

    const llmOutput = ollamaResponse.data.message.content;
    console.log('[Stage 2] LLM Output:', llmOutput);

    // 2. Extract code block
    const codeMatch = llmOutput.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
    if (!codeMatch) {
      console.warn('[Stage 2] No code block found in LLM output');
      return res.status(400).send({ error: 'No code block found in LLM output.' });
    }
    const arduinoCode = codeMatch[1];
    console.log('[Stage 2] Extracted Arduino code:', arduinoCode);

    // 3. Extract board 
    const boardMatch = llmOutput.match(/BOARD:\s*([^\s]+)/i);
    const boardFQBN = boardMatch ? boardMatch[1] : DEFAULT_BOARD;
    console.log(`[Stage 2] Using Board: ${boardFQBN}`);

    // 4. Save .ino
    const sketchDir = path.join(__dirname, 'generated');
    if (!fs.existsSync(sketchDir)) {
      fs.mkdirSync(sketchDir);
    }
    const inoFile = path.join(sketchDir, 'generated.ino');
    fs.writeFileSync(inoFile, arduinoCode);

    // 5. Compile 
    console.log('[Stage 3] Compiling...');
    await runCommand(`arduino-cli compile --fqbn ${boardFQBN} ${sketchDir}`);

    //6. Upload 
    console.log('[Stage 4] Uploading...');
    await runCommand(`arduino-cli upload -p ${SERIAL_PORT} --fqbn ${boardFQBN} ${sketchDir}`);

    return res.send({
      message: 'Arduino code generated, compiled, and uploaded!',
      generated_code: arduinoCode,
      board: boardFQBN
    });

  } catch (err) {
    console.error('[Error] Exception caught:', err);
    return res.status(500).send({ error: 'Something went wrong.', details: err.toString() });
  }
});

app.get('/info', (req, res) => {
  runCommand('arduino-cli version');
  res.send('Arduino LLM Backend is running. Use POST /generate-arduino to generate code.');
});

/**
 * runCommand - helper function to run shell commands
 * @param {string} cmd - The command to run
 * @param {*} cmd 
 * @returns 
 */
function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${cmd}`);
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        return reject(stderr);
      }
      console.log(stdout);
      resolve(stdout);
    });
  });
}

/**
 * Start the server
 * @param {number} PORT - The port to run the server on
 */
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Arduino LLM backend running on http://localhost:${PORT}`);
});

// usage: bun run server.js
// or: node server.js
// curl --location 'http://localhost:3000/generate-arduino' \
// --header 'Content-Type: application/json' \
// --data '{
//     "prompt": "Write Arduino code for ESP8266 board to blink an LED on pin LED_BUILTIN every 3 seconds. Do not include any libraries."
// }'