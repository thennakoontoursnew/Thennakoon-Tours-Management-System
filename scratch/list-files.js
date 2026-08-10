const fs = require('fs')
const path = require('path')
const dir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\9d0a4797-fce3-4cee-9469-abd26970475c\\.user_uploaded'
if (fs.existsSync(dir)) {
  fs.readdirSync(dir).forEach(f => {
    console.log(f, fs.statSync(path.join(dir, f)).size)
  })
}
