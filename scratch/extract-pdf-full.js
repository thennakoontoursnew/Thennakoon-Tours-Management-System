const fs = require('fs')
const path = require('path')

const p1 = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\9d0a4797-fce3-4cee-9469-abd26970475c\\.user_uploaded\\media__1784287263767.pdf'
const p2 = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\9d0a4797-fce3-4cee-9469-abd26970475c\\.user_uploaded\\media__1784287263795.pdf'

console.log('p1 size:', fs.existsSync(p1) ? fs.statSync(p1).size : 'not found')
console.log('p2 size:', fs.existsSync(p2) ? fs.statSync(p2).size : 'not found')

// Let's see if pdf-parse is available
try {
  const pdfParse = require('pdf-parse')
  async function run() {
    if (fs.existsSync(p1)) {
      const dataBuffer = fs.readFileSync(p1)
      const res = await pdfParse(dataBuffer)
      console.log('=== P1 TEXT ===')
      console.log(res.text.slice(0, 3000))
      fs.writeFileSync('scratch/pdf1_text.txt', res.text)
    }
    if (fs.existsSync(p2)) {
      const dataBuffer = fs.readFileSync(p2)
      const res = await pdfParse(dataBuffer)
      console.log('=== P2 TEXT ===')
      console.log(res.text.slice(0, 3000))
      fs.writeFileSync('scratch/pdf2_text.txt', res.text)
    }
  }
  run()
} catch (e) {
  console.log('pdf-parse not installed directly:', e.message)
}
