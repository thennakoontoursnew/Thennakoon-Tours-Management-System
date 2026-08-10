const fs = require('fs')

function extractStringsFromPdf(pdfPath, outputPath) {
  if (!fs.existsSync(pdfPath)) return
  const buf = fs.readFileSync(pdfPath)
  const str = buf.toString('latin1')
  
  // Extract text inside Tj, TJ, or parenthesis in PDF stream
  const matches = []
  const regex = /\(([^()]*)\)\s*T[jJ]/g
  let match
  while ((match = regex.exec(str)) !== null) {
    matches.push(match[1])
  }
  
  const text = matches.join(' ')
  fs.writeFileSync(outputPath, text)
  console.log(`Extracted ${matches.length} strings to ${outputPath}`)
}

extractStringsFromPdf('C:\\Users\\USER\\.gemini\\antigravity\\brain\\9d0a4797-fce3-4cee-9469-abd26970475c\\.user_uploaded\\media__1784287263767.pdf', 'scratch/p1_extracted.txt')
extractStringsFromPdf('C:\\Users\\USER\\.gemini\\antigravity\\brain\\9d0a4797-fce3-4cee-9469-abd26970475c\\.user_uploaded\\media__1784287263795.pdf', 'scratch/p2_extracted.txt')
