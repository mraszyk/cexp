import { Actor, Certificate, HttpAgent, hashTreeToString } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

function buf2hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

document.querySelector("form").addEventListener("submit", async (e) => {

  e.preventDefault();

  const cbor = require('cbor')

  const agent = new HttpAgent({
    host: "https://ic0.app",
  });

  var canister = document.getElementById("name").value.toString();

  var principal = Principal.fromText(canister);
  var response = await agent.readState(principal, {paths: [["canister", principal.toUint8Array(), "module_hash"], ["canister", principal.toUint8Array(), "controllers"]]});
  var certificate = new Certificate(response, agent);
  var valid = await certificate.verify();
  var hash = certificate.lookup(["canister", principal.toUint8Array(), "module_hash"]);
  var controllers = cbor.decode(certificate.lookup(["canister", principal.toUint8Array(), "controllers"])).value;

  document.getElementById("valid").innerText = "valid: " + valid;
  document.getElementById("hash").innerText = "hash: " + buf2hex(hash);
  document.getElementById("controllers").innerText = "controllers: " + controllers.map(function(o){
    return Principal.fromUint8Array(o).toText();
  });

  try {
    var response_blob = await agent.readState(principal, {paths: [["canister", principal.toUint8Array(), "metadata", "repro"]]});
    var certificate_blob = new Certificate(response_blob, agent);
    var valid_blob = await certificate_blob.verify();
    if (!valid_blob) document.getElementById("valid").innerText = "valid: " + false;
    var blob = certificate_blob.lookup(["canister", principal.toUint8Array(), "metadata", "repro"]);
    var addr = new TextDecoder("utf-8").decode(blob);
    document.getElementById("code").innerHTML = "<a href=\"" + addr + "\" target=\"_blank\">Link to source code available!</a>";
  } catch(e) {
    document.getElementById("code").innerText = "No link to source code available!";
  }

  return false;

});
