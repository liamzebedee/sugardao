import { ethers } from 'ethers'
const {
    utils: { formatEther, parseEther } 
} = ethers

export function priceToString(num) {
    return ethers.utils.formatEther(num)
}

export {
    formatEther,
    parseEther
}