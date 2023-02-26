export const checkSum = (hex) => {
  let hexStr = hex.toString(16)
  let bytes = []
  for(let i = 0; i < hexStr.length; i += 2){
      bytes.push(hexStr[i] + hexStr[i + 1])
  }
  let sum = 0
  for(let i = 0; i < bytes.length - 1; i++){
      sum -= parseInt(bytes[i], 16)
  }
  sum = sum >>> 0
  sum ^= 0x3a
  sum &= 0xFF
  return sum.toString(16)
}