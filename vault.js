'use strict';
// Demonstration flow only. The bundled ciphertext decrypts to fictional values.
// Never place real private data, a real key, or a hint to it in this public tree.
(function(){
  const modal=document.getElementById('vault-modal'),keyInput=document.getElementById('vault-key'),error=document.getElementById('vault-error');
  const open=()=>{modal.hidden=false;keyInput.value='';error.hidden=true;keyInput.focus()};
  const close=()=>{modal.hidden=true;keyInput.value='';error.hidden=true};
  let taps=0,lastTap=0;
  document.getElementById('mark').addEventListener('click',()=>{const now=Date.now();taps=now-lastTap<1700?taps+1:1;lastTap=now;if(taps===7){taps=0;open()}});
  document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='l'){e.preventDefault();open()}if(e.key==='Escape'&&!modal.hidden)close()});
  document.getElementById('vault-close').onclick=close;
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  keyInput.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('vault-unlock').click()});
  const bytes=b64=>Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  document.getElementById('vault-unlock').onclick=async()=>{
    const phrase=keyInput.value;keyInput.value='';error.hidden=true;
    if(!phrase){error.textContent='Enter a key.';error.hidden=false;return}
    try{
      // A real key would only be supplied by its owner through a secure vault flow.
      const response=await fetch('demo-vault.json',{cache:'no-store'});
      if(!response.ok)throw new Error('Encrypted sample is unavailable.');
      const vault=await response.json();
      if(vault.format!=='mhl-encrypted-v1'||vault.algorithm!=='AES-256-GCM'||vault.kdf!=='PBKDF2-HMAC-SHA256'||vault.iterations!==600000)throw Error('Unknown encryption format.');
      const keyMaterial=await crypto.subtle.importKey('raw',new TextEncoder().encode(phrase),'PBKDF2',false,['deriveKey']);
      const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(vault.salt),iterations:vault.iterations,hash:'SHA-256'},keyMaterial,{name:'AES-GCM',length:256},false,['decrypt']);
      const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(vault.iv)},key,bytes(vault.ciphertext));
      const sample=JSON.parse(new TextDecoder().decode(plain));
      if(!sample?.meta?.demo)throw Error('Unexpected sample format.');
      close();show(sample,'import');notify('Encrypted DEMO plan unlocked in this browser. Fictional values only.');
      // Do not automatically save the decrypted demo plan.
    }catch(e){error.textContent='Could not unlock the demo. Check the key or try again.';error.hidden=false}
  }
})();
