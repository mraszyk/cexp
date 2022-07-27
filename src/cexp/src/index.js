import { Actor, Certificate, HttpAgent, hashTreeToString } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

function buf2hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

function uleb128(buffer) {
  var r=0;
  var b=1;
  for (var i = 0; i < buffer.length; i++) {
    r+=(buffer[i]&127)*b;
    b*=128;
  }
  return r;
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
  var time = certificate.lookup(["time"]);
  var controllers = cbor.decode(certificate.lookup(["canister", principal.toUint8Array(), "controllers"])).value;

  document.getElementById("valid").innerText = "valid: " + valid;
  document.getElementById("hash").innerText = "hash: " + buf2hex(hash);
  document.getElementById("controllers").innerText = "controllers: " + controllers.map(function(o){
    return Principal.fromUint8Array(o).toText();
  });
  var timebuffer = new Uint8Array(time);
  var r=uleb128(timebuffer)*1e-6;
  var cdate = new Date(r);
  var ldate = new Date();
  document.getElementById("ctime").innerText = "certified time: " + cdate.toLocaleString();
  document.getElementById("ltime").innerText = "client time: " + ldate.toLocaleString();

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
