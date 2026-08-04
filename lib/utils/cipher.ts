type CipherType = 'caesar' | 'atbash' | 'base64' | 'hex' | 'reverse' | 'vigenere'

const CIPHER_TYPES: CipherType[] = ['caesar', 'atbash', 'base64', 'hex', 'reverse', 'vigenere']

function seededRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  }
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff
    return h / 0x7fffffff
  }
}

function caesarEncrypt(plain: string, shift: number): string {
  return plain.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base)
  })
}

function atbashEncrypt(plain: string): string {
  return plain.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(base + 25 - (c.charCodeAt(0) - base))
  })
}

function vigenereEncrypt(plain: string, key: string): string {
  const k = key.replace(/[^a-zA-Z]/g, '').toLowerCase()
  let ki = 0
  return plain.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97
    const shift = k.charCodeAt(ki % k.length) - 97
    ki++
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base)
  })
}

export function generateCipher(dateStr: string): {
  cipherType: CipherType
  ciphertext: string
  plaintext: string
} {
  const rand = seededRandom(dateStr)
  const cipherType = CIPHER_TYPES[Math.floor(rand() * CIPHER_TYPES.length)]
  const plaintext = `KLEIA{daily_cipher_${dateStr}}`
  let ciphertext: string

  switch (cipherType) {
    case 'caesar': {
      const shift = Math.floor(rand() * 25) + 1
      ciphertext = caesarEncrypt(plaintext, shift)
      break
    }
    case 'atbash':
      ciphertext = atbashEncrypt(plaintext)
      break
    case 'base64':
      ciphertext = Buffer.from(plaintext).toString('base64')
      break
    case 'hex':
      ciphertext = Buffer.from(plaintext).toString('hex')
      break
    case 'reverse':
      ciphertext = plaintext.split('').reverse().join('')
      break
    case 'vigenere': {
      const keys = ['kleia', 'cipher', 'ctf', 'hack', 'flag']
      ciphertext = vigenereEncrypt(plaintext, keys[Math.floor(rand() * keys.length)])
      break
    }
    default:
      ciphertext = plaintext
  }

  return { cipherType, ciphertext, plaintext }
}