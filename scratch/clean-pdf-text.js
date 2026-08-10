const fs = require('fs')

const text = fs.readFileSync('scratch/pdf2_decompressed.txt', 'utf8')

// Clean PDF text Operators like (text) Tj or [(text)] TJ
const matches = []
const regex = /\(([^()]*)\)\s*T[jJ]/g
let m
while ((m = regex.exec(text)) !== null) {
  matches.push(m[1])
}

const cleanedText = matches.join(' ')
fs.writeFileSync('scratch/pdf2_readable_text.txt', cleanedText)
console.log('Readable text extracted. Total words:', cleanedText.split(/\s+/).length)
console.log('Snippet:', cleanedText.slice(0, 2000))
