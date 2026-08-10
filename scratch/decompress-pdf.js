const fs = require('fs')
const zlib = require('zlib')

const buf = fs.readFileSync('C:\\Users\\USER\\.gemini\\antigravity\\brain\\9d0a4797-fce3-4cee-9469-abd26970475c\\.user_uploaded\\media__1784287263795.pdf')

// Search for streams in PDF
const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
let match
let count = 0
let textDump = ''

while ((match = streamRegex.exec(buf.toString('binary'))) !== null) {
  count++
  const rawStream = Buffer.from(match[1], 'binary')
  try {
    const decompressed = zlib.inflateSync(rawStream)
    const str = decompressed.toString('latin1')
    textDump += `\n--- STREAM ${count} ---\n` + str
  } catch (e) {
    textDump += `\n--- STREAM ${count} (raw) ---\n` + rawStream.toString('latin1').slice(0, 500)
  }
}

fs.writeFileSync('scratch/pdf2_decompressed.txt', textDump)
console.log(`Decompressed ${count} streams into scratch/pdf2_decompressed.txt`)
