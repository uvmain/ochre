import path from "path"
import fs from "fs"
import { spawn } from "child_process"

export default defineEventHandler(async (event) => {
  const file = await readMultipartFormData(event)

  if (!file || !file[0]) {
    throw createError({ statusCode: 400, message: "No file uploaded" })
  }

  const filePath = path.resolve('snippet.png')

  fs.writeFileSync(filePath, file[0].data)

  try {
    const result = await easyocr(filePath) as { text: string}
    console.log(`OCR result: ${result.text}`)
    return result
  }
  catch(err) {
    throw createError({ statusCode: 400, message: err as string })
  }
  finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
})

async function easyocr(filePath: string) {
  const pythonScriptPath = path.resolve('main.py')
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [pythonScriptPath, filePath])

    let output = ""
    python.stdout.on("data", (data) => {
      output += data
    })

    python.stderr.on("data", (data) => {
      if (!data.toString().startsWith('Neither CUDA nor MPS are available')) {
        console.error("Python Error:", data.toString())
        reject(createError({ statusCode: 500, message: "OCR processing failed" }))
      }
    })

    python.on("close", (code) => {
      if (code === 0) {
        resolve({ text: output.trim() })
      }
      else {
        reject(createError({ statusCode: 500, message: "OCR processing failed" }))
      }
    })
  })
}
