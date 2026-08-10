const fs = require('fs')

const text = fs.readFileSync('scratch/pdf2_decompressed.txt', 'utf8')

// Find all printed character strings in PDF stream (like Tj / TJ arrays)
const lines = text.split('\n')
const textLines = []
for (const line of lines) {
  if (line.includes('Tj') || line.includes('TJ') || line.includes('LKR') || line.includes('13,500') || line.includes('15,000') || line.includes('25,000') || line.includes('12,000') || line.includes('5,000')) {
    textLines.push(line.trim())
  }
}

console.log('Found lines with numbers/text:', textLines.length)
console.log(textLines.slice(0, 50).join('\n'))
