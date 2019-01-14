var axios = require('axios');
var qs = require('qs');
var ardorjs = require('ardorjs');

const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

axios.get("https://testardor.jelurida.com/nxt?requestType=getBalance&chain=2&account=ARDOR-ZT4U-PBGE-88E2-9WKXR", config)
  .then(function(response){
    var jackpot = ((response.data.balanceNQT)/100000000).toFixed(2)
    jackpotAmount.textContent = jackpot + " Ignis";
  });

axios.get("https://testardor.jelurida.com/nxt?requestType=getBlockchainStatus", config)
  .then(function(response){
    var blockHeight = response.data.numberOfBlocks;
    blockNumber.textContent = "Block " + blockHeight;
    var nextDrawing = Math.ceil(blockHeight/10000)*10000;
    nextDraw.textContent = "Block " + nextDrawing;
    var numBlocksRemaining = (nextDrawing - blockHeight)
    var estTimeRemaining = (numBlocksRemaining*10)/3600
    var estHoursRemaining = Math.floor(estTimeRemaining);
    var estMinRemaining = ((estTimeRemaining - Math.floor(estTimeRemaining))*60).toFixed(0)
    timeRemaining.textContent = estHoursRemaining + " hrs " + estMinRemaining + " min"
  });

function sendIgnis(nodeurl, amountNQT, recipient, passPhrase){

  const publicKey = ardorjs.secretPhraseToPublicKey(passPhrase);
  console.log(ardorjs.secretPhraseToPublicKey(passphrase));

  var query = {
    chain:2,
    recipient:recipient,
    amountNQT:amountNQT,
    feeNQT:-1,
    deadline:15,
    broadcast:false,
    publicKey:publicKey
  };
  
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  
  const url_sendmoney = nodeurl+'?requestType=sendMoney';
  const url_broadcast = nodeurl+'?requestType=broadcastTransaction';

  console.log('get minimumFee');
  return axios.post(url_sendmoney, qs.stringify(query), config)
          .then(function(response) {
            if(response.data.errorDescription == "Unknown account"){
              alert("Invalid secret phrase!");
              location.reload();
            }
            if(response.data.errorCode == 4 || response.data.errorCode == 6){
              alert("Insufficient funds, please try a different amount!")
              location.reload();
            }
            query.feeNQT = response.data.minimumFeeFQT;
            query.broadcast = false;
            console.log('get transactionBytes');
            return axios.post(url_sendmoney, qs.stringify(query), config)
                .then(function(response){
                  const signed = ardorjs.signTransactionBytes(response.data.unsignedTransactionBytes, passPhrase);
                  const txdata = {transactionBytes:signed};
                  
                  console.log("sending signed transaction");
                  return axios.post(url_broadcast, qs.stringify(txdata), config)
                        .then(function(response){
                          alert("You have successfully entered the lottery!");
                          location.reload();
                          return response;
                        })
                })
          });
  }

document.getElementById("mybutton").onclick = function () {
  var passphrase = document.getElementById("passphrase").value;
  var amount = (document.getElementById("amount").value)*100000000;
  if(amount == 0 || passphrase == 0) {
    alert("You must enter an amount and a secret phrase!");
    location.reload();
  }

	sendIgnis("https://testardor.jelurida.com/nxt", amount, "ARDOR-ZT4U-PBGE-88E2-9WKXR", passphrase);
}