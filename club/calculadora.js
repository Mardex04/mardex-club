/* Calculadora de contratos — Mardex Club. Se inyecta sola en #p-calculadora. */
(function () {
  var host = document.getElementById("p-calculadora");
  if (!host) return;
  host.classList.add("mx-calc");
  var st = document.createElement("style");
  st.textContent = ".mx-calc{--mx-bg:var(--bg);--mx-card:var(--surface);--mx-line:var(--line);--mx-tx:var(--fg);--mx-suave:color-mix(in srgb,var(--fg) 72%,var(--bg));--mx-ac:var(--accent-text);--mx-ok:var(--up);--mx-aviso:var(--accent-text);color:var(--mx-tx)}\n.mx-calc .mxsub{color:var(--mx-suave);margin:0 0 18px}\n.mx-calc .box{background:var(--mx-card);border:1px solid var(--mx-line);border-radius:14px;padding:18px}\n.mx-calc label{display:block;font-size:.85rem;color:var(--mx-suave);margin:0 0 6px}\n.mx-calc .grupo{margin-bottom:16px}\n.mx-calc input{width:100%;box-sizing:border-box;background:var(--mx-bg);border:1px solid var(--mx-line);border-radius:10px;color:var(--mx-tx);padding:11px 12px;font-size:1rem}\n.mx-calc input:focus{outline:none;border-color:var(--mx-ac)}\n.mx-calc .chips{display:flex;gap:8px;flex-wrap:wrap;align-items:center}\n.mx-calc .chip{background:var(--mx-bg);border:1px solid var(--mx-line);color:var(--mx-tx);border-radius:999px;padding:10px 18px;cursor:pointer;font-size:1rem}\n.mx-calc .chip.on{border-color:var(--mx-ac);color:var(--mx-ac);font-weight:600}\n.mx-calc .propio{width:130px}\n.mx-calc .res{margin-top:6px;text-align:center;padding:18px;border-radius:12px;background:var(--mx-bg);border:1px solid var(--mx-line)}\n.mx-calc .big{font-size:3.2rem;font-weight:700;color:var(--mx-ac);line-height:1}\n.mx-calc .real{margin-top:12px;font-size:1.1rem;font-weight:600}\n.mx-calc .ideal{margin-bottom:10px;color:var(--mx-suave);font-size:.95rem}\n.mx-calc .ideal b{color:var(--mx-tx)}\n.mx-calc .nota{margin-top:10px;color:var(--mx-ok);font-size:.92rem}\n.mx-calc .nota.aviso{color:var(--mx-aviso)}\n.mx-calc .alt{margin-top:10px;padding-top:10px;border-top:1px dashed var(--mx-line);color:var(--mx-suave);font-size:.95rem}\n.mx-calc .alt b{color:var(--mx-tx)}\n.mx-calc table{width:100%;border-collapse:collapse;margin-top:10px}\n.mx-calc th,.mx-calc td{padding:8px 10px;text-align:center;border-bottom:1px solid var(--mx-line)}\n.mx-calc th{color:var(--mx-suave);font-weight:500;font-size:.85rem}\n.mx-calc td small{color:var(--mx-suave)}\n.mx-calc td .w{color:var(--mx-aviso)}\n.mx-calc .leyenda{color:var(--mx-suave);font-size:.85rem;margin:10px 0 0}\n.mx-calc h3{margin:26px 0 8px;font-size:1.1rem}\n.mx-calc h3 small{color:var(--mx-suave);font-weight:400;font-size:.85rem}\n.mx-calc p,.mx-calc li{line-height:1.55}\n.mx-calc .ej{background:var(--mx-card);border-left:3px solid var(--mx-ac);padding:12px 14px;border-radius:8px;margin:10px 0}";
  document.head.appendChild(st);
  st.textContent += ".mx-calc .res{display:block}"; /* anula el .res del Club */
  st.textContent += ".mx-calc h2 span{font-family:var(--f-body);font-weight:600}"; /* para que la Q de MNQ se distinga */
  host.innerHTML = "<h2>Calculadora de contratos <span style=\"color:var(--accent-text)\">(MNQ)</span></h2>\n<p class=\"mxsub\">Elegí tu cuenta y tu riesgo, poné tu stop y listo: te dice cuántos micros tirar.</p>\n\n<div class=\"box\">\n  <div class=\"grupo\">\n    <label>Tamaño de la cuenta</label>\n    <div class=\"chips\" id=\"mxCuentas\">\n      <button class=\"chip\" data-c=\"25000\">USD 25.000</button>\n      <button class=\"chip on\" data-c=\"50000\">USD 50.000</button>\n      <button class=\"chip\" data-c=\"100000\">USD 100.000</button>\n    </div>\n  </div>\n  <div class=\"grupo\">\n    <label>Riesgo por trade</label>\n    <div class=\"chips\" id=\"mxRiesgos\">\n      <button class=\"chip on\" data-r=\"0.5\">0,5%</button>\n      <button class=\"chip\" data-r=\"0.75\">0,75%</button>\n      <button class=\"chip\" data-r=\"1\">1%</button>\n      <input class=\"propio\" id=\"mxPropio\" type=\"text\" inputmode=\"decimal\" placeholder=\"Otro (%)\" aria-label=\"Otro riesgo en porcentaje\">\n    </div>\n  </div>\n  <div class=\"grupo\">\n    <label for=\"mxStop\">Stop (en puntos, número entero)</label>\n    <input id=\"mxStop\" type=\"text\" inputmode=\"numeric\" pattern=\"[0-9]*\" value=\"30\">\n  </div>\n  <div class=\"res\" aria-live=\"polite\">\n    <div class=\"ideal\" id=\"mxIdeal\"></div>\n    <div class=\"big\" id=\"mxCont\">–</div>\n    <div id=\"mxTipo\" style=\"margin-top:4px\">micros</div>\n    <div class=\"real\" id=\"mxReal\"></div>\n    <div class=\"nota\" id=\"mxNota\"></div>\n    <div class=\"alt\" id=\"mxAlt\" style=\"display:none\"></div>\n  </div>\n</div>\n\n<h3>Tabla rápida <small id=\"mxTablaCuenta\"></small></h3>\n<div class=\"box\"><table id=\"mxTabla\"><thead><tr><th>Stop (puntos)</th><th>Riesgo 0,5%</th><th>Riesgo 0,75%</th><th>Riesgo 1%</th></tr></thead><tbody></tbody></table>\n<p class=\"leyenda\" id=\"mxLeyenda\"></p></div>\n\n<h3>Cómo funciona</h3>\n<p>La idea es simple: <b>primero decidís cuánta plata estás dispuesto a perder</b> en el trade, y después ajustás los contratos al tamaño de tu stop. Cuanto más grande el stop, menos contratos; cuanto más chico, más contratos. Así perdés siempre más o menos lo mismo si te toca el stop.</p>\n<ol>\n  <li><b>Tu riesgo</b> = cuenta × % de riesgo. Con USD 50.000 al 0,5% son USD 250. Podés elegir 0,5%, 0,75%, 1% o escribir el que quieras.</li>\n  <li><b>Lo que pierde 1 micro</b> = stop en puntos × USD 2 (cada punto del MNQ vale USD 2 por contrato).</li>\n  <li><b>Contratos</b> = los que dejen tu riesgo lo más cerca posible del riesgo ideal.</li>\n</ol>\n<p><b>El margen:</b> los contratos son enteros, así que casi nunca se llega justo a tu riesgo ideal. Por eso el riesgo tiene un margen de unos <b>±USD 50</b> en una cuenta de 50.000 (±25 en la de 25.000 y ±100 en la de 100.000). Es decir, alrededor del 0,1% de la cuenta. Dentro de ese margen, la calculadora elige lo más cercano a tu riesgo ideal.</p>\n<div class=\"ej\"><b>Ejemplo 1:</b> cuenta de USD 50.000, riesgo 0,5% y stop de 15 puntos.<br>\nUn micro pierde 15 × 2 = USD 30. Con 8 micros arriesgás USD 240, lo más cerca de tus USD 250. Con 9 serían USD 270: te pasás más que con 8.</div>\n<div class=\"ej\"><b>Ejemplo 2:</b> mismo riesgo, stop de 70 puntos.<br>\nUn micro pierde USD 140. Con 1 arriesgás USD 140 (muy por debajo) y con 2 arriesgás USD 280. Como 280 entra en el margen y está mucho más cerca de 250, la calculadora te sugiere <b>2 micros</b>. Si preferís ir más tranquilo, te muestra también la opción de 1.</div>\n<div class=\"ej\"><b>Ejemplo 3 (stop muy largo):</b> mismo riesgo, stop de 190 puntos.<br>\nUn micro pierde USD 380, más de lo que querés arriesgar. Menos de 1 micro no se puede, así que la calculadora te dice <b>1 micro</b> igualmente, pero te avisa que vas a arriesgar más que tu riesgo ideal y cuál es el stop máximo que te mantiene dentro del margen.</div>";
})();
(function () {
  var PUNTO=2, MARGEN_PCT=0.1; /* margen = 0,1% de la cuenta (50.000 → ±50) */
  var cuenta=50000, riesgo=0.5;
  var $=function(i){return document.getElementById(i)};
  function fmt(n,d){return n.toLocaleString('es-UY',{maximumFractionDigits:d==null?2:d})}
  /* Elige los micros cuyo riesgo queda más cerca del objetivo sin pasar el tope (empate: el de menos).
     Si ni 1 micro entra en el margen, devuelve igual 1 y marca pasa:true. */
  function calc(c,r,stop){
    var obj=c*r/100, margen=c*MARGEN_PCT/100, tope=obj+margen, por=stop*PUNTO;
    if(!(por>0)) return null;
    var lo=Math.floor(obj/por+1e-9), hi=lo+1, n=lo, pasa=false;
    if(hi*por<=tope+1e-9 && Math.abs(hi*por-obj)<Math.abs(lo*por-obj)-1e-9) n=hi;
    if(n<1){ n=1; pasa=por>tope+1e-9; }
    return {n:n,obj:obj,margen:margen,tope:tope,por:por,real:n*por,conserv:lo,pasa:pasa};
  }
  function render(){
    var s=parseInt($('mxStop').value,10);
    var ok=s>0&&riesgo>0, o=ok?calc(cuenta,riesgo,s):null;
    var nota=$('mxNota'); nota.textContent=''; nota.className='nota';
    $('mxReal').textContent='';$('mxAlt').style.display='none';
    leyenda();
    $('mxIdeal').innerHTML=(riesgo>0)?'Riesgo ideal: <b>'+fmt(riesgo,2)+'%</b> = <b>USD '+fmt(cuenta*riesgo/100,0)+'</b>':'';
    if(!o){
      $('mxCont').textContent='–';$('mxTipo').textContent='micros';
      $('mxReal').textContent=!(riesgo>0)?'Elegí o escribí tu riesgo.':'Poné tu stop en puntos.';
      return;
    }
    $('mxCont').textContent=o.n;
    $('mxTipo').textContent=o.n===1?'micro':'micros';
    $('mxReal').textContent='Vas a arriesgar USD '+fmt(o.real,0)+' (≈ '+fmt(o.real/cuenta*100,1)+'% de la cuenta)';
    if(o.pasa){
      nota.className='nota aviso';
      var stopMax=Math.floor(o.tope/PUNTO);
      nota.textContent='⚠ Es el mínimo posible (1 micro), pero te pasás USD '+fmt(o.real-o.obj,0)+' de tu riesgo ideal.'
        +(stopMax>=1?' Para quedarte dentro del margen, tu stop tendría que ser de '+stopMax+' puntos o menos.':'');
      return;
    }
    var dif=o.real-o.obj;
    if(dif>1e-9){
      nota.textContent='Un poco por encima de tu riesgo ideal, pero dentro del margen (±USD '+fmt(o.margen,0)+').';
      if(o.conserv>=1){
        $('mxAlt').style.display='block';
        $('mxAlt').innerHTML='Si preferís arriesgar menos: <b>'+o.conserv+' '+(o.conserv===1?'micro':'micros')+'</b> (USD '+fmt(o.conserv*o.por,0)+')';
      }
    } else if(dif<-1e-9){
      if(-dif<=o.margen+1e-9){ nota.textContent='Un poco por debajo de tu riesgo ideal, dentro del margen (±USD '+fmt(o.margen,0)+').'; }
      else { nota.className='nota aviso'; nota.textContent='Por debajo de tu riesgo ideal: con un micro más te pasarías del margen.'; }
    }
  }
  /* Cartel de abajo de la tabla: se adapta a la cuenta y al riesgo elegidos */
  function leyenda(){
    var x=Math.floor(cuenta*riesgo/100/PUNTO), el=$('mxLeyenda'), hayAviso=!!document.querySelector('#mxTabla .w');
    if(!el) return;
    el.innerHTML='Lo mínimo que podés arriesgar es 1 micro.'+(riesgo>0&&x>=1?' Con una cuenta de USD '+fmt(cuenta)+' y riesgo de '+fmt(riesgo,2)+'%, si tu stop es de más de '+x+' puntos, ese micro ya es más riesgo del ideal.':'')+(hayAviso?'<br>⚠ = con 1 micro ya te pasás del margen.':'');
  }
  function tabla(){
    var tb=document.querySelector('#mxTabla tbody'); tb.innerHTML='';
    $('mxTablaCuenta').textContent='· cuenta de USD '+fmt(cuenta)+', micros';
    function celda(o){return o.n+' <small>(USD '+fmt(o.real,0)+')</small>'+(o.pasa?' <span class="w">⚠</span>':'')}
    [15,20,25,30,40,50,60,70,100,120].forEach(function(s){
      var tr=document.createElement('tr');
      tr.innerHTML='<td>'+s+'</td><td>'+celda(calc(cuenta,0.5,s))+'</td><td>'+celda(calc(cuenta,0.75,s))+'</td><td>'+celda(calc(cuenta,1,s))+'</td>';
      tb.appendChild(tr);
    });
    leyenda();
  }
  /* Cuenta y riesgo con botones */
  function grupo(id,attr,cb){
    var btns=document.querySelectorAll('#'+id+' .chip');
    btns.forEach(function(b){
      b.addEventListener('click',function(){
        btns.forEach(function(x){x.classList.remove('on')});
        b.classList.add('on'); cb(parseFloat(b.dataset[attr])); render(); tabla();
      });
    });
  }
  grupo('mxCuentas','c',function(v){cuenta=v});
  grupo('mxRiesgos','r',function(v){riesgo=v; $('mxPropio').value='';});
  /* Riesgo escrito a mano (acepta coma o punto) */
  $('mxPropio').addEventListener('input',function(){
    var t=this.value.replace(/[^0-9.,]/g,''); this.value=t;
    var v=parseFloat(t.replace(',','.'));
    document.querySelectorAll('#mxRiesgos .chip').forEach(function(x){x.classList.remove('on')});
    riesgo=(v>0)?v:0; render();
  });
  /* Stop: solo números enteros */
  $('mxStop').addEventListener('input',function(){ this.value=this.value.replace(/\D/g,''); render(); });
  render(); tabla();
})();
