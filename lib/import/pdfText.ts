import { getDocumentProxy } from 'unpdf'

/**
 * Extrai o texto de um PDF preservando as quebras de linha.
 *
 * Usa `unpdf` (build de pdfjs compatível com serverless/Node — sem depender de
 * APIs de DOM como DOMMatrix, ao contrário do pdf-parse). Reconstruímos as linhas
 * pelo flag `hasEOL` de cada item de texto, reproduzindo o layout que os parsers
 * de plano/agendamentos esperam.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  let out = ''
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    for (const item of content.items) {
      const it = item as { str?: string; hasEOL?: boolean }
      if (typeof it.str === 'string') {
        out += it.str
        if (it.hasEOL) out += '\n'
      }
    }
    out += '\n'
  }
  return out
}
