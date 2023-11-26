const SocialFinance = artifacts.require('SocialFinance')

module.exports = function (deployer, network, accounts) {
  console.log(`Deploying on network ${network} with ${accounts[0]}`)
  deployer.deploy(SocialFinance)
}