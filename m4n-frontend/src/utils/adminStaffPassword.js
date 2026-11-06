const TEMP_PASSWORD_LENGTH = 16
const PASSWORD_UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const PASSWORD_LOWERCASE = 'abcdefghijkmnopqrstuvwxyz'
const PASSWORD_DIGITS = '23456789'
const PASSWORD_SYMBOLS = '!@#$%*+-_?'
const PASSWORD_CHARACTERS = `${PASSWORD_UPPERCASE}${PASSWORD_LOWERCASE}${PASSWORD_DIGITS}${PASSWORD_SYMBOLS}`

function secureRandomIndex(maxExclusive) {
  if (!window.crypto?.getRandomValues) {
    throw new Error('Trình duyệt không hỗ trợ tạo mật khẩu an toàn.')
  }

  const limit = 256 - (256 % maxExclusive)
  const randomByte = new Uint8Array(1)
  do {
    window.crypto.getRandomValues(randomByte)
  } while (randomByte[0] >= limit)
  return randomByte[0] % maxExclusive
}

function randomCharacter(characters) {
  return characters[secureRandomIndex(characters.length)]
}

export function generateTemporaryPassword() {
  const characters = [
    randomCharacter(PASSWORD_UPPERCASE),
    randomCharacter(PASSWORD_LOWERCASE),
    randomCharacter(PASSWORD_DIGITS),
    randomCharacter(PASSWORD_SYMBOLS),
  ]

  while (characters.length < TEMP_PASSWORD_LENGTH) {
    characters.push(randomCharacter(PASSWORD_CHARACTERS))
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomIndex(index + 1)
    const currentCharacter = characters[index]
    characters[index] = characters[swapIndex]
    characters[swapIndex] = currentCharacter
  }

  return characters.join('')
}

