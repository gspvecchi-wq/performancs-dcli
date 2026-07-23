import { randomBytes } from 'crypto'

/**
 * Token opaco para o link público da pesquisa.
 *
 * Fica separado de `./nps` porque usa `crypto` (Node) — importar isso num
 * componente de cliente arrastaria o módulo para o bundle do navegador.
 * Use apenas em rotas server-side.
 */
export function gerarToken(): string {
  return randomBytes(16).toString('base64url')
}
