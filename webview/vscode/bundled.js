const t=globalThis,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new WeakMap;let o=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const i=this.t;if(e&&void 0===t){const e=void 0!==i&&1===i.length;e&&(t=s.get(i)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&s.set(i,t))}return t}toString(){return this.cssText}};const r=t=>new o("string"==typeof t?t:t+"",void 0,i),n=(t,...e)=>{const s=1===t.length?t[0]:e.reduce(((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1]),t[0]);return new o(s,t,i)},l=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return r(e)})(t):t,{is:a,defineProperty:h,getOwnPropertyDescriptor:c,getOwnPropertyNames:d,getOwnPropertySymbols:u,getPrototypeOf:p}=Object,v=globalThis,b=v.trustedTypes,f=b?b.emptyScript:"",g=v.reactiveElementPolyfillSupport,m=(t,e)=>t,x={toAttribute(t,e){switch(e){case Boolean:t=t?f:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},w=(t,e)=>!a(t,e),y={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:w};Symbol.metadata??=Symbol("metadata"),v.litPropertyMetadata??=new WeakMap;let k=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&h(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:o}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const r=s?.call(this);o?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(m("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(m("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(m("properties"))){const t=this.properties,e=[...d(t),...u(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(l(t))}else void 0!==t&&e.push(l(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach((t=>t(this)))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,s)=>{if(e)i.adoptedStyleSheets=s.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const e of s){const s=document.createElement("style"),o=t.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=e.cssText,i.appendChild(s)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach((t=>t.hostConnected?.()))}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach((t=>t.hostDisconnected?.()))}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:x).toAttribute(e,i.type);this._$Em=t,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:x;this._$Em=s,this[s]=o.fromAttribute(e,t.type)??this._$Ej?.get(s)??null,this._$Em=null}}requestUpdate(t,e,i){if(void 0!==t){const s=this.constructor,o=this[t];if(i??=s.getPropertyOptions(t),!((i.hasChanged??w)(o,e)||i.useDefault&&i.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:o},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==o||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach((t=>t.hostUpdate?.())),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach((t=>t.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach((t=>this._$ET(t,this[t]))),this._$EM()}updated(t){}firstUpdated(t){}};k.elementStyles=[],k.shadowRootOptions={mode:"open"},k[m("elementProperties")]=new Map,k[m("finalized")]=new Map,g?.({ReactiveElement:k}),(v.reactiveElementVersions??=[]).push("2.1.0");const $=globalThis,_=$.trustedTypes,S=_?_.createPolicy("lit-html",{createHTML:t=>t}):void 0,B="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,O="?"+C,A=`<${O}>`,z=document,E=()=>z.createComment(""),I=t=>null===t||"object"!=typeof t&&"function"!=typeof t,j=Array.isArray,M="[ \t\n\f\r]",P=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,F=/>/g,V=RegExp(`>|${M}(?:([^\\s"'>=/]+)(${M}*=${M}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),T=/'/g,N=/"/g,R=/^(?:script|style|textarea|title)$/i,L=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),U=L(1),G=L(2),H=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),W=new WeakMap,K=z.createTreeWalker(z,129);function X(t,e){if(!j(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const J=(t,e)=>{const i=t.length-1,s=[];let o,r=2===e?"<svg>":3===e?"<math>":"",n=P;for(let e=0;e<i;e++){const i=t[e];let l,a,h=-1,c=0;for(;c<i.length&&(n.lastIndex=c,a=n.exec(i),null!==a);)c=n.lastIndex,n===P?"!--"===a[1]?n=D:void 0!==a[1]?n=F:void 0!==a[2]?(R.test(a[2])&&(o=RegExp("</"+a[2],"g")),n=V):void 0!==a[3]&&(n=V):n===V?">"===a[0]?(n=o??P,h=-1):void 0===a[1]?h=-2:(h=n.lastIndex-a[2].length,l=a[1],n=void 0===a[3]?V:'"'===a[3]?N:T):n===N||n===T?n=V:n===D||n===F?n=P:(n=V,o=void 0);const d=n===V&&t[e+1].startsWith("/>")?" ":"";r+=n===P?i+A:h>=0?(s.push(l),i.slice(0,h)+B+i.slice(h)+C+d):i+C+(-2===h?e:d)}return[X(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Y{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let o=0,r=0;const n=t.length-1,l=this.parts,[a,h]=J(t,e);if(this.el=Y.createElement(a,i),K.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=K.nextNode())&&l.length<n;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(B)){const e=h[r++],i=s.getAttribute(t).split(C),n=/([.?@])?(.*)/.exec(e);l.push({type:1,index:o,name:n[2],strings:i,ctor:"."===n[1]?et:"?"===n[1]?it:"@"===n[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(C)&&(l.push({type:6,index:o}),s.removeAttribute(t));if(R.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=_?_.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],E()),K.nextNode(),l.push({type:2,index:++o});s.append(t[e],E())}}}else if(8===s.nodeType)if(s.data===O)l.push({type:2,index:o});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)l.push({type:7,index:o}),t+=C.length-1}o++}}static createElement(t,e){const i=z.createElement("template");return i.innerHTML=t,i}}function Z(t,e,i=t,s){if(e===H)return e;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const r=I(e)?void 0:e._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(e=Z(t,o._$AS(t,e.values),o,s)),e}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Z(this,t,e),I(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==H&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>j(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&I(this._$AH)?this._$AA.nextSibling.data=t:this.T(z.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Y.createElement(X(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??z).importNode(e,!0);K.currentNode=s;let o=K.nextNode(),r=0,n=0,l=i[0];for(;void 0!==l;){if(r===l.index){let e;2===l.type?e=new Q(o,o.nextSibling,this,t):1===l.type?e=new l.ctor(o,l.name,l.strings,this,t):6===l.type&&(e=new ot(o,this,t)),this._$AV.push(e),l=i[++n]}r!==l?.index&&(o=K.nextNode(),r++)}return K.currentNode=z,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=W.get(t.strings);return void 0===e&&W.set(t.strings,e=new Y(t)),e}k(t){j(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const o of t)s===e.length?e.push(i=new Q(this.O(E()),this.O(E()),this,this.options)):i=e[s],i._$AI(o),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,o){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}_$AI(t,e=this,i,s){const o=this.strings;let r=!1;if(void 0===o)t=Z(this,t,e,0),r=!I(t)||t!==this._$AH&&t!==H,r&&(this._$AH=t);else{const s=t;let n,l;for(t=o[0],n=0;n<o.length-1;n++)l=Z(this,s[i+n],e,n),l===H&&(l=this._$AH[n]),r||=!I(l)||l!==this._$AH[n],l===q?t=q:t!==q&&(t+=(l??"")+o[n+1]),this._$AH[n]=l}r&&!s&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class st extends tt{constructor(t,e,i,s,o){super(t,e,i,s,o),this.type=5}_$AI(t,e=this){if((t=Z(this,t,e,0)??q)===H)return;const i=this._$AH,s=t===q&&i!==q||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==q&&(i===q||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ot{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Z(this,t)}}const rt={I:Q},nt=$.litHtmlPolyfillSupport;nt?.(Y,Q),($.litHtmlVersions??=[]).push("3.3.0");const lt=(t,e,i)=>{const s=i?.renderBefore??e;let o=s._$litPart$;if(void 0===o){const t=i?.renderBefore??null;s._$litPart$=o=new Q(e.insertBefore(E(),t),t,void 0,i??{})}return o._$AI(t),o},at=globalThis;let ht=class extends k{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=lt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return H}};ht._$litElement$=!0,ht.finalized=!0,at.litElementHydrateSupport?.({LitElement:ht});const ct=at.litElementPolyfillSupport;ct?.({LitElement:ht}),(at.litElementVersions??=[]).push("4.2.0");const dt={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:w},ut=(t=dt,e,i)=>{const{kind:s,metadata:o}=i;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const o=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,o,t)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const o=this[s];e.call(this,i),this.requestUpdate(s,o,t)}}throw Error("Unsupported decorator location: "+s)};function pt(t){return(e,i)=>"object"==typeof i?ut(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function vt(t){return pt({...t,state:!0,attribute:!1})}const bt=(t,e,i)=>(i.configurable=!0,i.enumerable=!0,i);function ft(t,e){return(i,s,o)=>{const r=e=>e.renderRoot?.querySelector(t)??null;if(e){const{get:t,set:e}="object"==typeof s?i:o??(()=>{const t=Symbol();return{get(){return this[t]},set(e){this[t]=e}}})();return bt(0,0,{get(){let i=t.call(this);return void 0===i&&(i=r(this),(null!==i||this.hasUpdated)&&e.call(this,i)),i}})}return bt(0,0,{get(){return r(this)}})}}let gt;function mt(t){return(e,i)=>{const{slot:s,selector:o}=t??{},r="slot"+(s?`[name=${s}]`:":not([name])");return bt(0,0,{get(){const e=this.renderRoot?.querySelector(r),i=e?.assignedElements(t)??[];return void 0===o?i:i.filter((t=>t.matches(o)))}})}}const xt="2.3.1",wt="__vscodeElements_disableRegistryWarning__";class yt extends ht{get version(){return xt}}const kt=t=>e=>{if(!customElements.get(t))return void customElements.define(t,e);if(wt in window)return;const i=document.createElement(t),s=i?.version;let o="";s?s!==xt?(o+="is already registered by a different version of VSCode Elements. ",o+=`This version is "${xt}", while the other one is "${s}".`):o+=`is already registered by the same version of VSCode Elements (${xt}).`:o+="is already registered by an unknown custom element handler class.",console.warn(`[VSCode Elements] ${t} ${o}\nTo suppress this warning, set window.${wt} to true`)};var $t=n`
  :host([hidden]) {
    display: none;
  }

  :host([disabled]),
  :host(:disabled) {
    cursor: not-allowed;
    opacity: 0.4;
    pointer-events: none;
  }
`;function _t(){return navigator.userAgent.indexOf("Linux")>-1?'system-ui, "Ubuntu", "Droid Sans", sans-serif':navigator.userAgent.indexOf("Mac")>-1?"-apple-system, BlinkMacSystemFont, sans-serif":navigator.userAgent.indexOf("Windows")>-1?'"Segoe WPC", "Segoe UI", sans-serif':"sans-serif"}const St=[$t,n`
    :host {
      display: inline-block;
    }

    .root {
      background-color: var(--vscode-badge-background, #616161);
      border: 1px solid var(--vscode-contrastBorder, transparent);
      border-radius: 2px;
      box-sizing: border-box;
      color: var(--vscode-badge-foreground, #f8f8f8);
      display: block;
      font-family: var(--vscode-font-family, ${r(_t())});
      font-size: 11px;
      font-weight: 400;
      line-height: 14px;
      min-width: 18px;
      padding: 2px 3px;
      text-align: center;
      white-space: nowrap;
    }

    :host([variant='counter']) .root {
      border-radius: 11px;
      line-height: 11px;
      min-height: 18px;
      min-width: 18px;
      padding: 3px 6px;
    }

    :host([variant='activity-bar-counter']) .root {
      background-color: var(--vscode-activityBarBadge-background, #0078d4);
      border-radius: 20px;
      color: var(--vscode-activityBarBadge-foreground, #ffffff);
      font-size: 9px;
      font-weight: 600;
      line-height: 16px;
      padding: 0 4px;
    }

    :host([variant='tab-header-counter']) .root {
      background-color: var(--vscode-activityBarBadge-background, #0078d4);
      border-radius: 10px;
      color: var(--vscode-activityBarBadge-foreground, #ffffff);
      line-height: 10px;
      min-height: 16px;
      min-width: 16px;
      padding: 3px 5px;
    }
  `];var Bt=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Ct=class extends yt{constructor(){super(...arguments),this.variant="default"}render(){return U`<div class="root"><slot></slot></div>`}};Ct.styles=St,Bt([pt({reflect:!0})],Ct.prototype,"variant",void 0),Ct=Bt([kt("vscode-badge")],Ct);const Ot=1,At=2,zt=3,Et=t=>(...e)=>({_$litDirective$:t,values:e});let It=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};const jt=Et(class extends It{constructor(t){if(super(t),t.type!==Ot||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter((e=>t[e])).join(" ")+" "}update(t,[e]){if(void 0===this.st){this.st=new Set,void 0!==t.strings&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter((t=>""!==t))));for(const t in e)e[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(e)}const i=t.element.classList;for(const t of this.st)t in e||(i.remove(t),this.st.delete(t));for(const t in e){const s=!!e[t];s===this.st.has(t)||this.nt?.has(t)||(s?(i.add(t),this.st.add(t)):(i.remove(t),this.st.delete(t)))}return H}}),Mt=t=>t??q;const Pt=Et(class extends It{constructor(t){if(super(t),this._prevProperties={},t.type!==zt||"style"!==t.name)throw new Error("The `stylePropertyMap` directive must be used in the `style` property")}update(t,[e]){return Object.entries(e).forEach((([e,i])=>{this._prevProperties[e]!==i&&(e.startsWith("--")?t.element.style.setProperty(e,i):t.element.style[e]=i,this._prevProperties[e]=i)})),H}render(t){return H}}),Dt=[$t,n`
    :host {
      color: var(--vscode-icon-foreground, #cccccc);
      display: inline-block;
    }

    .codicon[class*='codicon-'] {
      display: block;
    }

    .icon,
    .button {
      background-color: transparent;
      display: block;
      padding: 0;
    }

    .button {
      border-color: transparent;
      border-style: solid;
      border-width: 1px;
      border-radius: 5px;
      color: currentColor;
      cursor: pointer;
      padding: 2px;
    }

    .button:hover {
      background-color: var(
        --vscode-toolbar-hoverBackground,
        rgba(90, 93, 94, 0.31)
      );
    }

    .button:active {
      background-color: var(
        --vscode-toolbar-activeBackground,
        rgba(99, 102, 103, 0.31)
      );
    }

    .button:focus {
      outline: none;
    }

    .button:focus-visible {
      border-color: var(--vscode-focusBorder, #0078d4);
    }

    @keyframes icon-spin {
      100% {
        transform: rotate(360deg);
      }
    }

    .spin {
      animation-name: icon-spin;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
  `];var Ft,Vt=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Tt=Ft=class extends yt{constructor(){super(...arguments),this.label="",this.name="",this.size=16,this.spin=!1,this.spinDuration=1.5,this.actionIcon=!1,this._onButtonClick=t=>{this.dispatchEvent(new CustomEvent("vsc-click",{detail:{originalEvent:t}}))}}connectedCallback(){super.connectedCallback();const{href:t,nonce:e}=this._getStylesheetConfig();Ft.stylesheetHref=t,Ft.nonce=e}_getStylesheetConfig(){const t=document.getElementById("vscode-codicon-stylesheet"),e=t?.getAttribute("href")||void 0,i=t?.nonce||void 0;if(!t){let t="[VSCode Elements] To use the Icon component, the codicons.css file must be included in the page with the id `vscode-codicon-stylesheet`! ";t+="See https://vscode-elements.github.io/components/icon/ for more details.",console.warn(t)}return{nonce:i,href:e}}render(){const{stylesheetHref:t,nonce:e}=Ft,i=U`<span
      class=${jt({codicon:!0,["codicon-"+this.name]:!0,spin:this.spin})}
      .style=${Pt({animationDuration:String(this.spinDuration)+"s",fontSize:this.size+"px",height:this.size+"px",width:this.size+"px"})}
    ></span>`,s=this.actionIcon?U` <button
          class="button"
          @click=${this._onButtonClick}
          aria-label=${this.label}
        >
          ${i}
        </button>`:U` <span class="icon" aria-hidden="true" role="presentation"
          >${i}</span
        >`;return U`
      <link
        rel="stylesheet"
        href=${Mt(t)}
        nonce=${Mt(e)}
      >
      ${s}
    `}};Tt.styles=Dt,Tt.stylesheetHref="",Tt.nonce="",Vt([pt()],Tt.prototype,"label",void 0),Vt([pt({type:String})],Tt.prototype,"name",void 0),Vt([pt({type:Number})],Tt.prototype,"size",void 0),Vt([pt({type:Boolean,reflect:!0})],Tt.prototype,"spin",void 0),Vt([pt({type:Number,attribute:"spin-duration"})],Tt.prototype,"spinDuration",void 0),Vt([pt({type:Boolean,reflect:!0,attribute:"action-icon"})],Tt.prototype,"actionIcon",void 0),Tt=Ft=Vt([kt("vscode-icon")],Tt);const Nt=[$t,n`
    :host {
      cursor: pointer;
      display: inline-block;
      width: auto;
    }

    .base {
      align-items: center;
      background-color: var(--vscode-button-background, #0078d4);
      border-bottom-left-radius: var(--vsc-border-left-radius, 2px);
      border-bottom-right-radius: var(--vsc-border-right-radius, 2px);
      border-bottom-width: 1px;
      border-color: var(--vscode-button-border, transparent);
      border-left-width: var(--vsc-border-left-width, 1px);
      border-right-width: var(--vsc-border-right-width, 1px);
      border-style: solid;
      border-top-left-radius: var(--vsc-border-left-radius, 2px);
      border-top-right-radius: var(--vsc-border-right-radius, 2px);
      border-top-width: 1px;
      box-sizing: border-box;
      color: var(--vscode-button-foreground, #ffffff);
      display: flex;
      font-family: var(--vscode-font-family, ${r(_t())});
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      height: 100%;
      justify-content: center;
      line-height: 22px;
      overflow: hidden;
      padding: 1px calc(13px + var(--vsc-base-additional-right-padding, 0px))
        1px 13px;
      position: relative;
      user-select: none;
      white-space: nowrap;
      width: 100%;
    }

    .base:after {
      background-color: var(
        --vscode-button-separator,
        rgba(255, 255, 255, 0.4)
      );
      content: var(--vsc-base-after-content);
      display: var(--vsc-divider-display, none);
      position: absolute;
      right: 0;
      top: 4px;
      bottom: 4px;
      width: 1px;
    }

    :host([secondary]) .base:after {
      background-color: var(--vscode-button-secondaryForeground, #cccccc);
      opacity: 0.4;
    }

    :host([secondary]) .base {
      color: var(--vscode-button-secondaryForeground, #cccccc);
      background-color: var(--vscode-button-secondaryBackground, #313131);
      border-color: var(
        --vscode-button-border,
        var(--vscode-button-secondaryBackground, rgba(255, 255, 255, 0.07))
      );
    }

    :host([disabled]) {
      cursor: default;
      opacity: 0.4;
      pointer-events: none;
    }

    :host(:hover) .base {
      background-color: var(--vscode-button-hoverBackground, #026ec1);
    }

    :host([disabled]:hover) .base {
      background-color: var(--vscode-button-background, #0078d4);
    }

    :host([secondary]:hover) .base {
      background-color: var(--vscode-button-secondaryHoverBackground, #3c3c3c);
    }

    :host([secondary][disabled]:hover) .base {
      background-color: var(--vscode-button-secondaryBackground, #313131);
    }

    :host(:focus),
    :host(:active) {
      outline: none;
    }

    :host(:focus) .base {
      background-color: var(--vscode-button-hoverBackground, #026ec1);
      outline: 1px solid var(--vscode-focusBorder, #0078d4);
      outline-offset: 2px;
    }

    :host([disabled]:focus) .base {
      background-color: var(--vscode-button-background, #0078d4);
      outline: 0;
    }

    :host([secondary]:focus) .base {
      background-color: var(--vscode-button-secondaryHoverBackground, #3c3c3c);
    }

    :host([secondary][disabled]:focus) .base {
      background-color: var(--vscode-button-secondaryBackground, #313131);
    }

    ::slotted(*) {
      display: inline-block;
      margin-left: 4px;
      margin-right: 4px;
    }

    ::slotted(*:first-child) {
      margin-left: 0;
    }

    ::slotted(*:last-child) {
      margin-right: 0;
    }

    ::slotted(vscode-icon) {
      color: inherit;
    }

    .content {
      display: flex;
      position: relative;
      width: 100%;
      height: 100%;
      padding: 1px 13px;
    }

    :host(:empty) .base,
    .base.icon-only {
      min-height: 24px;
      min-width: 26px;
      padding: 1px 4px;
    }

    slot {
      align-items: center;
      display: flex;
      height: 100%;
    }

    .has-content-before slot[name='content-before'] {
      margin-right: 4px;
    }

    .has-content-after slot[name='content-after'] {
      margin-left: 4px;
    }

    .icon,
    .icon-after {
      color: inherit;
      display: block;
    }

    :host(:not(:empty)) .icon {
      margin-right: 3px;
    }

    :host(:not(:empty)) .icon-after,
    :host([icon]) .icon-after {
      margin-left: 3px;
    }
  `];var Rt=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Lt=class extends yt{get form(){return this._internals.form}constructor(){super(),this.autofocus=!1,this.tabIndex=0,this.secondary=!1,this.role="button",this.disabled=!1,this.icon="",this.iconSpin=!1,this.iconAfter="",this.iconAfterSpin=!1,this.focused=!1,this.name=void 0,this.iconOnly=!1,this.type="button",this.value="",this._prevTabindex=0,this._hasContentBefore=!1,this._hasContentAfter=!1,this._handleFocus=()=>{this.focused=!0},this._handleBlur=()=>{this.focused=!1},this.addEventListener("keydown",this._handleKeyDown.bind(this)),this.addEventListener("click",this._handleClick.bind(this)),this._internals=this.attachInternals()}connectedCallback(){super.connectedCallback(),this.autofocus&&(this.tabIndex<0&&(this.tabIndex=0),this.updateComplete.then((()=>{this.focus(),this.requestUpdate()}))),this.addEventListener("focus",this._handleFocus),this.addEventListener("blur",this._handleBlur)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("focus",this._handleFocus),this.removeEventListener("blur",this._handleBlur)}update(t){super.update(t),t.has("value")&&this._internals.setFormValue(this.value),t.has("disabled")&&(this.disabled?(this._prevTabindex=this.tabIndex,this.tabIndex=-1):this.tabIndex=this._prevTabindex)}_executeAction(){"submit"===this.type&&this._internals.form&&this._internals.form.requestSubmit(),"reset"===this.type&&this._internals.form&&this._internals.form.reset()}_handleKeyDown(t){if(("Enter"===t.key||" "===t.key)&&!this.hasAttribute("disabled")){const t=new MouseEvent("click",{bubbles:!0,cancelable:!0});t.synthetic=!0,this.dispatchEvent(t),this._executeAction()}}_handleClick(t){t.synthetic||this.hasAttribute("disabled")||this._executeAction()}_handleSlotChange(t){const e=t.target;"content-before"===e.name&&(this._hasContentBefore=e.assignedElements().length>0),"content-after"===e.name&&(this._hasContentAfter=e.assignedElements().length>0)}render(){const t=""!==this.icon,e=""!==this.iconAfter,i={base:!0,"icon-only":this.iconOnly,"has-content-before":this._hasContentBefore,"has-content-after":this._hasContentAfter},s=t?U`<vscode-icon
          name=${this.icon}
          ?spin=${this.iconSpin}
          spin-duration=${Mt(this.iconSpinDuration)}
          class="icon"
        ></vscode-icon>`:q,o=e?U`<vscode-icon
          name=${this.iconAfter}
          ?spin=${this.iconAfterSpin}
          spin-duration=${Mt(this.iconAfterSpinDuration)}
          class="icon-after"
        ></vscode-icon>`:q;return U`
      <div
        class=${jt(i)}
        part="base"
        @slotchange=${this._handleSlotChange}
      >
        <slot name="content-before"></slot>
        ${s}
        <slot></slot>
        ${o}
        <slot name="content-after"></slot>
      </div>
    `}};Lt.styles=Nt,Lt.formAssociated=!0,Rt([pt({type:Boolean,reflect:!0})],Lt.prototype,"autofocus",void 0),Rt([pt({type:Number,reflect:!0})],Lt.prototype,"tabIndex",void 0),Rt([pt({type:Boolean,reflect:!0})],Lt.prototype,"secondary",void 0),Rt([pt({reflect:!0})],Lt.prototype,"role",void 0),Rt([pt({type:Boolean,reflect:!0})],Lt.prototype,"disabled",void 0),Rt([pt()],Lt.prototype,"icon",void 0),Rt([pt({type:Boolean,reflect:!0,attribute:"icon-spin"})],Lt.prototype,"iconSpin",void 0),Rt([pt({type:Number,reflect:!0,attribute:"icon-spin-duration"})],Lt.prototype,"iconSpinDuration",void 0),Rt([pt({attribute:"icon-after"})],Lt.prototype,"iconAfter",void 0),Rt([pt({type:Boolean,reflect:!0,attribute:"icon-after-spin"})],Lt.prototype,"iconAfterSpin",void 0),Rt([pt({type:Number,reflect:!0,attribute:"icon-after-spin-duration"})],Lt.prototype,"iconAfterSpinDuration",void 0),Rt([pt({type:Boolean,reflect:!0})],Lt.prototype,"focused",void 0),Rt([pt({type:String,reflect:!0})],Lt.prototype,"name",void 0),Rt([pt({type:Boolean,reflect:!0,attribute:"icon-only"})],Lt.prototype,"iconOnly",void 0),Rt([pt({reflect:!0})],Lt.prototype,"type",void 0),Rt([pt()],Lt.prototype,"value",void 0),Rt([vt()],Lt.prototype,"_hasContentBefore",void 0),Rt([vt()],Lt.prototype,"_hasContentAfter",void 0),Lt=Rt([kt("vscode-button")],Lt);const Ut=[$t,n`
    :host {
      display: inline-block;
    }

    .root {
      align-items: stretch;
      display: flex;
      width: 100%;
    }

    ::slotted(vscode-button:not(:first-child)) {
      --vsc-border-left-width: 0;
      --vsc-border-left-radius: 0;
      --vsc-border-left-width: 0;
    }

    ::slotted(vscode-button:not(:last-child)) {
      --vsc-divider-display: block;
      --vsc-base-additional-right-padding: 1px;
      --vsc-base-after-content: '';
      --vsc-border-right-width: 0;
      --vsc-border-right-radius: 0;
      --vsc-border-right-width: 0;
    }

    ::slotted(vscode-button:focus) {
      z-index: 1;
    }

    ::slotted(vscode-button:not(:empty)) {
      width: 100%;
    }
  `];var Gt=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Ht=class extends yt{render(){return U`<div class="root"><slot></slot></div>`}};Ht.styles=Ut,Ht=Gt([kt("vscode-button-group")],Ht);var qt=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};class Wt extends yt{constructor(){super(),this.focused=!1,this._prevTabindex=0,this._handleFocus=()=>{this.focused=!0},this._handleBlur=()=>{this.focused=!1}}connectedCallback(){super.connectedCallback(),this.addEventListener("focus",this._handleFocus),this.addEventListener("blur",this._handleBlur)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("focus",this._handleFocus),this.removeEventListener("blur",this._handleBlur)}attributeChangedCallback(t,e,i){super.attributeChangedCallback(t,e,i),"disabled"===t&&this.hasAttribute("disabled")?(this._prevTabindex=this.tabIndex,this.tabIndex=-1):"disabled"!==t||this.hasAttribute("disabled")||(this.tabIndex=this._prevTabindex)}}qt([pt({type:Boolean,reflect:!0})],Wt.prototype,"focused",void 0);var Kt=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};const Xt=t=>{class e extends t{constructor(){super(...arguments),this._label="",this._slottedText=""}set label(t){this._label=t,""===this._slottedText&&this.setAttribute("aria-label",t)}get label(){return this._label}_handleSlotChange(){this._slottedText=this.textContent?this.textContent.trim():"",""!==this._slottedText&&this.setAttribute("aria-label",this._slottedText)}_renderLabelAttribute(){return""===this._slottedText?U`<span class="label-attr">${this._label}</span>`:U`${q}`}}return Kt([pt()],e.prototype,"label",null),e};var Jt=[n`
    :host {
      display: inline-block;
    }

    :host(:focus) {
      outline: none;
    }

    :host([disabled]) {
      opacity: 0.4;
    }

    .wrapper {
      color: var(--vscode-foreground, #cccccc);
      cursor: pointer;
      display: block;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 18px;
      margin-bottom: 4px;
      margin-top: 4px;
      min-height: 18px;
      position: relative;
      user-select: none;
    }

    :host([disabled]) .wrapper {
      cursor: default;
    }

    input {
      clip: rect(1px, 1px, 1px, 1px);
      height: 1px;
      left: 9px;
      margin: 0;
      overflow: hidden;
      position: absolute;
      top: 17px;
      white-space: nowrap;
      width: 1px;
    }

    .icon {
      align-items: center;
      background-color: var(--vscode-settings-checkboxBackground, #313131);
      background-size: 16px;
      border: 1px solid var(--vscode-settings-checkboxBorder, #3c3c3c);
      box-sizing: border-box;
      color: var(--vscode-settings-checkboxForeground, #cccccc);
      display: flex;
      height: 18px;
      justify-content: center;
      left: 0;
      margin-left: 0;
      margin-right: 9px;
      padding: 0;
      pointer-events: none;
      position: absolute;
      top: 0;
      width: 18px;
    }

    .icon.before-empty-label {
      margin-right: 0;
    }

    .label {
      cursor: pointer;
      display: block;
      min-height: 18px;
      min-width: 18px;
    }

    .label-inner {
      display: block;
      opacity: 0.9;
      padding-left: 27px;
    }

    .label-inner.empty {
      padding-left: 0;
    }

    :host([disabled]) .label {
      cursor: default;
    }
  `];const Yt=[$t,Jt,n`
    :host(:invalid) .icon,
    :host([invalid]) .icon {
      background-color: var(--vscode-inputValidation-errorBackground, #5a1d1d);
      border-color: var(--vscode-inputValidation-errorBorder, #be1100);
    }

    .icon {
      border-radius: 3px;
    }

    .indeterminate-icon {
      background-color: currentColor;
      position: absolute;
      height: 1px;
      width: 12px;
    }

    :host(:focus):host(:not([disabled])) .icon {
      outline: 1px solid var(--vscode-focusBorder, #0078d4);
      outline-offset: -1px;
    }

    /* Toggle appearance */
    :host([toggle]) .icon {
      /* Track */
      width: 36px;
      height: 20px;
      border-radius: 999px;
      background-color: var(--vscode-button-secondaryBackground, #313131);
      border-color: var(--vscode-button-border, transparent);
      justify-content: flex-start;
      position: absolute;
    }

    :host(:focus):host([toggle]):host(:not([disabled])) .icon {
      outline-offset: 2px;
    }

    /* Reserve space for the wider toggle track so text doesn't overlap */
    :host([toggle]) .label-inner {
      padding-left: 45px; /* 36px track + 9px spacing */
    }

    :host([toggle]) .label {
      min-height: 20px;
    }

    :host([toggle]) .wrapper {
      min-height: 20px;
      line-height: 20px;
    }

    :host([toggle]) .thumb {
      /* Thumb */
      box-sizing: border-box;
      display: block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: var(--vscode-button-secondaryForeground, #cccccc);
      margin-left: 1px;
      transition: transform 120ms ease-in-out;
    }

    :host([toggle][checked]) .icon {
      background-color: var(--vscode-button-background, #04395e);
      border-color: var(--vscode-button-border, transparent);
    }

    :host([toggle][checked]) .thumb {
      transform: translateX(16px);
      background-color: var(--vscode-button-foreground, #ffffff);
    }

    :host([toggle]):host(:invalid) .icon {
      background-color: var(--vscode-inputValidation-errorBackground, #5a1d1d);
      border-color: var(--vscode-inputValidation-errorBorder, #be1100);
    }

    :host([toggle]):host(:invalid) .thumb {
      background-color: var(--vscode-inputValidation-errorBorder, #be1100);
    }

    :host([toggle]) .check-icon,
    :host([toggle]) .indeterminate-icon {
      display: none;
    }

    :host([toggle]:focus):host(:not([disabled])) .icon {
      outline: 1px solid var(--vscode-focusBorder, #0078d4);
      outline-offset: -1px;
    }
  `];var Zt=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Qt=class extends(Xt(Wt)){set checked(t){this._checked=t,this._manageRequired(),this.requestUpdate()}get checked(){return this._checked}set required(t){this._required=t,this._manageRequired(),this.requestUpdate()}get required(){return this._required}get form(){return this._internals.form}get validity(){return this._internals.validity}get validationMessage(){return this._internals.validationMessage}get willValidate(){return this._internals.willValidate}checkValidity(){return this._internals.checkValidity()}reportValidity(){return this._internals.reportValidity()}constructor(){super(),this.autofocus=!1,this._checked=!1,this.defaultChecked=!1,this.invalid=!1,this.name=void 0,this.toggle=!1,this.value="",this.disabled=!1,this.indeterminate=!1,this._required=!1,this.type="checkbox",this._handleClick=t=>{t.preventDefault(),this.disabled||this._toggleState()},this._handleKeyDown=t=>{this.disabled||"Enter"!==t.key&&" "!==t.key||(t.preventDefault()," "===t.key&&this._toggleState(),"Enter"===t.key&&this._internals.form?.requestSubmit())},this._internals=this.attachInternals()}connectedCallback(){super.connectedCallback(),this.addEventListener("keydown",this._handleKeyDown),this.updateComplete.then((()=>{this._manageRequired(),this._setActualFormValue()}))}disconnectedCallback(){this.removeEventListener("keydown",this._handleKeyDown)}formResetCallback(){this.checked=this.defaultChecked}formStateRestoreCallback(t,e){t&&(this.checked=!0)}_setActualFormValue(){let t="";t=this.checked?this.value?this.value:"on":null,this._internals.setFormValue(t)}_toggleState(){this.checked=!this.checked,this.indeterminate=!1,this._setActualFormValue(),this._manageRequired(),this.dispatchEvent(new Event("change",{bubbles:!0}))}_manageRequired(){!this.checked&&this.required?this._internals.setValidity({valueMissing:!0},"Please check this box if you want to proceed.",this._inputEl??void 0):this._internals.setValidity({})}render(){const t=jt({icon:!0,checked:this.checked,indeterminate:this.indeterminate}),e=jt({"label-inner":!0}),i=U`<svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      class="check-icon"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z"
      />
    </svg>`,s=this.checked&&!this.indeterminate?i:q,o=this.indeterminate?U`<span class="indeterminate-icon"></span>`:q,r=this.toggle?U`<span class="thumb"></span>`:U`${o}${s}`;return U`
      <div class="wrapper">
        <input
          ?autofocus=${this.autofocus}
          id="input"
          class="checkbox"
          type="checkbox"
          ?checked=${this.checked}
          role=${Mt(this.toggle?"switch":void 0)}
          aria-checked=${Mt(this.toggle?this.checked?"true":"false":void 0)}
          value=${this.value}
        >
        <div class=${t}>${r}</div>
        <label for="input" class="label" @click=${this._handleClick}>
          <span class=${e}>
            ${this._renderLabelAttribute()}
            <slot @slotchange=${this._handleSlotChange}></slot>
          </span>
        </label>
      </div>
    `}};Qt.styles=Yt,Qt.formAssociated=!0,Qt.shadowRootOptions={...ht.shadowRootOptions,delegatesFocus:!0},Zt([pt({type:Boolean,reflect:!0})],Qt.prototype,"autofocus",void 0),Zt([pt({type:Boolean,reflect:!0})],Qt.prototype,"checked",null),Zt([pt({type:Boolean,reflect:!0,attribute:"default-checked"})],Qt.prototype,"defaultChecked",void 0),Zt([pt({type:Boolean,reflect:!0})],Qt.prototype,"invalid",void 0),Zt([pt({reflect:!0})],Qt.prototype,"name",void 0),Zt([pt({type:Boolean,reflect:!0})],Qt.prototype,"toggle",void 0),Zt([pt()],Qt.prototype,"value",void 0),Zt([pt({type:Boolean,reflect:!0})],Qt.prototype,"disabled",void 0),Zt([pt({type:Boolean,reflect:!0})],Qt.prototype,"indeterminate",void 0),Zt([pt({type:Boolean,reflect:!0})],Qt.prototype,"required",null),Zt([pt()],Qt.prototype,"type",void 0),Zt([ft("#input")],Qt.prototype,"_inputEl",void 0),Qt=Zt([kt("vscode-checkbox")],Qt);const te=[$t,n`
    :host {
      display: block;
    }

    .wrapper {
      display: flex;
      flex-wrap: wrap;
    }

    :host([variant='vertical']) .wrapper {
      display: block;
    }

    ::slotted(vscode-checkbox) {
      margin-right: 20px;
    }

    ::slotted(vscode-checkbox:last-child) {
      margin-right: 0;
    }

    :host([variant='vertical']) ::slotted(vscode-checkbox) {
      display: block;
      margin-bottom: 15px;
    }

    :host([variant='vertical']) ::slotted(vscode-checkbox:last-child) {
      margin-bottom: 0;
    }
  `];var ee=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let ie=class extends yt{constructor(){super(...arguments),this.role="group",this.variant="horizontal"}render(){return U`
      <div class="wrapper">
        <slot></slot>
      </div>
    `}};ie.styles=te,ee([pt({reflect:!0})],ie.prototype,"role",void 0),ee([pt({reflect:!0})],ie.prototype,"variant",void 0),ie=ee([kt("vscode-checkbox-group")],ie);const se=[$t,n`
    .collapsible {
      background-color: var(--vscode-sideBar-background, #181818);
    }

    .collapsible-header {
      align-items: center;
      background-color: var(--vscode-sideBarSectionHeader-background, #181818);
      cursor: pointer;
      display: flex;
      height: 22px;
      line-height: 22px;
      user-select: none;
    }

    .collapsible-header:focus {
      opacity: 1;
      outline-offset: -1px;
      outline-style: solid;
      outline-width: 1px;
      outline-color: var(--vscode-focusBorder, #0078d4);
    }

    .title {
      color: var(--vscode-sideBarTitle-foreground, #cccccc);
      display: block;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: 11px;
      font-weight: 700;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .title .description {
      font-weight: 400;
      margin-left: 10px;
      text-transform: none;
      opacity: 0.6;
    }

    .header-icon {
      color: var(--vscode-icon-foreground, #cccccc);
      display: block;
      flex-shrink: 0;
      margin: 0 3px;
    }

    .collapsible.open .header-icon {
      transform: rotate(90deg);
    }

    .header-slots {
      align-items: center;
      display: flex;
      height: 22px;
      margin-left: auto;
      margin-right: 4px;
    }

    .actions {
      display: none;
    }

    .collapsible.open .actions.always-visible,
    .collapsible.open:hover .actions {
      display: block;
    }

    .header-slots slot {
      display: flex;
      max-height: 22px;
      overflow: hidden;
    }

    .header-slots slot::slotted(div) {
      align-items: center;
      display: flex;
    }

    .collapsible-body {
      display: none;
      overflow: hidden;
    }

    .collapsible.open .collapsible-body {
      display: block;
    }
  `];var oe=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let re=class extends yt{constructor(){super(...arguments),this.alwaysShowHeaderActions=!1,this.title="",this.heading="",this.description="",this.open=!1}_emitToggleEvent(){this.dispatchEvent(new CustomEvent("vsc-collapsible-toggle",{detail:{open:this.open}}))}_onHeaderClick(){this.open=!this.open,this._emitToggleEvent()}_onHeaderKeyDown(t){"Enter"===t.key&&(this.open=!this.open,this._emitToggleEvent())}render(){const t={collapsible:!0,open:this.open},e={actions:!0,"always-visible":this.alwaysShowHeaderActions},i=this.heading?this.heading:this.title,s=U`<svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      class="header-icon"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"
      />
    </svg>`,o=this.description?U`<span class="description">${this.description}</span>`:q;return U`
      <div class=${jt(t)}>
        <div
          class="collapsible-header"
          tabindex="0"
          @click=${this._onHeaderClick}
          @keydown=${this._onHeaderKeyDown}
        >
          ${s}
          <h3 class="title">${i}${o}</h3>
          <div class="header-slots">
            <div class=${jt(e)}>
              <slot name="actions"></slot>
            </div>
            <div class="decorations"><slot name="decorations"></slot></div>
          </div>
        </div>
        <div class="collapsible-body" part="body">
          <slot></slot>
        </div>
      </div>
    `}};re.styles=se,oe([pt({type:Boolean,reflect:!0,attribute:"always-show-header-actions"})],re.prototype,"alwaysShowHeaderActions",void 0),oe([pt({type:String})],re.prototype,"title",void 0),oe([pt()],re.prototype,"heading",void 0),oe([pt()],re.prototype,"description",void 0),oe([pt({type:Boolean,reflect:!0})],re.prototype,"open",void 0),re=oe([kt("vscode-collapsible")],re);const ne=[$t,n`
    :host {
      display: block;
      outline: none;
      position: relative;
    }

    .context-menu-item {
      background-color: var(--vscode-menu-background, #1f1f1f);
      color: var(--vscode-menu-foreground, #cccccc);
      display: flex;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 1.4em;
      user-select: none;
      white-space: nowrap;
    }

    .ruler {
      border-bottom: 1px solid var(--vscode-menu-separatorBackground, #454545);
      display: block;
      margin: 0 0 4px;
      padding-top: 4px;
      width: 100%;
    }

    .context-menu-item a {
      align-items: center;
      border-color: transparent;
      border-radius: 3px;
      border-style: solid;
      border-width: 1px;
      box-sizing: border-box;
      color: var(--vscode-menu-foreground, #cccccc);
      cursor: pointer;
      display: flex;
      flex: 1 1 auto;
      height: 2em;
      margin-left: 4px;
      margin-right: 4px;
      outline: none;
      position: relative;
      text-decoration: inherit;
    }

    :host([selected]) .context-menu-item a {
      background-color: var(--vscode-menu-selectionBackground, #0078d4);
      border-color: var(--vscode-menu-selectionBorder, transparent);
      color: var(--vscode-menu-selectionForeground, #ffffff);
    }

    .label {
      background: none;
      display: flex;
      flex: 1 1 auto;
      font-size: 12px;
      line-height: 1;
      padding: 0 22px;
      text-decoration: none;
    }

    .keybinding {
      display: block;
      flex: 2 1 auto;
      line-height: 1;
      padding: 0 22px;
      text-align: right;
    }
  `];var le=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let ae=class extends yt{constructor(){super(...arguments),this.label="",this.keybinding="",this.value="",this.separator=!1,this.tabindex=0}onItemClick(){this.dispatchEvent(new CustomEvent("vsc-click",{detail:{label:this.label,keybinding:this.keybinding,value:this.value||this.label,separator:this.separator,tabindex:this.tabindex},bubbles:!0,composed:!0}))}render(){return U`
      ${this.separator?U`
            <div class="context-menu-item separator">
              <span class="ruler"></span>
            </div>
          `:U`
            <div class="context-menu-item">
              <a @click=${this.onItemClick}>
                ${this.label?U`<span class="label">${this.label}</span>`:q}
                ${this.keybinding?U`<span class="keybinding">${this.keybinding}</span>`:q}
              </a>
            </div>
          `}
    `}};ae.styles=ne,le([pt({type:String})],ae.prototype,"label",void 0),le([pt({type:String})],ae.prototype,"keybinding",void 0),le([pt({type:String})],ae.prototype,"value",void 0),le([pt({type:Boolean,reflect:!0})],ae.prototype,"separator",void 0),le([pt({type:Number})],ae.prototype,"tabindex",void 0),ae=le([kt("vscode-context-menu-item")],ae);const he=[$t,n`
    :host {
      display: block;
      position: relative;
    }

    .context-menu {
      background-color: var(--vscode-menu-background, #1f1f1f);
      border-color: var(--vscode-menu-border, #454545);
      border-radius: 5px;
      border-style: solid;
      border-width: 1px;
      box-shadow: 0 2px 8px var(--vscode-widget-shadow, rgba(0, 0, 0, 0.36));
      color: var(--vscode-menu-foreground, #cccccc);
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 1.4em;
      padding: 4px 0;
      white-space: nowrap;
    }

    .context-menu:focus {
      outline: 0;
    }
  `];var ce=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let de=class extends yt{set data(t){this._data=t;const e=[];t.forEach(((t,i)=>{t.separator||e.push(i)})),this._clickableItemIndexes=e}get data(){return this._data}set show(t){this._show=t,this._selectedClickableItemIndex=-1,t&&this.updateComplete.then((()=>{this._wrapperEl&&this._wrapperEl.focus(),requestAnimationFrame((()=>{document.addEventListener("click",this._onClickOutsideBound,{once:!0})}))}))}get show(){return this._show}constructor(){super(),this.preventClose=!1,this.tabIndex=0,this._selectedClickableItemIndex=-1,this._show=!1,this._data=[],this._clickableItemIndexes=[],this._onClickOutsideBound=this._onClickOutside.bind(this),this.addEventListener("keydown",this._onKeyDown)}_onClickOutside(t){t.composedPath().includes(this)||(this.show=!1)}_onKeyDown(t){const{key:e}=t;switch("ArrowUp"!==e&&"ArrowDown"!==e&&"Escape"!==e&&"Enter"!==e||t.preventDefault(),e){case"ArrowUp":this._handleArrowUp();break;case"ArrowDown":this._handleArrowDown();break;case"Escape":this._handleEscape();break;case"Enter":this._handleEnter()}}_handleArrowUp(){0===this._selectedClickableItemIndex?this._selectedClickableItemIndex=this._clickableItemIndexes.length-1:this._selectedClickableItemIndex-=1}_handleArrowDown(){this._selectedClickableItemIndex+1<this._clickableItemIndexes.length?this._selectedClickableItemIndex+=1:this._selectedClickableItemIndex=0}_handleEscape(){this.show=!1,document.removeEventListener("click",this._onClickOutsideBound)}_dispatchSelectEvent(t){const{keybinding:e,label:i,value:s,separator:o,tabindex:r}=t;this.dispatchEvent(new CustomEvent("vsc-context-menu-select",{detail:{keybinding:e,label:i,separator:o,tabindex:r,value:s}}))}_handleEnter(){if(-1===this._selectedClickableItemIndex)return;const t=this._clickableItemIndexes[this._selectedClickableItemIndex],e=this._wrapperEl.querySelectorAll("vscode-context-menu-item")[t];this._dispatchSelectEvent(e),this.preventClose||(this.show=!1,document.removeEventListener("click",this._onClickOutsideBound))}_onItemClick(t){const e=t.currentTarget;this._dispatchSelectEvent(e),this.preventClose||(this.show=!1)}_onItemMouseOver(t){const e=t.target,i=e.dataset.index?+e.dataset.index:-1,s=this._clickableItemIndexes.findIndex((t=>t===i));-1!==s&&(this._selectedClickableItemIndex=s)}_onItemMouseOut(){this._selectedClickableItemIndex=-1}render(){if(!this._show)return U`${q}`;const t=this._clickableItemIndexes[this._selectedClickableItemIndex];return U`
      <div class="context-menu" tabindex="0">
        ${this.data?this.data.map((({label:e="",keybinding:i="",value:s="",separator:o=!1,tabindex:r=0},n)=>U`
                <vscode-context-menu-item
                  label=${e}
                  keybinding=${i}
                  value=${s}
                  ?separator=${o}
                  ?selected=${n===t}
                  tabindex=${r}
                  @vsc-click=${this._onItemClick}
                  @mouseover=${this._onItemMouseOver}
                  @mouseout=${this._onItemMouseOut}
                  data-index=${n}
                ></vscode-context-menu-item>
              `)):U`<slot></slot>`}
      </div>
    `}};de.styles=he,ce([pt({type:Array,attribute:!1})],de.prototype,"data",null),ce([pt({type:Boolean,reflect:!0,attribute:"prevent-close"})],de.prototype,"preventClose",void 0),ce([pt({type:Boolean,reflect:!0})],de.prototype,"show",null),ce([pt({type:Number,reflect:!0})],de.prototype,"tabIndex",void 0),ce([vt()],de.prototype,"_selectedClickableItemIndex",void 0),ce([vt()],de.prototype,"_show",void 0),ce([ft(".context-menu")],de.prototype,"_wrapperEl",void 0),de=ce([kt("vscode-context-menu")],de);const ue=[$t,n`
    :host {
      display: block;
      margin-bottom: 10px;
      margin-top: 10px;
    }

    div {
      background-color: var(--vscode-foreground, #cccccc);
      height: 1px;
      opacity: 0.4;
    }
  `];var pe=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let ve=class extends yt{constructor(){super(...arguments),this.role="separator"}render(){return U`<div></div>`}};ve.styles=ue,pe([pt({reflect:!0})],ve.prototype,"role",void 0),ve=pe([kt("vscode-divider")],ve);const be=[$t,n`
    :host {
      display: block;
      max-width: 727px;
    }
  `];var fe,ge=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};!function(t){t.HORIZONTAL="horizontal",t.VERTICAL="vertical"}(fe||(fe={}));let me=class extends yt{constructor(){super(...arguments),this.breakpoint=490,this._responsive=!1,this._firstUpdateComplete=!1,this._resizeObserverCallbackBound=this._resizeObserverCallback.bind(this)}set responsive(t){this._responsive=t,this._firstUpdateComplete&&(t?this._activateResponsiveLayout():this._deactivateResizeObserver())}get responsive(){return this._responsive}_toggleCompactLayout(t){this._assignedFormGroups.forEach((e=>{e.dataset.originalVariant||(e.dataset.originalVariant=e.variant);const i=e.dataset.originalVariant;t===fe.VERTICAL&&"horizontal"===i?e.variant="vertical":e.variant=i;e.querySelectorAll("vscode-checkbox-group, vscode-radio-group").forEach((e=>{e.dataset.originalVariant||(e.dataset.originalVariant=e.variant);const i=e.dataset.originalVariant;t===fe.HORIZONTAL&&i===fe.HORIZONTAL?e.variant="horizontal":e.variant="vertical"}))}))}_resizeObserverCallback(t){let e=0;for(const i of t)e=i.contentRect.width;const i=e<this.breakpoint?fe.VERTICAL:fe.HORIZONTAL;i!==this._currentFormGroupLayout&&(this._toggleCompactLayout(i),this._currentFormGroupLayout=i)}_activateResponsiveLayout(){this._resizeObserver=new ResizeObserver(this._resizeObserverCallbackBound),this._resizeObserver.observe(this._wrapperElement)}_deactivateResizeObserver(){this._resizeObserver?.disconnect(),this._resizeObserver=null}firstUpdated(){this._firstUpdateComplete=!0,this._responsive&&this._activateResponsiveLayout()}render(){return U`
      <div class="wrapper">
        <slot></slot>
      </div>
    `}};me.styles=be,ge([pt({type:Boolean,reflect:!0})],me.prototype,"responsive",null),ge([pt({type:Number})],me.prototype,"breakpoint",void 0),ge([ft(".wrapper")],me.prototype,"_wrapperElement",void 0),ge([mt({selector:"vscode-form-group"})],me.prototype,"_assignedFormGroups",void 0),me=ge([kt("vscode-form-container")],me);const xe=[$t,n`
    :host {
      --label-right-margin: 14px;
      --label-width: 150px;

      display: block;
      margin: 15px 0;
    }

    :host([variant='settings-group']) {
      margin: 0;
      padding: 12px 14px 18px;
      max-width: 727px;
    }

    .wrapper {
      display: flex;
      flex-wrap: wrap;
    }

    :host([variant='vertical']) .wrapper,
    :host([variant='settings-group']) .wrapper {
      display: block;
    }

    :host([variant='horizontal']) ::slotted(vscode-checkbox-group),
    :host([variant='horizontal']) ::slotted(vscode-radio-group) {
      width: calc(100% - calc(var(--label-width) + var(--label-right-margin)));
    }

    :host([variant='horizontal']) ::slotted(vscode-label) {
      margin-right: var(--label-right-margin);
      text-align: right;
      width: var(--label-width);
    }

    :host([variant='settings-group']) ::slotted(vscode-label) {
      height: 18px;
      line-height: 18px;
      margin-bottom: 4px;
      margin-right: 0;
      padding: 0;
    }

    ::slotted(vscode-form-helper) {
      margin-left: calc(var(--label-width) + var(--label-right-margin));
    }

    :host([variant='vertical']) ::slotted(vscode-form-helper),
    :host([variant='settings-group']) ::slotted(vscode-form-helper) {
      display: block;
      margin-left: 0;
    }

    :host([variant='settings-group']) ::slotted(vscode-form-helper) {
      margin-bottom: 0;
      margin-top: 0;
    }

    :host([variant='vertical']) ::slotted(vscode-label),
    :host([variant='settings-group']) ::slotted(vscode-label) {
      display: block;
      margin-left: 0;
      text-align: left;
    }

    :host([variant='settings-group']) ::slotted(vscode-inputbox),
    :host([variant='settings-group']) ::slotted(vscode-textfield),
    :host([variant='settings-group']) ::slotted(vscode-textarea),
    :host([variant='settings-group']) ::slotted(vscode-single-select),
    :host([variant='settings-group']) ::slotted(vscode-multi-select) {
      margin-top: 9px;
    }

    ::slotted(vscode-button:first-child) {
      margin-left: calc(var(--label-width) + var(--label-right-margin));
    }

    :host([variant='vertical']) ::slotted(vscode-button) {
      margin-left: 0;
    }

    ::slotted(vscode-button) {
      margin-right: 4px;
    }
  `];var we=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let ye=class extends yt{constructor(){super(...arguments),this.variant="horizontal"}render(){return U`
      <div class="wrapper">
        <slot></slot>
      </div>
    `}};ye.styles=xe,we([pt({reflect:!0})],ye.prototype,"variant",void 0),ye=we([kt("vscode-form-group")],ye);const ke=[$t,n`
    :host {
      display: block;
      line-height: 1.4em;
      margin-bottom: 4px;
      margin-top: 4px;
      max-width: 720px;
      opacity: 0.9;
    }

    :host([vertical]) {
      margin-left: 0;
    }
  `];var $e=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};const _e=new CSSStyleSheet;_e.replaceSync("\n  vscode-form-helper * {\n    margin: 0;\n  }\n\n  vscode-form-helper *:not(:last-child) {\n    margin-bottom: 8px;\n  }\n");let Se=class extends yt{constructor(){super(),this._injectLightDOMStyles()}_injectLightDOMStyles(){const t=document.adoptedStyleSheets.find((t=>t===_e));t||document.adoptedStyleSheets.push(_e)}render(){return U`<slot></slot>`}};Se.styles=ke,Se=$e([kt("vscode-form-helper")],Se);let Be=0;const Ce=(t="")=>(Be++,`${t}${Be}`),Oe=[$t,n`
    :host {
      display: block;
    }

    .wrapper {
      color: var(--vscode-foreground, #cccccc);
      cursor: default;
      display: block;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: 600;
      line-height: ${1.2307692307692308};
      padding: 5px 0;
    }

    .wrapper.required:after {
      content: ' *';
    }

    ::slotted(.normal) {
      font-weight: normal;
    }

    ::slotted(.lightened) {
      color: var(--vscode-foreground, #cccccc);
      opacity: 0.9;
    }
  `];var Ae=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let ze=class extends yt{constructor(){super(...arguments),this.required=!1,this._id="",this._htmlFor="",this._connected=!1}set htmlFor(t){this._htmlFor=t,this.setAttribute("for",t),this._connected&&this._connectWithTarget()}get htmlFor(){return this._htmlFor}set id(t){this._id=t}get id(){return this._id}attributeChangedCallback(t,e,i){super.attributeChangedCallback(t,e,i)}connectedCallback(){super.connectedCallback(),this._connected=!0,""===this._id&&(this._id=Ce("vscode-label-"),this.setAttribute("id",this._id)),this._connectWithTarget()}_getTarget(){let t=null;if(this._htmlFor){const e=this.getRootNode({composed:!1});e&&(t=e.querySelector(`#${this._htmlFor}`))}return t}async _connectWithTarget(){await this.updateComplete;const t=this._getTarget();["vscode-radio-group","vscode-checkbox-group"].includes(t?.tagName.toLowerCase()??"")&&t.setAttribute("aria-labelledby",this._id);let e="";this.textContent&&(e=this.textContent.trim()),t&&"label"in t&&["vscode-textfield","vscode-textarea","vscode-single-select","vscode-multi-select"].includes(t?.tagName.toLowerCase()??"")&&(t.label=e)}_handleClick(){const t=this._getTarget();t&&"focus"in t&&t.focus()}render(){return U`
      <label
        class=${jt({wrapper:!0,required:this.required})}
        @click=${this._handleClick}
        ><slot></slot
      ></label>
    `}};ze.styles=Oe,Ae([pt({reflect:!0,attribute:"for"})],ze.prototype,"htmlFor",null),Ae([pt()],ze.prototype,"id",null),Ae([pt({type:Boolean,reflect:!0})],ze.prototype,"required",void 0),ze=Ae([kt("vscode-label")],ze);const Ee=U`
  <span class="icon">
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z"
      />
    </svg>
  </span>
`,Ie=G`<svg
  width="16"
  height="16"
  viewBox="0 0 16 16"
  xmlns="http://www.w3.org/2000/svg"
  fill="currentColor"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z"
  />
</svg>`,{I:je}=rt,Me=()=>document.createComment(""),Pe=(t,e,i)=>{const s=t._$AA.parentNode,o=void 0===e?t._$AB:e._$AA;if(void 0===i){const e=s.insertBefore(Me(),o),r=s.insertBefore(Me(),o);i=new je(e,r,t,t.options)}else{const e=i._$AB.nextSibling,r=i._$AM,n=r!==t;if(n){let e;i._$AQ?.(t),i._$AM=t,void 0!==i._$AP&&(e=t._$AU)!==r._$AU&&i._$AP(e)}if(e!==o||n){let t=i._$AA;for(;t!==e;){const e=t.nextSibling;s.insertBefore(t,o),t=e}}}return i},De=(t,e,i=t)=>(t._$AI(e,i),t),Fe={},Ve=t=>{t._$AP?.(!1,!0);let e=t._$AA;const i=t._$AB.nextSibling;for(;e!==i;){const t=e.nextSibling;e.remove(),e=t}},Te=(t,e,i)=>{const s=new Map;for(let o=e;o<=i;o++)s.set(t[o],o);return s},Ne=Et(class extends It{constructor(t){if(super(t),t.type!==At)throw Error("repeat() can only be used in text expressions")}dt(t,e,i){let s;void 0===i?i=e:void 0!==e&&(s=e);const o=[],r=[];let n=0;for(const e of t)o[n]=s?s(e,n):n,r[n]=i(e,n),n++;return{values:r,keys:o}}render(t,e,i){return this.dt(t,e,i).values}update(t,[e,i,s]){const o=(t=>t._$AH)(t),{values:r,keys:n}=this.dt(e,i,s);if(!Array.isArray(o))return this.ut=n,r;const l=this.ut??=[],a=[];let h,c,d=0,u=o.length-1,p=0,v=r.length-1;for(;d<=u&&p<=v;)if(null===o[d])d++;else if(null===o[u])u--;else if(l[d]===n[p])a[p]=De(o[d],r[p]),d++,p++;else if(l[u]===n[v])a[v]=De(o[u],r[v]),u--,v--;else if(l[d]===n[v])a[v]=De(o[d],r[v]),Pe(t,a[v+1],o[d]),d++,v--;else if(l[u]===n[p])a[p]=De(o[u],r[p]),Pe(t,o[d],o[u]),u--,p++;else if(void 0===h&&(h=Te(n,p,v),c=Te(l,d,u)),h.has(l[d]))if(h.has(l[u])){const e=c.get(n[p]),i=void 0!==e?o[e]:null;if(null===i){const e=Pe(t,o[d]);De(e,r[p]),a[p]=e}else a[p]=De(i,r[p]),Pe(t,o[d],i),o[e]=null;p++}else Ve(o[u]),u--;else Ve(o[d]),d++;for(;p<=v;){const e=Pe(t,a[v+1]);De(e,r[p]),a[p++]=e}for(;d<=u;){const t=o[d++];null!==t&&Ve(t)}return this.ut=n,((t,e=Fe)=>{t._$AH=e})(t,a),H}});var Re=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Le=class extends yt{constructor(){super(...arguments),this.description="",this.selected=!1,this.disabled=!1,this._initialized=!1,this._handleSlotChange=()=>{this._initialized&&this.dispatchEvent(new Event("vsc-option-state-change",{bubbles:!0}))}}connectedCallback(){super.connectedCallback(),this.updateComplete.then((()=>{this._initialized=!0}))}willUpdate(t){this._initialized&&(t.has("description")||t.has("value")||t.has("selected")||t.has("disabled"))&&this.dispatchEvent(new Event("vsc-option-state-change",{bubbles:!0}))}render(){return U`<slot @slotchange=${this._handleSlotChange}></slot>`}};Le.styles=$t,Re([pt({type:String})],Le.prototype,"value",void 0),Re([pt({type:String})],Le.prototype,"description",void 0),Re([pt({type:Boolean,reflect:!0})],Le.prototype,"selected",void 0),Re([pt({type:Boolean,reflect:!0})],Le.prototype,"disabled",void 0),Le=Re([kt("vscode-option")],Le);const Ue=(t,e)=>{const i={match:!1,ranges:[]},s=t.toLowerCase(),o=e.toLowerCase(),r=s.split(" ");let n=0;return r.forEach(((e,s)=>{if(s>0&&(n+=r[s-1].length+1),i.match)return;const l=e.indexOf(o),a=o.length;0===l&&(i.match=!0,i.ranges.push([n+l,Math.min(n+l+a,t.length)]))})),i},Ge=(t,e)=>{const i={match:!1,ranges:[]};return 0===t.toLowerCase().indexOf(e.toLowerCase())&&(i.match=!0,i.ranges=[[0,e.length]]),i},He=(t,e)=>{const i={match:!1,ranges:[]},s=t.toLowerCase().indexOf(e.toLowerCase());return s>-1&&(i.match=!0,i.ranges=[[s,s+e.length]]),i},qe=(t,e)=>{const i={match:!1,ranges:[]};let s=0,o=0;const r=e.length-1,n=t.toLowerCase(),l=e.toLowerCase();for(let t=0;t<=r;t++){if(o=n.indexOf(l[t],s),-1===o)return{match:!1,ranges:[]};i.match=!0,i.ranges.push([o,o+1]),s=o+1}return i},We=t=>{const e=[];return" "===t?(e.push(U`&nbsp;`),e):(0===t.indexOf(" ")&&e.push(U`&nbsp;`),e.push(U`${t.trimStart().trimEnd()}`),t.lastIndexOf(" ")===t.length-1&&e.push(U`&nbsp;`),e)};class Ke{constructor(t){this._activeIndex=-1,this._options=[],this._filterPattern="",this._filterMethod="fuzzy",this._combobox=!1,this._indexByValue=new Map,this._indexByLabel=new Map,this._selectedIndex=-1,this._selectedIndexes=new Set,this._multiSelect=!1,this._numOfVisibleOptions=0,(this._host=t).addController(this)}hostConnected(){}get activeIndex(){return this._activeIndex}set activeIndex(t){this._activeIndex=t,this._host.requestUpdate()}get relativeActiveIndex(){return this._options[this._activeIndex]?.filteredIndex??-1}set comboboxMode(t){this._combobox=t,this._host.requestUpdate()}get comboboxMode(){return this._combobox}get multiSelect(){return this._multiSelect}set multiSelect(t){this._selectedIndex=-1,this._selectedIndexes.clear(),this._multiSelect=t,this._host.requestUpdate()}get selectedIndex(){return this._selectedIndex}set selectedIndex(t){-1!==this._selectedIndex&&this._options[this._selectedIndex]&&(this._options[this._selectedIndex].selected??=!1);const e=this.getOptionByIndex(t);this._selectedIndex=e?t:-1,this._host.requestUpdate()}get selectedIndexes(){return Array.from(this._selectedIndexes)}set selectedIndexes(t){this._selectedIndexes.forEach((t=>{this._options[t].selected=!1})),this._selectedIndexes=new Set(t),t.forEach((t=>{void 0!==this._options[t]&&(this._options[t].selected=!0)})),this._host.requestUpdate()}set value(t){if(this._multiSelect){const e=t.map((t=>this._indexByValue.get(t))).filter((t=>void 0!==t));this._selectedIndexes=new Set(e)}else this._selectedIndex=this._indexByValue.get(t)??-1;this._host.requestUpdate()}get value(){return this._multiSelect?this._selectedIndexes.size>0?Array.from(this._selectedIndexes).filter((t=>t>=0&&t<this._options.length)).map((t=>this._options[t].value)):[]:this._selectedIndex>-1&&this._selectedIndex<this._options.length?this._options[this._selectedIndex].value:""}set multiSelectValue(t){const e=t.map((t=>this._indexByValue.get(t))).filter((t=>void 0!==t));this._selectedIndexes=new Set(e)}get multiSelectValue(){return this._selectedIndexes.size>0?Array.from(this._selectedIndexes).map((t=>this._options[t].value)):[]}get filterPattern(){return this._filterPattern}set filterPattern(t){t!==this._filterPattern&&(this._filterPattern=t,this._updateState())}get filterMethod(){return this._filterMethod}set filterMethod(t){t!==this._filterMethod&&(this._filterMethod=t,this._updateState())}get options(){return this._options}get numOfVisibleOptions(){return this._numOfVisibleOptions}get numOptions(){return this._options.length}populate(t){this._indexByValue.clear(),this._indexByLabel.clear(),this._options=t.map(((t,e)=>(this._indexByValue.set(t.value??"",e),this._indexByLabel.set(t.label??"",e),{description:t.description??"",disabled:t.disabled??!1,label:t.label??"",selected:t.selected??!1,value:t.value??"",index:e,filteredIndex:e,ranges:[],visible:!0}))),this._numOfVisibleOptions=this._options.length}add(t){const e=this._options.length,{description:i,disabled:s,label:o,selected:r,value:n}=t;let l=!0,a=[];if(this._combobox&&""!==this._filterPattern){const t=this._searchByPattern(o??"");l=t.match,a=t.ranges}this._indexByValue.set(n??"",e),this._indexByLabel.set(o??"",e),r&&(this._selectedIndex=e,this._selectedIndexes.add(e),this._activeIndex=e),this._options.push({index:e,filteredIndex:e,description:i??"",disabled:s??!1,label:o??"",selected:r??!1,value:n??"",visible:l,ranges:a}),l&&(this._numOfVisibleOptions+=1)}clear(){this._options=[],this._indexByValue.clear(),this._indexByLabel.clear(),this._numOfVisibleOptions=0,this._selectedIndex=-1,this._selectedIndexes.clear(),this._activeIndex=-1}getIsIndexSelected(t){return this._multiSelect?this._selectedIndexes.has(t):this._selectedIndex===t}expandMultiSelection(t){t.forEach((t=>{const e=this._indexByValue.get(t)??-1;-1!==e&&this._selectedIndexes.add(e)})),this._host.requestUpdate()}toggleActiveMultiselectOption(){const t=this._options[this._activeIndex]??null;if(!t)return;this._selectedIndexes.has(t.index)?this._selectedIndexes.delete(t.index):this._selectedIndexes.add(t.index),this._host.requestUpdate()}toggleOptionSelected(t){const e=this._selectedIndexes.has(t);this._options[t].selected=!this._options[t].selected,e?this._selectedIndexes.delete(t):this._selectedIndexes.add(t),this._host.requestUpdate()}getActiveOption(){return this._options[this._activeIndex]??null}getSelectedOption(){return this._options[this._selectedIndex]??null}getOptionByIndex(t){return this._options[t]??null}findOptionIndex(t){return this._indexByValue.get(t)??-1}getOptionByValue(t,e=!1){const i=this._indexByValue.get(t)??-1;return-1===i?null:e||this._options[i].visible?this._options[i]:null}getOptionByLabel(t){const e=this._indexByLabel.get(t)??-1;return-1===e?null:this._options[e]}next(t){let e=-1;for(let i=(t??this._activeIndex)+1;i<this._options.length;i++)if(this._options[i]&&!this._options[i].disabled&&this._options[i].visible){e=i;break}return e>-1?this._options[e]:null}prev(t){let e=-1;for(let i=(t??this._activeIndex)-1;i>=0;i--)if(this._options[i]&&!this._options[i].disabled&&this._options[i].visible){e=i;break}return e>-1?this._options[e]:null}activateDefault(){if(this._multiSelect){if(this._selectedIndexes.size>0){const t=this._selectedIndexes.values().next();this._activeIndex=t.value?t.value:0}}else this._selectedIndex>-1?this._activeIndex=this._selectedIndex:this._activeIndex=0;this._host.requestUpdate()}selectAll(){this._multiSelect&&(this._options.forEach(((t,e)=>{this._options[e].selected=!0,this._selectedIndexes.add(e)})),this._host.requestUpdate())}selectNone(){this._multiSelect&&(this._options.forEach(((t,e)=>{this._options[e].selected=!1})),this._selectedIndexes.clear(),this._host.requestUpdate())}_searchByPattern(t){let e;switch(this._filterMethod){case"startsWithPerTerm":e=Ue(t,this._filterPattern);break;case"startsWith":e=Ge(t,this._filterPattern);break;case"contains":e=He(t,this._filterPattern);break;default:e=qe(t,this._filterPattern)}return e}_updateState(){if(this._combobox&&""!==this._filterPattern){let t=-1;this._numOfVisibleOptions=0,this._options.forEach((({label:e},i)=>{const s=this._searchByPattern(e);this._options[i].visible=s.match,this._options[i].ranges=s.ranges,this._options[i].filteredIndex=s.match?++t:-1,s.match&&(this._numOfVisibleOptions+=1)}))}else this._options.forEach(((t,e)=>{this._options[e].visible=!0,this._options[e].ranges=[]})),this._numOfVisibleOptions=this._options.length;this._host.requestUpdate()}}const Xe=[$t,n`
    :host {
      display: block;
      position: relative;
    }

    .scrollable-container {
      height: 100%;
      overflow: auto;
    }

    .scrollable-container::-webkit-scrollbar {
      cursor: default;
      width: 0;
    }

    .scrollable-container {
      scrollbar-width: none;
    }

    .shadow {
      box-shadow: var(--vscode-scrollbar-shadow, #000000) 0 6px 6px -6px inset;
      display: none;
      height: 3px;
      left: 0;
      pointer-events: none;
      position: absolute;
      top: 0;
      z-index: 1;
      width: 100%;
    }

    .shadow.visible {
      display: block;
    }

    .scrollbar-track {
      height: 100%;
      position: absolute;
      right: 0;
      top: 0;
      width: 10px;
      z-index: 100;
    }

    .scrollbar-track.hidden {
      display: none;
    }

    .scrollbar-thumb {
      background-color: transparent;
      min-height: var(--min-thumb-height, 20px);
      opacity: 0;
      position: absolute;
      right: 0;
      width: 10px;
    }

    .scrollbar-thumb.visible {
      background-color: var(
        --vscode-scrollbarSlider-background,
        rgba(121, 121, 121, 0.4)
      );
      opacity: 1;
      transition: opacity 100ms;
    }

    .scrollbar-thumb.fade {
      background-color: var(
        --vscode-scrollbarSlider-background,
        rgba(121, 121, 121, 0.4)
      );
      opacity: 0;
      transition: opacity 800ms;
    }

    .scrollbar-thumb.visible:hover {
      background-color: var(
        --vscode-scrollbarSlider-hoverBackground,
        rgba(100, 100, 100, 0.7)
      );
    }

    .scrollbar-thumb.visible.active,
    .scrollbar-thumb.visible.active:hover {
      background-color: var(
        --vscode-scrollbarSlider-activeBackground,
        rgba(191, 191, 191, 0.4)
      );
    }

    .prevent-interaction {
      bottom: 0;
      left: 0;
      right: 0;
      top: 0;
      position: absolute;
      z-index: 99;
    }

    .content {
      overflow: hidden;
    }
  `];var Je=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Ye=class extends yt{set scrollPos(t){this._scrollPos=this._limitScrollPos(t),this._updateScrollbar(),this._updateThumbPosition(),this.requestUpdate()}get scrollPos(){return this._scrollPos}get scrollMax(){return this._scrollableContainer?this._scrollableContainer.scrollHeight-this._scrollableContainer.clientHeight:0}constructor(){super(),this.alwaysVisible=!1,this.fastScrollSensitivity=5,this.minThumbSize=20,this.mouseWheelScrollSensitivity=1,this.shadow=!0,this.scrolled=!1,this._scrollPos=0,this._isDragging=!1,this._thumbHeight=0,this._thumbY=0,this._thumbVisible=!1,this._thumbFade=!1,this._thumbActive=!1,this._componentHeight=0,this._contentHeight=0,this._scrollThumbStartY=0,this._mouseStartY=0,this._scrollbarVisible=!0,this._scrollbarTrackZ=0,this._resizeObserverCallback=()=>{this._componentHeight=this.offsetHeight,this._contentHeight=this._contentElement.offsetHeight,this._updateScrollbar(),this._updateThumbPosition()},this._handleSlotChange=()=>{this._updateScrollbar(),this._updateThumbPosition(),this._zIndexFix()},this._handleScrollThumbMouseMove=t=>{const e=this._scrollThumbStartY+(t.screenY-this._mouseStartY);this._thumbY=this._limitThumbPos(e),this.scrollPos=this._calculateScrollPosFromThumbPos(this._thumbY),this.dispatchEvent(new CustomEvent("vsc-scrollable-scroll",{detail:this.scrollPos}))},this._handleScrollThumbMouseUp=t=>{this._isDragging=!1,this._thumbActive=!1;const e=this.getBoundingClientRect(),{x:i,y:s,width:o,height:r}=e,{pageX:n,pageY:l}=t;(n>i+o||n<i||l>s+r||l<s)&&(this._thumbFade=!0,this._thumbVisible=!1),document.removeEventListener("mousemove",this._handleScrollThumbMouseMove),document.removeEventListener("mouseup",this._handleScrollThumbMouseUp)},this._handleComponentMouseOver=()=>{this._thumbVisible=!0,this._thumbFade=!1},this._handleComponentMouseOut=()=>{this._thumbActive||(this._thumbVisible=!1,this._thumbFade=!0)},this._handleComponentWheel=t=>{if(this._contentHeight<=this._componentHeight)return;t.preventDefault();const e=t.altKey?this.mouseWheelScrollSensitivity*this.fastScrollSensitivity:this.mouseWheelScrollSensitivity;this.scrollPos=this._limitScrollPos(this.scrollPos+t.deltaY*e),this.dispatchEvent(new CustomEvent("vsc-scrollable-scroll",{detail:this.scrollPos}))},this._handleScrollableContainerScroll=t=>{t.currentTarget&&(this.scrollPos=t.currentTarget.scrollTop)},this.addEventListener("mouseover",this._handleComponentMouseOver),this.addEventListener("mouseout",this._handleComponentMouseOut),this.addEventListener("wheel",this._handleComponentWheel)}connectedCallback(){super.connectedCallback(),this._hostResizeObserver=new ResizeObserver(this._resizeObserverCallback),this._contentResizeObserver=new ResizeObserver(this._resizeObserverCallback),this.requestUpdate(),this.updateComplete.then((()=>{this._hostResizeObserver.observe(this),this._contentResizeObserver.observe(this._contentElement),this._updateThumbPosition()}))}disconnectedCallback(){super.disconnectedCallback(),this._hostResizeObserver.unobserve(this),this._hostResizeObserver.disconnect(),this._contentResizeObserver.unobserve(this._contentElement),this._contentResizeObserver.disconnect()}firstUpdated(t){this._updateThumbPosition()}_calcThumbHeight(){const t=this.offsetHeight,e=t*(t/(this._contentElement?.offsetHeight??0));return Math.max(this.minThumbSize,e)}_updateScrollbar(){const t=this._contentElement?.offsetHeight??0;this.offsetHeight>=t?this._scrollbarVisible=!1:(this._scrollbarVisible=!0,this._thumbHeight=this._calcThumbHeight()),this.requestUpdate()}_zIndexFix(){let t=0;this._assignedElements.forEach((e=>{if("style"in e){const i=window.getComputedStyle(e).zIndex;/([0-9-])+/g.test(i)&&(t=Number(i)>t?Number(i):t)}})),this._scrollbarTrackZ=t+1,this.requestUpdate()}_updateThumbPosition(){if(!this._scrollableContainer)return;this.scrolled=this.scrollPos>0;const t=this.offsetHeight,e=this._thumbHeight,i=this._contentElement.offsetHeight-t,s=this.scrollPos/i,o=t-e;this._thumbY=Math.min(s*(t-e),o)}_calculateScrollPosFromThumbPos(t){const e=this.getBoundingClientRect().height,i=t/(e-this._scrollThumbElement.getBoundingClientRect().height)*(this._contentElement.getBoundingClientRect().height-e);return this._limitScrollPos(i)}_limitScrollPos(t){return t<0?0:t>this.scrollMax?this.scrollMax:t}_limitThumbPos(t){const e=this.getBoundingClientRect().height,i=this._scrollThumbElement.getBoundingClientRect().height;return t<0?0:t>e-i?e-i:t}_handleScrollThumbMouseDown(t){const e=this.getBoundingClientRect(),i=this._scrollThumbElement.getBoundingClientRect();this._mouseStartY=t.screenY,this._scrollThumbStartY=i.top-e.top,this._isDragging=!0,this._thumbActive=!0,document.addEventListener("mousemove",this._handleScrollThumbMouseMove),document.addEventListener("mouseup",this._handleScrollThumbMouseUp)}_handleScrollbarTrackPress(t){t.target===t.currentTarget&&(this._thumbY=t.offsetY-this._thumbHeight/2,this.scrollPos=this._calculateScrollPosFromThumbPos(this._thumbY))}render(){return U`
      <div
        class="scrollable-container"
        .style=${Pt({userSelect:this._isDragging?"none":"auto"})}
        .scrollTop=${this.scrollPos}
        @scroll=${this._handleScrollableContainerScroll}
      >
        <div
          class=${jt({shadow:!0,visible:this.scrolled})}
          .style=${Pt({zIndex:String(this._scrollbarTrackZ)})}
        ></div>
        ${this._isDragging?U`<div class="prevent-interaction"></div>`:q}
        <div
          class=${jt({"scrollbar-track":!0,hidden:!this._scrollbarVisible})}
          @mousedown=${this._handleScrollbarTrackPress}
        >
          <div
            class=${jt({"scrollbar-thumb":!0,visible:!!this.alwaysVisible||this._thumbVisible,fade:!this.alwaysVisible&&this._thumbFade,active:this._thumbActive})}
            .style=${Pt({height:`${this._thumbHeight}px`,top:`${this._thumbY}px`})}
            @mousedown=${this._handleScrollThumbMouseDown}
          ></div>
        </div>
        <div class="content">
          <slot @slotchange=${this._handleSlotChange}></slot>
        </div>
      </div>
    `}};Ye.styles=Xe,Je([pt({type:Boolean,reflect:!0,attribute:"always-visible"})],Ye.prototype,"alwaysVisible",void 0),Je([pt({type:Number,attribute:"fast-scroll-sensitivity"})],Ye.prototype,"fastScrollSensitivity",void 0),Je([pt({type:Number,attribute:"min-thumb-size"})],Ye.prototype,"minThumbSize",void 0),Je([pt({type:Number,attribute:"mouse-wheel-scroll-sensitivity"})],Ye.prototype,"mouseWheelScrollSensitivity",void 0),Je([pt({type:Boolean,reflect:!0})],Ye.prototype,"shadow",void 0),Je([pt({type:Boolean,reflect:!0})],Ye.prototype,"scrolled",void 0),Je([pt({type:Number,attribute:"scroll-pos"})],Ye.prototype,"scrollPos",null),Je([vt()],Ye.prototype,"_isDragging",void 0),Je([vt()],Ye.prototype,"_thumbHeight",void 0),Je([vt()],Ye.prototype,"_thumbY",void 0),Je([vt()],Ye.prototype,"_thumbVisible",void 0),Je([vt()],Ye.prototype,"_thumbFade",void 0),Je([vt()],Ye.prototype,"_thumbActive",void 0),Je([ft(".content")],Ye.prototype,"_contentElement",void 0),Je([ft(".scrollbar-thumb",!0)],Ye.prototype,"_scrollThumbElement",void 0),Je([ft(".scrollable-container")],Ye.prototype,"_scrollableContainer",void 0),Je([mt()],Ye.prototype,"_assignedElements",void 0),Ye=Je([kt("vscode-scrollable")],Ye);var Ze=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};const Qe=22;class ti extends yt{set combobox(t){this._opts.comboboxMode=t}get combobox(){return this._opts.comboboxMode}set disabled(t){this._disabled=t,this.ariaDisabled=t?"true":"false",!0===t?(this._originalTabIndex=this.tabIndex,this.tabIndex=-1):(this.tabIndex=this._originalTabIndex??0,this._originalTabIndex=void 0),this.requestUpdate()}get disabled(){return this._disabled}set filter(t){let e;["contains","fuzzy","startsWith","startsWithPerTerm"].includes(t)?e=t:(console.warn(`[VSCode Webview Elements] Invalid filter: "${t}", fallback to default. Valid values are: "contains", "fuzzy", "startsWith", "startsWithPerm".`,this),e="fuzzy"),this._opts.filterMethod=e}get filter(){return this._opts.filterMethod}set options(t){this._opts.populate(t)}get options(){return this._opts.options.map((({label:t,value:e,description:i,selected:s,disabled:o})=>({label:t,value:e,description:i,selected:s,disabled:o})))}constructor(){super(),this.creatable=!1,this.label="",this.invalid=!1,this.focused=!1,this.open=!1,this.position="below",this._opts=new Ke(this),this._firstUpdateCompleted=!1,this._currentDescription="",this._filter="fuzzy",this._selectedIndexes=[],this._options=[],this._value="",this._values=[],this._isPlaceholderOptionActive=!1,this._isBeingFiltered=!1,this._optionListScrollPos=0,this._isHoverForbidden=!1,this._disabled=!1,this._originalTabIndex=void 0,this._onMouseMove=()=>{this._isHoverForbidden=!1,window.removeEventListener("mousemove",this._onMouseMove)},this._onOptionListScroll=t=>{this._optionListScrollPos=t.detail},this._onComponentKeyDown=t=>{[" ","ArrowUp","ArrowDown","Escape"].includes(t.key)&&(t.stopPropagation(),t.preventDefault()),"Enter"===t.key&&this._onEnterKeyDown(t)," "===t.key&&this._onSpaceKeyDown(),"Escape"===t.key&&this._onEscapeKeyDown(),"ArrowUp"===t.key&&this._onArrowUpKeyDown(),"ArrowDown"===t.key&&this._onArrowDownKeyDown()},this._onComponentFocus=()=>{this.focused=!0},this._onComponentBlur=()=>{this.focused=!1},this._handleWindowScroll=()=>{this.open=!1},this.addEventListener("vsc-option-state-change",(t=>{t.stopPropagation(),this._setStateFromSlottedElements(),this.requestUpdate()}))}connectedCallback(){super.connectedCallback(),this.addEventListener("keydown",this._onComponentKeyDown),this.addEventListener("focus",this._onComponentFocus),this.addEventListener("blur",this._onComponentBlur),this._setAutoFocus()}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("keydown",this._onComponentKeyDown),this.removeEventListener("focus",this._onComponentFocus),this.removeEventListener("blur",this._onComponentBlur)}firstUpdated(t){this._firstUpdateCompleted=!0}willUpdate(t){t.has("required")&&this._firstUpdateCompleted&&this._manageRequired(),t.has("open")&&this._firstUpdateCompleted&&(this.open?(this._dropdownEl.showPopover(),window.addEventListener("scroll",this._handleWindowScroll,{capture:!0}),this._opts.activateDefault(),this._scrollActiveElementToTop()):(this._dropdownEl.hidePopover(),window.removeEventListener("scroll",this._handleWindowScroll)))}get _filteredOptions(){return this.combobox&&""!==this._opts.filterPattern?((t,e,i)=>{const s=[];return t.forEach((t=>{let o;switch(i){case"startsWithPerTerm":o=Ue(t.label,e);break;case"startsWith":o=Ge(t.label,e);break;case"contains":o=He(t.label,e);break;default:o=qe(t.label,e)}o.match&&s.push({...t,ranges:o.ranges})})),s})(this._options,this._opts.filterPattern,this._filter):this._options}_setAutoFocus(){this.hasAttribute("autofocus")&&(this.tabIndex<0&&(this.tabIndex=0),this.combobox?this.updateComplete.then((()=>{this.shadowRoot?.querySelector(".combobox-input").focus()})):this.updateComplete.then((()=>{this.shadowRoot?.querySelector(".select-face").focus()})))}get _isSuggestedOptionVisible(){if(!this.combobox||!this.creatable)return!1;const t=null!==this._opts.getOptionByValue(this._opts.filterPattern),e=this._opts.filterPattern.length>0;return!t&&e}_manageRequired(){}_setStateFromSlottedElements(){const t=this._assignedOptions??[];this._opts.clear(),t.forEach((t=>{const{innerText:e,description:i,disabled:s}=t,o="string"==typeof t.value?t.value:e.trim(),r=t.selected??!1,n={label:e.trim(),value:o,description:i,selected:r,disabled:s};this._opts.add(n)}))}_createSuggestedOption(){const t=this._opts.numOptions,e=document.createElement("vscode-option");return e.value=this._opts.filterPattern,lt(this._opts.filterPattern,e),this.appendChild(e),t}_dispatchChangeEvent(){this.dispatchEvent(new Event("change")),this.dispatchEvent(new Event("input"))}async _createAndSelectSuggestedOption(){}_toggleComboboxDropdown(){this._opts.filterPattern="",this.open=!this.open}_scrollActiveElementToTop(){this._optionListScrollPos=Math.floor(this._opts.relativeActiveIndex*Qe)}async _adjustOptionListScrollPos(t,e){let i=this._opts.numOfVisibleOptions;if(this._isSuggestedOptionVisible&&(i+=1),i<=10)return;this._isHoverForbidden=!0,window.addEventListener("mousemove",this._onMouseMove);const s=this._optionListScrollPos,o=e*Qe,r=o>=s&&o<=s+220-Qe;"down"===t&&(r||(this._optionListScrollPos=e*Qe-198)),"up"===t&&(r||(this._optionListScrollPos=Math.floor(this._opts.relativeActiveIndex*Qe)))}_onFaceClick(){this.open=!this.open}_handleDropdownToggle(t){this.open="open"===t.newState}_onComboboxButtonClick(){this._toggleComboboxDropdown()}_onComboboxButtonKeyDown(t){"Enter"===t.key&&this._toggleComboboxDropdown()}_onOptionMouseOver(t){if(this._isHoverForbidden)return;const e=t.target;e.matches(".option")&&(e.matches(".placeholder")?(this._isPlaceholderOptionActive=!0,this._opts.activeIndex=-1):(this._isPlaceholderOptionActive=!1,this._opts.activeIndex=+e.dataset.index))}_onPlaceholderOptionMouseOut(){this._isPlaceholderOptionActive=!1}_onNoOptionsClick(t){t.stopPropagation()}_onEnterKeyDown(t){this._isBeingFiltered=!1;!!t?.composedPath&&t.composedPath().find((t=>!!t.matches&&t.matches("vscode-button.button-accept")))}_onSpaceKeyDown(){this.open||(this.open=!0)}_onArrowUpKeyDown(){if(this.open){if(this._opts.activeIndex<=0&&(!this.combobox||!this.creatable))return;if(this._isPlaceholderOptionActive){const t=this._opts.numOfVisibleOptions-1;this._opts.activeIndex=t,this._isPlaceholderOptionActive=!1}else{const t=this._opts.prev();if(null!==t){this._opts.activeIndex=t?.index??-1;const e=t?.filteredIndex??-1;e>-1&&this._adjustOptionListScrollPos("up",e)}}}else this.open=!0,this._opts.activateDefault()}_onArrowDownKeyDown(){let t=this._opts.numOfVisibleOptions;const e=this._isSuggestedOptionVisible;if(e&&(t+=1),this.open){if(this._isPlaceholderOptionActive&&-1===this._opts.activeIndex)return;const i=this._opts.next();if(e&&null===i)this._isPlaceholderOptionActive=!0,this._adjustOptionListScrollPos("down",t-1),this._opts.activeIndex=-1;else if(null!==i){const t=i?.filteredIndex??-1;this._opts.activeIndex=i?.index??-1,t>-1&&this._adjustOptionListScrollPos("down",t)}}else this.open=!0,this._opts.activateDefault()}_onEscapeKeyDown(){this.open=!1}_onSlotChange(){this._setStateFromSlottedElements(),this.requestUpdate()}_onComboboxInputFocus(t){t.target.select(),this._isBeingFiltered=!1,this._opts.filterPattern=""}_onComboboxInputBlur(){this._isBeingFiltered=!1}_onComboboxInputInput(t){this._isBeingFiltered=!0,this._opts.filterPattern=t.target.value,this._opts.activeIndex=-1,this.open=!0}_onComboboxInputClick(){this._isBeingFiltered=""!==this._opts.filterPattern,this.open=!0}_onComboboxInputSpaceKeyDown(t){" "===t.key&&t.stopPropagation()}_onOptionClick(t){this._isBeingFiltered=!1}_renderCheckbox(t,e){return U`<span class=${jt({"checkbox-icon":!0,checked:t})}>${Ie}</span
      ><span class="option-label">${e}</span>`}_renderOptions(){const t=this._opts.options;return U`
      <ul
        aria-label=${Mt(this.label??void 0)}
        aria-multiselectable=${Mt(this._opts.multiSelect?"true":void 0)}
        class="options"
        id="select-listbox"
        role="listbox"
        tabindex="-1"
        @click=${this._onOptionClick}
        @mouseover=${this._onOptionMouseOver}
      >
        ${Ne(t,(t=>t.index),((t,e)=>{if(!t.visible)return q;const i=t.index===this._opts.activeIndex&&!t.disabled,s=this._opts.getIsIndexSelected(t.index),o={active:i,disabled:t.disabled,option:!0,"single-select":!this._opts.multiSelect,"multi-select":this._opts.multiSelect,selected:s},r=t.ranges?.length?((t,e)=>{const i=[],s=e.length;return s<1?U`${t}`:(e.forEach(((o,r)=>{const n=t.substring(o[0],o[1]);0===r&&0!==o[0]&&i.push(...We(t.substring(0,e[0][0]))),r>0&&r<s&&o[0]-e[r-1][1]!=0&&i.push(...We(t.substring(e[r-1][1],o[0]))),i.push(U`<b>${We(n)}</b>`),r===s-1&&o[1]<t.length&&i.push(...We(t.substring(o[1],t.length)))})),i)})(t.label,t.ranges??[]):t.label;return U`
              <li
                aria-selected=${s?"true":"false"}
                class=${jt(o)}
                data-index=${t.index}
                data-filtered-index=${e}
                id=${`op-${t.index}`}
                role="option"
                tabindex="-1"
              >
                ${function(t,e,i){return t?e(t):i?.(t)}(this._opts.multiSelect,(()=>this._renderCheckbox(s,r)),(()=>r))}
              </li>
            `}))}
        ${this._renderPlaceholderOption(this._opts.numOfVisibleOptions<1)}
      </ul>
    `}_renderPlaceholderOption(t){if(!this.combobox)return q;return this._opts.getOptionByLabel(this._opts.filterPattern)?q:this.creatable&&this._opts.filterPattern.length>0?U`<li
        class=${jt({option:!0,placeholder:!0,active:this._isPlaceholderOptionActive})}
        @mouseout=${this._onPlaceholderOptionMouseOut}
      >
        Add "${this._opts.filterPattern}"
      </li>`:t?U`<li class="no-options" @click=${this._onNoOptionsClick}>
            No options
          </li>`:q}_renderDescription(){const t=this._opts.getActiveOption();if(!t)return q;const{description:e}=t;return e?U`<div class="description">${e}</div>`:q}_renderSelectFace(){return U`${q}`}_renderComboboxFace(){return U`${q}`}_renderDropdownControls(){return U`${q}`}_renderDropdown(){const t={dropdown:!0,multiple:this._opts.multiSelect,open:this.open},e=this._isSuggestedOptionVisible||0===this._opts.numOfVisibleOptions?this._opts.numOfVisibleOptions+1:this._opts.numOfVisibleOptions,i=Math.min(e*Qe,220),s=this.getBoundingClientRect(),o={width:`${s.width}px`,left:`${s.left}px`,top:"below"===this.position?`${s.top+s.height}px`:"unset",bottom:"below"===this.position?"unset":document.documentElement.clientHeight-s.top+"px"};return U`
      <div
        class=${jt(t)}
        popover="auto"
        @toggle=${this._handleDropdownToggle}
        .style=${Pt(o)}
      >
        ${"above"===this.position?this._renderDescription():q}
        <vscode-scrollable
          always-visible
          class="scrollable"
          min-thumb-size="40"
          tabindex="-1"
          @vsc-scrollable-scroll=${this._onOptionListScroll}
          .scrollPos=${this._optionListScrollPos}
          .style=${Pt({height:`${i}px`})}
        >
          ${this._renderOptions()} ${this._renderDropdownControls()}
        </vscode-scrollable>
        ${"below"===this.position?this._renderDescription():q}
      </div>
    `}}Ze([pt({type:Boolean,reflect:!0})],ti.prototype,"creatable",void 0),Ze([pt({type:Boolean,reflect:!0})],ti.prototype,"combobox",null),Ze([pt({reflect:!0})],ti.prototype,"label",void 0),Ze([pt({type:Boolean,reflect:!0})],ti.prototype,"disabled",null),Ze([pt({type:Boolean,reflect:!0})],ti.prototype,"invalid",void 0),Ze([pt()],ti.prototype,"filter",null),Ze([pt({type:Boolean,reflect:!0})],ti.prototype,"focused",void 0),Ze([pt({type:Boolean,reflect:!0})],ti.prototype,"open",void 0),Ze([pt({type:Array})],ti.prototype,"options",null),Ze([pt({reflect:!0})],ti.prototype,"position",void 0),Ze([mt({flatten:!0,selector:"vscode-option"})],ti.prototype,"_assignedOptions",void 0),Ze([ft(".dropdown",!0)],ti.prototype,"_dropdownEl",void 0),Ze([vt()],ti.prototype,"_currentDescription",void 0),Ze([vt()],ti.prototype,"_filter",void 0),Ze([vt()],ti.prototype,"_filteredOptions",null),Ze([vt()],ti.prototype,"_selectedIndexes",void 0),Ze([vt()],ti.prototype,"_options",void 0),Ze([vt()],ti.prototype,"_value",void 0),Ze([vt()],ti.prototype,"_values",void 0),Ze([vt()],ti.prototype,"_isPlaceholderOptionActive",void 0),Ze([vt()],ti.prototype,"_isBeingFiltered",void 0),Ze([vt()],ti.prototype,"_optionListScrollPos",void 0);var ei=[$t,n`
    :host {
      display: inline-block;
      max-width: 100%;
      outline: none;
      position: relative;
      width: 320px;
    }

    .main-slot {
      display: none;
    }

    .select-face,
    .combobox-face {
      background-color: var(--vscode-settings-dropdownBackground, #313131);
      border-color: var(--vscode-settings-dropdownBorder, #3c3c3c);
      border-radius: 2px;
      border-style: solid;
      border-width: 1px;
      box-sizing: border-box;
      color: var(--vscode-settings-dropdownForeground, #cccccc);
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 18px;
      position: relative;
      user-select: none;
      width: 100%;
    }

    :host([invalid]) .select-face,
    :host(:invalid) .select-face,
    :host([invalid]) .combobox-face,
    :host(:invalid) .combobox-face {
      background-color: var(--vscode-inputValidation-errorBackground, #5a1d1d);
      border-color: var(--vscode-inputValidation-errorBorder, #be1100);
    }

    .select-face {
      cursor: pointer;
      display: block;
      padding: 3px 4px;
    }

    .select-face .text {
      display: block;
      height: 18px;
      overflow: hidden;
      padding-right: 20px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .select-face.multiselect {
      padding: 0;
    }

    .select-face-badge {
      background-color: var(--vscode-badge-background, #616161);
      border-radius: 2px;
      color: var(--vscode-badge-foreground, #f8f8f8);
      display: inline-block;
      flex-shrink: 0;
      font-size: 11px;
      line-height: 16px;
      margin: 2px;
      padding: 2px 3px;
      white-space: nowrap;
    }

    .select-face-badge.no-item {
      background-color: transparent;
      color: inherit;
    }

    .combobox-face {
      display: flex;
    }

    :host(:focus) .select-face,
    :host(:focus) .combobox-face,
    :host([focused]) .select-face,
    :host([focused]) .combobox-face {
      border-color: var(--vscode-focusBorder, #0078d4);
      outline: none;
    }

    .combobox-input {
      background-color: transparent;
      box-sizing: border-box;
      border: 0;
      color: var(--vscode-foreground, #cccccc);
      display: block;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      line-height: 16px;
      padding: 4px;
      width: 100%;
    }

    .combobox-input:focus {
      outline: none;
    }

    .combobox-button {
      align-items: center;
      background-color: transparent;
      border: 0;
      border-radius: 2px;
      box-sizing: content-box;
      color: var(--vscode-foreground, #cccccc);
      cursor: pointer;
      display: flex;
      flex-shrink: 0;
      height: 16px;
      justify-content: center;
      margin: 1px 1px 0 0;
      padding: 3px;
      width: 22px;
    }

    .combobox-button:hover,
    .combobox-button:focus-visible {
      background-color: var(
        --vscode-toolbar-hoverBackground,
        rgba(90, 93, 94, 0.31)
      );
      outline-style: dashed;
      outline-color: var(--vscode-toolbar-hoverOutline, transparent);
    }

    .combobox-button:focus-visible {
      outline: none;
    }

    .icon {
      color: var(--vscode-foreground, #cccccc);
      display: block;
      height: 14px;
      pointer-events: none;
      width: 14px;
    }

    .select-face .icon {
      position: absolute;
      right: 6px;
      top: 5px;
    }

    .icon svg {
      color: var(--vscode-foreground, #cccccc);
      height: 100%;
      width: 100%;
    }

    .dropdown {
      background-color: var(--vscode-settings-dropdownBackground, #313131);
      border-color: var(--vscode-settings-dropdownListBorder, #454545);
      border-radius: 0 0 3px 3px;
      border-style: solid;
      border-width: 1px;
      bottom: unset;
      box-sizing: border-box;
      display: none;
      padding-bottom: 2px;
      padding-left: 0;
      padding-right: 0;
      padding-top: 0;
      right: unset;
    }

    .dropdown.open {
      display: block;
    }

    :host([position='above']) .dropdown {
      border-radius: 3px 3px 0 0;
      bottom: 26px;
      padding-bottom: 0;
      padding-top: 2px;
      top: unset;
    }

    :host(:focus) .dropdown,
    :host([focused]) .dropdown {
      border-color: var(--vscode-focusBorder, #0078d4);
    }

    .scrollable {
      display: block;
      max-height: 222px;
      margin: 1px;
      outline: none;
      overflow: hidden;
    }

    .options {
      box-sizing: border-box;
      cursor: pointer;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .option {
      box-sizing: border-box;
      color: var(--vscode-foreground, #cccccc);
      cursor: pointer;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      height: 22px;
      line-height: 20px;
      min-height: calc(var(--vscode-font-size) * 1.3);
      padding: 1px 3px;
      user-select: none;
      outline-color: transparent;
      outline-offset: -1px;
      outline-style: solid;
      outline-width: 1px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .option.single-select {
      display: block;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .option.multi-select {
      align-items: center;
      display: flex;
    }

    .option b {
      color: var(--vscode-list-highlightForeground, #2aaaff);
    }

    .option.active b {
      color: var(--vscode-list-focusHighlightForeground, #2aaaff);
    }

    .option:not(.disabled):hover {
      background-color: var(--vscode-list-hoverBackground, #2a2d2e);
      color: var(--vscode-list-hoverForeground, #ffffff);
    }

    :host-context(body[data-vscode-theme-kind='vscode-high-contrast'])
      .option:hover,
    :host-context(body[data-vscode-theme-kind='vscode-high-contrast-light'])
      .option:hover {
      outline-style: dotted;
      outline-color: var(--vscode-list-focusOutline, #0078d4);
      outline-width: 1px;
    }

    .option.disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }

    .option.active,
    .option.active:hover {
      background-color: var(--vscode-list-activeSelectionBackground, #04395e);
      color: var(--vscode-list-activeSelectionForeground, #ffffff);
      outline-color: var(--vscode-list-activeSelectionBackground, #04395e);
      outline-style: solid;
      outline-width: 1px;
    }

    .no-options {
      align-items: center;
      border-color: transparent;
      border-style: solid;
      border-width: 1px;
      color: var(--vscode-foreground, #cccccc);
      cursor: default;
      display: flex;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 18px;
      min-height: calc(var(--vscode-font-size) * 1.3);
      opacity: 0.85;
      padding: 1px 3px;
      user-select: none;
    }

    .placeholder {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .placeholder span {
      font-weight: bold;
    }

    .placeholder:not(.disabled):hover {
      color: var(--vscode-list-activeSelectionForeground, #ffffff);
    }

    :host-context(body[data-vscode-theme-kind='vscode-high-contrast'])
      .option.active,
    :host-context(body[data-vscode-theme-kind='vscode-high-contrast-light'])
      .option.active:hover {
      outline-color: var(--vscode-list-focusOutline, #0078d4);
      outline-style: dashed;
    }

    .option-label {
      display: block;
      overflow: hidden;
      pointer-events: none;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
    }

    .dropdown.multiple .option.selected {
      background-color: var(--vscode-list-hoverBackground, #2a2d2e);
      outline-color: var(--vscode-list-hoverBackground, #2a2d2e);
    }

    .dropdown.multiple .option.selected.active {
      background-color: var(--vscode-list-activeSelectionBackground, #04395e);
      color: var(--vscode-list-activeSelectionForeground, #ffffff);
      outline-color: var(--vscode-list-activeSelectionBackground, #04395e);
    }

    .checkbox-icon {
      align-items: center;
      background-color: var(--vscode-checkbox-background, #313131);
      border-radius: 2px;
      border: 1px solid var(--vscode-checkbox-border);
      box-sizing: border-box;
      color: var(--vscode-checkbox-foreground);
      display: flex;
      flex-basis: 15px;
      flex-shrink: 0;
      height: 15px;
      justify-content: center;
      margin-right: 5px;
      overflow: hidden;
      position: relative;
      width: 15px;
    }

    .checkbox-icon svg {
      display: none;
      height: 13px;
      width: 13px;
    }

    .checkbox-icon.checked svg {
      display: block;
    }

    .dropdown-controls {
      display: flex;
      justify-content: flex-end;
      padding: 4px;
    }

    .dropdown-controls :not(:last-child) {
      margin-right: 4px;
    }

    .action-icon {
      align-items: center;
      background-color: transparent;
      border: 0;
      color: var(--vscode-foreground, #cccccc);
      cursor: pointer;
      display: flex;
      height: 24px;
      justify-content: center;
      padding: 0;
      width: 24px;
    }

    .action-icon:focus {
      outline: none;
    }

    .action-icon:focus-visible {
      outline: 1px solid var(--vscode-focusBorder, #0078d4);
      outline-offset: -1px;
    }

    .description {
      border-color: var(--vscode-settings-dropdownBorder, #3c3c3c);
      border-style: solid;
      border-width: 1px 0 0;
      color: var(--vscode-foreground, #cccccc);
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 1.3;
      padding: 6px 4px;
      word-wrap: break-word;
    }

    :host([position='above']) .description {
      border-width: 0 0 1px;
    }
  `],ii=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let si=class extends ti{set selectedIndexes(t){this._opts.selectedIndexes=t}get selectedIndexes(){return this._opts.selectedIndexes}set value(t){this._opts.multiSelectValue=t,this._opts.selectedIndexes.length>0?this._requestedValueToSetLater=[]:this._requestedValueToSetLater=Array.isArray(t)?t:[t],this._setFormValue(),this._manageRequired()}get value(){return this._opts.multiSelectValue}get form(){return this._internals.form}get type(){return"select-multiple"}get validity(){return this._internals.validity}get validationMessage(){return this._internals.validationMessage}get willValidate(){return this._internals.willValidate}checkValidity(){return this._internals.checkValidity()}reportValidity(){return this._internals.reportValidity()}selectAll(){this._opts.selectAll()}selectNone(){this._opts.selectNone()}constructor(){super(),this.defaultValue=[],this.required=!1,this.name=void 0,this._requestedValueToSetLater=[],this._onOptionClick=t=>{const e=t.composedPath().find((t=>"matches"in t&&t.matches("li.option")));if(!e)return;if(e.classList.contains("placeholder"))return void this._createAndSelectSuggestedOption();const i=Number(e.dataset.index);this._opts.toggleOptionSelected(i),this._setFormValue(),this._manageRequired(),this._dispatchChangeEvent()},this._opts.multiSelect=!0,this._internals=this.attachInternals()}connectedCallback(){super.connectedCallback(),this.updateComplete.then((()=>{this._setDefaultValue(),this._manageRequired()}))}formResetCallback(){this.updateComplete.then((()=>{this.value=this.defaultValue}))}formStateRestoreCallback(t,e){const i=Array.from(t.entries()).map((t=>String(t[1])));this.updateComplete.then((()=>{this.value=i}))}_setDefaultValue(){if(Array.isArray(this.defaultValue)&&this.defaultValue.length>0){const t=this.defaultValue.map((t=>String(t)));this.value=t}}_dispatchChangeEvent(){super._dispatchChangeEvent()}_onFaceClick(){super._onFaceClick(),this._opts.activeIndex=0}_toggleComboboxDropdown(){super._toggleComboboxDropdown(),this._opts.activeIndex=-1}_manageRequired(){const{value:t}=this;0===t.length&&this.required?this._internals.setValidity({valueMissing:!0},"Please select an item in the list.",this._faceElement):this._internals.setValidity({})}_setFormValue(){const t=new FormData;this._values.forEach((e=>{t.append(this.name??"",e)})),this._internals.setFormValue(t)}async _createAndSelectSuggestedOption(){super._createAndSelectSuggestedOption();const t=this._createSuggestedOption();await this.updateComplete,this.selectedIndexes=[...this.selectedIndexes,t],this._dispatchChangeEvent();const e=new CustomEvent("vsc-multi-select-create-option",{detail:{value:this._opts.getOptionByIndex(t)?.value??""}});this.dispatchEvent(e),this.open=!1,this._isPlaceholderOptionActive=!1}_onSlotChange(){super._onSlotChange(),this._requestedValueToSetLater.length>0&&(this._opts.expandMultiSelection(this._requestedValueToSetLater),this._requestedValueToSetLater=this._requestedValueToSetLater.filter((t=>-1===this._opts.findOptionIndex(t))))}_onEnterKeyDown(t){super._onEnterKeyDown(t),this.open?this._isPlaceholderOptionActive?this._createAndSelectSuggestedOption():(this._opts.toggleActiveMultiselectOption(),this._setFormValue(),this._manageRequired(),this._dispatchChangeEvent()):(this._opts.filterPattern="",this.open=!0)}_onMultiAcceptClick(){this.open=!1}_onMultiDeselectAllClick(){this._opts.selectedIndexes=[],this._values=[],this._options=this._options.map((t=>({...t,selected:!1}))),this._manageRequired(),this._dispatchChangeEvent()}_onMultiSelectAllClick(){this._opts.selectedIndexes=[],this._values=[],this._options=this._options.map((t=>({...t,selected:!0}))),this._options.forEach(((t,e)=>{this._selectedIndexes.push(e),this._values.push(t.value),this._dispatchChangeEvent()})),this._setFormValue(),this._manageRequired()}_onComboboxInputBlur(){super._onComboboxInputBlur(),this._opts.filterPattern=""}_renderLabel(){return 0===this._opts.selectedIndexes.length?U`<span class="select-face-badge no-item">0 Selected</span>`:U`<span class="select-face-badge"
          >${this._opts.selectedIndexes.length} Selected</span
        >`}_renderComboboxFace(){const t=this._opts.activeIndex>-1?`op-${this._opts.activeIndex}`:"",e=this.open?"true":"false";return U`
      <div class="combobox-face face">
        ${this._opts.multiSelect?this._renderLabel():q}
        <input
          aria-activedescendant=${t}
          aria-autocomplete="list"
          aria-controls="select-listbox"
          aria-expanded=${e}
          aria-haspopup="listbox"
          aria-label=${Mt(this.label)}
          class="combobox-input"
          role="combobox"
          spellcheck="false"
          type="text"
          autocomplete="off"
          .value=${this._opts.filterPattern}
          @focus=${this._onComboboxInputFocus}
          @blur=${this._onComboboxInputBlur}
          @input=${this._onComboboxInputInput}
          @click=${this._onComboboxInputClick}
          @keydown=${this._onComboboxInputSpaceKeyDown}
        >
        <button
          aria-label="Open the list of options"
          class="combobox-button"
          type="button"
          @click=${this._onComboboxButtonClick}
          @keydown=${this._onComboboxButtonKeyDown}
          tabindex="-1"
        >
          ${Ee}
        </button>
      </div>
    `}_renderSelectFace(){const t=this._opts.activeIndex>-1?`op-${this._opts.activeIndex}`:"",e=this.open?"true":"false";return U`
      <div
        aria-activedescendant=${Mt(this._opts.multiSelect?void 0:t)}
        aria-controls="select-listbox"
        aria-expanded=${Mt(this._opts.multiSelect?void 0:e)}
        aria-haspopup="listbox"
        aria-label=${Mt(this.label??void 0)}
        class="select-face face multiselect"
        @click=${this._onFaceClick}
        .tabIndex=${this.disabled?-1:0}
      >
        ${this._renderLabel()} ${Ee}
      </div>
    `}_renderDropdownControls(){return this._filteredOptions.length>0?U`
          <div class="dropdown-controls">
            <button
              type="button"
              @click=${this._onMultiSelectAllClick}
              title="Select all"
              class="action-icon"
              id="select-all"
            >
              <vscode-icon name="checklist"></vscode-icon>
            </button>
            <button
              type="button"
              @click=${this._onMultiDeselectAllClick}
              title="Deselect all"
              class="action-icon"
              id="select-none"
            >
              <vscode-icon name="clear-all"></vscode-icon>
            </button>
            <vscode-button
              class="button-accept"
              @click=${this._onMultiAcceptClick}
              >OK</vscode-button
            >
          </div>
        `:U`${q}`}render(){return U`
      <div class="multi-select">
        <slot class="main-slot" @slotchange=${this._onSlotChange}></slot>
        ${this.combobox?this._renderComboboxFace():this._renderSelectFace()}
        ${this._renderDropdown()}
      </div>
    `}};si.styles=ei,si.shadowRootOptions={...ht.shadowRootOptions,delegatesFocus:!0},si.formAssociated=!0,ii([pt({type:Array,attribute:"default-value"})],si.prototype,"defaultValue",void 0),ii([pt({type:Boolean,reflect:!0})],si.prototype,"required",void 0),ii([pt({reflect:!0})],si.prototype,"name",void 0),ii([pt({type:Array,attribute:!1})],si.prototype,"selectedIndexes",null),ii([pt({type:Array})],si.prototype,"value",null),ii([ft(".face")],si.prototype,"_faceElement",void 0),si=ii([kt("vscode-multi-select")],si);const oi=[$t,n`
    :host {
      display: block;
      height: 28px;
      margin: 0;
      outline: none;
      width: 28px;
    }

    .progress {
      height: 100%;
      width: 100%;
    }

    .background {
      fill: none;
      stroke: transparent;
      stroke-width: 2px;
    }

    .indeterminate-indicator-1 {
      fill: none;
      stroke: var(--vscode-progressBar-background, #0078d4);
      stroke-width: 2px;
      stroke-linecap: square;
      transform-origin: 50% 50%;
      transform: rotate(-90deg);
      transition: all 0.2s ease-in-out;
      animation: spin-infinite 2s linear infinite;
    }

    @keyframes spin-infinite {
      0% {
        stroke-dasharray: 0.01px 43.97px;
        transform: rotate(0deg);
      }
      50% {
        stroke-dasharray: 21.99px 21.99px;
        transform: rotate(450deg);
      }
      100% {
        stroke-dasharray: 0.01px 43.97px;
        transform: rotate(1080deg);
      }
    }
  `];var ri=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let ni=class extends yt{constructor(){super(...arguments),this.ariaLabel="Loading",this.ariaLive="assertive",this.role="alert"}render(){return U`<svg class="progress" part="progress" viewBox="0 0 16 16">
      <circle
        class="background"
        part="background"
        cx="8px"
        cy="8px"
        r="7px"
      ></circle>
      <circle
        class="indeterminate-indicator-1"
        part="indeterminate-indicator-1"
        cx="8px"
        cy="8px"
        r="7px"
      ></circle>
    </svg>`}};ni.styles=oi,ri([pt({reflect:!0,attribute:"aria-label"})],ni.prototype,"ariaLabel",void 0),ri([pt({reflect:!0,attribute:"aria-live"})],ni.prototype,"ariaLive",void 0),ri([pt({reflect:!0})],ni.prototype,"role",void 0),ni=ri([kt("vscode-progress-ring")],ni);const li=[$t,n`
    :host {
      display: block;
      height: 2px;
      width: 100%;
      outline: none;
    }

    .container {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .track {
      position: absolute;
      inset: 0;
      background: transparent;
    }

    .indicator {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      height: 100%;
      background: var(--vscode-progressBar-background, #0078d4);
      will-change: transform, width, left;
    }

    /* Determinate mode: width is set inline via style attribute */
    .discrete .indicator {
      transition: width 100ms linear;
    }

    /* Indeterminate mode: VS Code style progress bit */
    .infinite .indicator {
      width: 2%;
      animation-name: progress;
      animation-duration: 4s;
      animation-iteration-count: infinite;
      animation-timing-function: linear;
      transform: translate3d(0px, 0px, 0px);
    }

    /* Long running: reduce GPU pressure using stepped animation */
    .infinite.infinite-long-running .indicator {
      animation-timing-function: steps(100);
    }

    /* Keyframes adapted from VS Code */
    @keyframes progress {
      from {
        transform: translateX(0%) scaleX(1);
      }
      50% {
        transform: translateX(2500%) scaleX(3);
      }
      to {
        transform: translateX(4900%) scaleX(1);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .discrete .indicator {
        transition: none;
      }
      .infinite .indicator,
      .infinite-long-running .indicator {
        animation: none;
        width: 100%;
      }
    }
  `];var ai=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let hi=class extends yt{constructor(){super(...arguments),this.ariaLabel="Loading",this.max=100,this.indeterminate=!1,this.longRunningThreshold=15e3,this._longRunning=!1}get _isDeterminate(){return!this.indeterminate&&"number"==typeof this.value&&isFinite(this.value)}connectedCallback(){super.connectedCallback(),this._maybeStartLongRunningTimer()}disconnectedCallback(){super.disconnectedCallback(),this._clearLongRunningTimer()}willUpdate(){this._maybeStartLongRunningTimer()}render(){const t=this.max>0?this.max:100,e=this._isDeterminate?Math.min(Math.max(this.value??0,0),t):0,i=this._isDeterminate?e/t*100:0,s={container:!0,discrete:this._isDeterminate,infinite:!this._isDeterminate,"infinite-long-running":this._longRunning&&!this._isDeterminate};return U`
      <div
        class=${jt(s)}
        part="container"
        role="progressbar"
        aria-label=${this.ariaLabel}
        aria-valuemin="0"
        aria-valuemax=${String(t)}
        aria-valuenow=${Mt(this._isDeterminate?String(Math.round(e)):void 0)}
      >
        <div class="track" part="track"></div>
        <div
          class="indicator"
          part="indicator"
          .style=${Pt({width:this._isDeterminate?`${i}%`:void 0})}
        ></div>
      </div>
    `}_maybeStartLongRunningTimer(){if(!(!this._isDeterminate&&this.longRunningThreshold>0&&this.isConnected))return this._clearLongRunningTimer(),void(this._longRunning=!1);this._longRunningHandle||(this._longRunningHandle=setTimeout((()=>{this._longRunning=!0,this._longRunningHandle=void 0,this.requestUpdate()}),this.longRunningThreshold))}_clearLongRunningTimer(){this._longRunningHandle&&(clearTimeout(this._longRunningHandle),this._longRunningHandle=void 0)}};hi.styles=li,ai([pt({reflect:!0,attribute:"aria-label"})],hi.prototype,"ariaLabel",void 0),ai([pt({type:Number,reflect:!0})],hi.prototype,"value",void 0),ai([pt({type:Number,reflect:!0})],hi.prototype,"max",void 0),ai([pt({type:Boolean,reflect:!0})],hi.prototype,"indeterminate",void 0),ai([pt({type:Number,attribute:"long-running-threshold"})],hi.prototype,"longRunningThreshold",void 0),ai([vt()],hi.prototype,"_longRunning",void 0),hi=ai([kt("vscode-progress-bar")],hi);const ci=[$t,Jt,n`
    :host(:invalid) .icon,
    :host([invalid]) .icon {
      background-color: var(--vscode-inputValidation-errorBackground, #5a1d1d);
      border-color: var(--vscode-inputValidation-errorBorder, #be1100);
    }

    .icon {
      border-radius: 9px;
    }

    .icon.checked:before {
      background-color: currentColor;
      border-radius: 4px;
      content: '';
      height: 8px;
      left: 50%;
      margin: -4px 0 0 -4px;
      position: absolute;
      top: 50%;
      width: 8px;
    }

    :host(:focus):host(:not([disabled])) .icon {
      outline: 1px solid var(--vscode-focusBorder, #0078d4);
      outline-offset: -1px;
    }
  `];var di=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let ui=class extends(Xt(Wt)){get form(){return this._internals.form}get validity(){return this._internals.validity}get validationMessage(){return this._internals.validationMessage}get willValidate(){return this._internals.willValidate}constructor(){super(),this.autofocus=!1,this.checked=!1,this.defaultChecked=!1,this.invalid=!1,this.name="",this.type="radio",this.value="",this.disabled=!1,this.required=!1,this.tabIndex=0,this._slottedText="",this._handleClick=()=>{this.disabled||this.checked||(this._checkButton(),this._handleValueChange(),this.dispatchEvent(new Event("change",{bubbles:!0})))},this._handleKeyDown=t=>{this.disabled||"Enter"!==t.key&&" "!==t.key||(t.preventDefault()," "!==t.key||this.checked||(this.checked=!0,this._handleValueChange(),this.dispatchEvent(new Event("change",{bubbles:!0}))),"Enter"===t.key&&this._internals.form?.requestSubmit())},this._internals=this.attachInternals(),this.addEventListener("keydown",this._handleKeyDown),this.addEventListener("click",this._handleClick)}connectedCallback(){super.connectedCallback(),this._handleValueChange()}update(t){super.update(t),t.has("checked")&&this._handleValueChange(),t.has("required")&&this._handleValueChange()}checkValidity(){return this._internals.checkValidity()}reportValidity(){return this._internals.reportValidity()}formResetCallback(){this._getRadios().forEach((t=>{t.checked=t.defaultChecked})),this.updateComplete.then((()=>{this._handleValueChange()}))}formStateRestoreCallback(t,e){this.value===t&&""!==t&&(this.checked=!0)}setComponentValidity(t){t?this._internals.setValidity({}):this._internals.setValidity({valueMissing:!0},"Please select one of these options.",this._inputEl)}_getRadios(){const t=this.getRootNode({composed:!1});if(!t)return[];const e=t.querySelectorAll(`vscode-radio[name="${this.name}"]`);return Array.from(e)}_uncheckOthers(t){t.forEach((t=>{t!==this&&(t.checked=!1)}))}_checkButton(){const t=this._getRadios();this.checked=!0,t.forEach((t=>{t!==this&&(t.checked=!1)}))}_setGroupValidity(t,e){this.updateComplete.then((()=>{t.forEach((t=>{t.setComponentValidity(e)}))}))}_setActualFormValue(){let t="";t=this.checked?this.value?this.value:"on":null,this._internals.setFormValue(t)}_handleValueChange(){const t=this._getRadios(),e=t.some((t=>t.required));if(this._setActualFormValue(),this.checked)this._uncheckOthers(t),this._setGroupValidity(t,!0);else{const i=!!t.find((t=>t.checked)),s=e&&!i;this._setGroupValidity(t,!s)}}render(){const t=jt({icon:!0,checked:this.checked}),e=jt({"label-inner":!0,"is-slot-empty":""===this._slottedText});return U`
      <div class="wrapper">
        <input
          ?autofocus=${this.autofocus}
          id="input"
          class="radio"
          type="checkbox"
          ?checked=${this.checked}
          value=${this.value}
          tabindex=${this.tabIndex}
        >
        <div class=${t}></div>
        <label for="input" class="label" @click=${this._handleClick}>
          <span class=${e}>
            ${this._renderLabelAttribute()}
            <slot @slotchange=${this._handleSlotChange}></slot>
          </span>
        </label>
      </div>
    `}};ui.styles=ci,ui.formAssociated=!0,ui.shadowRootOptions={...ht.shadowRootOptions,delegatesFocus:!0},di([pt({type:Boolean,reflect:!0})],ui.prototype,"autofocus",void 0),di([pt({type:Boolean,reflect:!0})],ui.prototype,"checked",void 0),di([pt({type:Boolean,reflect:!0,attribute:"default-checked"})],ui.prototype,"defaultChecked",void 0),di([pt({type:Boolean,reflect:!0})],ui.prototype,"invalid",void 0),di([pt({reflect:!0})],ui.prototype,"name",void 0),di([pt()],ui.prototype,"type",void 0),di([pt()],ui.prototype,"value",void 0),di([pt({type:Boolean,reflect:!0})],ui.prototype,"disabled",void 0),di([pt({type:Boolean,reflect:!0})],ui.prototype,"required",void 0),di([pt({type:Number,reflect:!0})],ui.prototype,"tabIndex",void 0),di([vt()],ui.prototype,"_slottedText",void 0),di([ft("#input")],ui.prototype,"_inputEl",void 0),ui=di([kt("vscode-radio")],ui);const pi=[$t,n`
    :host {
      display: block;
    }

    .wrapper {
      display: flex;
      flex-wrap: wrap;
    }

    :host([variant='vertical']) .wrapper {
      display: block;
    }

    ::slotted(vscode-radio) {
      margin-right: 20px;
    }

    ::slotted(vscode-radio:last-child) {
      margin-right: 0;
    }

    :host([variant='vertical']) ::slotted(vscode-radio) {
      display: block;
      margin-bottom: 15px;
    }

    :host([variant='vertical']) ::slotted(vscode-radio:last-child) {
      margin-bottom: 0;
    }
  `];var vi=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let bi=class extends yt{constructor(){super(),this.variant="horizontal",this.role="radiogroup",this._focusedRadio=-1,this._checkedRadio=-1,this._firstContentLoaded=!1,this._handleKeyDown=t=>{const{key:e}=t;["ArrowLeft","ArrowUp","ArrowRight","ArrowDown"].includes(e)&&t.preventDefault(),"ArrowRight"!==e&&"ArrowDown"!==e||this._checkNext(),"ArrowLeft"!==e&&"ArrowUp"!==e||this._checkPrev()},this.addEventListener("keydown",this._handleKeyDown)}_uncheckPreviousChecked(t,e){-1!==t&&(this._radios[t].checked=!1),-1!==e&&(this._radios[e].tabIndex=-1)}_afterCheck(){this._focusedRadio=this._checkedRadio,this._radios[this._checkedRadio].checked=!0,this._radios[this._checkedRadio].tabIndex=0,this._radios[this._checkedRadio].focus()}_checkPrev(){const t=this._radios.findIndex((t=>t.checked)),e=this._radios.findIndex((t=>t.focused)),i=-1!==e?e:t;this._uncheckPreviousChecked(t,e),this._checkedRadio=-1===i?this._radios.length-1:i-1>=0?i-1:this._radios.length-1,this._afterCheck()}_checkNext(){const t=this._radios.findIndex((t=>t.checked)),e=this._radios.findIndex((t=>t.focused)),i=-1!==e?e:t;this._uncheckPreviousChecked(t,e),-1===i?this._checkedRadio=0:i+1<this._radios.length?this._checkedRadio=i+1:this._checkedRadio=0,this._afterCheck()}_handleChange(t){const e=this._radios.findIndex((e=>e===t.target));-1!==e&&(-1!==this._focusedRadio&&(this._radios[this._focusedRadio].tabIndex=-1),-1!==this._checkedRadio&&this._checkedRadio!==e&&(this._radios[this._checkedRadio].checked=!1),this._focusedRadio=e,this._checkedRadio=e,this._radios[e].tabIndex=0)}_handleSlotChange(){if(!this._firstContentLoaded){const t=this._radios.findIndex((t=>t.autofocus));t>-1&&(this._focusedRadio=t),this._firstContentLoaded=!0}let t=-1;this._radios.forEach(((e,i)=>{this._focusedRadio>-1?e.tabIndex=i===this._focusedRadio?0:-1:e.tabIndex=0===i?0:-1,e.defaultChecked&&(t>-1&&(this._radios[t].defaultChecked=!1),t=i)})),t>-1&&(this._radios[t].checked=!0)}render(){return U`
      <div class="wrapper">
        <slot
          @slotchange=${this._handleSlotChange}
          @change=${this._handleChange}
        ></slot>
      </div>
    `}};bi.styles=pi,vi([pt({reflect:!0})],bi.prototype,"variant",void 0),vi([pt({reflect:!0})],bi.prototype,"role",void 0),vi([mt({selector:"vscode-radio"})],bi.prototype,"_radios",void 0),vi([vt()],bi.prototype,"_focusedRadio",void 0),vi([vt()],bi.prototype,"_checkedRadio",void 0),bi=vi([kt("vscode-radio-group")],bi);var fi=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let gi=class extends ti{set selectedIndex(t){this._opts.selectedIndex=t;const e=this._opts.getOptionByIndex(t);e?(this._opts.activeIndex=t,this._value=e.value,this._internals.setFormValue(this._value),this._manageRequired()):(this._value="",this._internals.setFormValue(""),this._manageRequired())}get selectedIndex(){return this._opts.selectedIndex}set value(t){this._opts.value=t,this._opts.selectedIndex>-1?this._requestedValueToSetLater="":this._requestedValueToSetLater=t,this._internals.setFormValue(this._value),this._manageRequired()}get value(){return this._opts.value}get validity(){return this._internals.validity}get validationMessage(){return this._internals.validationMessage}get willValidate(){return this._internals.willValidate}checkValidity(){return this._internals.checkValidity()}reportValidity(){return this._internals.reportValidity()}updateInputValue(){if(!this.combobox)return;const t=this.renderRoot.querySelector(".combobox-input");if(t){const e=this._opts.getSelectedOption();t.value=e?.label??""}}constructor(){super(),this.defaultValue="",this.name=void 0,this.required=!1,this._requestedValueToSetLater="",this._opts.multiSelect=!1,this._internals=this.attachInternals()}connectedCallback(){super.connectedCallback(),this.updateComplete.then((()=>{this._manageRequired()}))}formResetCallback(){this.value=this.defaultValue}formStateRestoreCallback(t,e){this.updateComplete.then((()=>{this.value=t}))}get type(){return"select-one"}get form(){return this._internals.form}async _createAndSelectSuggestedOption(){const t=this._createSuggestedOption();await this.updateComplete,this._opts.selectedIndex=t,this._dispatchChangeEvent();const e=new CustomEvent("vsc-single-select-create-option",{detail:{value:this._opts.getOptionByIndex(t)?.value??""}});this.dispatchEvent(e),this.open=!1,this._isPlaceholderOptionActive=!1}_setStateFromSlottedElements(){super._setStateFromSlottedElements(),this.combobox||0!==this._opts.selectedIndexes.length||(this._opts.selectedIndex=this._opts.options.length>0?0:-1)}_onSlotChange(){if(super._onSlotChange(),this._requestedValueToSetLater){const t=this._opts.getOptionByValue(this._requestedValueToSetLater);t&&(this._opts.selectedIndex=t.index,this._requestedValueToSetLater="")}this._opts.selectedIndex>-1&&this._opts.numOptions>0?(this._internals.setFormValue(this._opts.value),this._manageRequired()):(this._internals.setFormValue(null),this._manageRequired())}_onEnterKeyDown(t){super._onEnterKeyDown(t);let e=!1;this.combobox?this.open?this._isPlaceholderOptionActive?this._createAndSelectSuggestedOption():(e=this._opts.activeIndex!==this._opts.selectedIndex,this._opts.selectedIndex=this._opts.activeIndex,this.open=!1):(this.open=!0,this._scrollActiveElementToTop()):this.open?(e=this._opts.activeIndex!==this._opts.selectedIndex,this._opts.selectedIndex=this._opts.activeIndex,this.open=!1):(this.open=!0,this._scrollActiveElementToTop()),e&&(this._dispatchChangeEvent(),this.updateInputValue(),this._internals.setFormValue(this._opts.value),this._manageRequired())}_onOptionClick(t){super._onOptionClick(t);const e=t.composedPath().find((t=>{if("matches"in t)return t.matches("li.option")}));if(!e||e.matches(".disabled"))return;e.classList.contains("placeholder")?this.creatable&&this._createAndSelectSuggestedOption():(this._opts.selectedIndex=Number(e.dataset.index),this.open=!1,this._internals.setFormValue(this._value),this._manageRequired(),this._dispatchChangeEvent())}_manageRequired(){const{value:t}=this;""===t&&this.required?this._internals.setValidity({valueMissing:!0},"Please select an item in the list.",this._face):this._internals.setValidity({})}_renderSelectFace(){const t=this._opts.getSelectedOption(),e=t?.label??"",i=this._opts.activeIndex>-1?`op-${this._opts.activeIndex}`:"";return U`
      <div
        aria-activedescendant=${i}
        aria-controls="select-listbox"
        aria-expanded=${this.open?"true":"false"}
        aria-haspopup="listbox"
        aria-label=${Mt(this.label)}
        class="select-face face"
        @click=${this._onFaceClick}
        role="combobox"
        tabindex="0"
      >
        <span class="text">${e}</span> ${Ee}
      </div>
    `}_renderComboboxFace(){let t="";if(this._isBeingFiltered)t=this._opts.filterPattern;else{const e=this._opts.getSelectedOption();t=e?.label??""}const e=this._opts.activeIndex>-1?`op-${this._opts.activeIndex}`:"",i=this.open?"true":"false";return U`
      <div class="combobox-face face">
        <input
          aria-activedescendant=${e}
          aria-autocomplete="list"
          aria-controls="select-listbox"
          aria-expanded=${i}
          aria-haspopup="listbox"
          aria-label=${Mt(this.label)}
          class="combobox-input"
          role="combobox"
          spellcheck="false"
          type="text"
          autocomplete="off"
          .value=${t}
          @focus=${this._onComboboxInputFocus}
          @blur=${this._onComboboxInputBlur}
          @input=${this._onComboboxInputInput}
          @click=${this._onComboboxInputClick}
          @keydown=${this._onComboboxInputSpaceKeyDown}
        >
        <button
          aria-label="Open the list of options"
          class="combobox-button"
          type="button"
          @click=${this._onComboboxButtonClick}
          @keydown=${this._onComboboxButtonKeyDown}
          tabindex="-1"
        >
          ${Ee}
        </button>
      </div>
    `}render(){return U`
      <div class="single-select">
        <slot class="main-slot" @slotchange=${this._onSlotChange}></slot>
        ${this.combobox?this._renderComboboxFace():this._renderSelectFace()}
        ${this._renderDropdown()}
      </div>
    `}};gi.styles=ei,gi.shadowRootOptions={...ht.shadowRootOptions,delegatesFocus:!0},gi.formAssociated=!0,fi([pt({attribute:"default-value"})],gi.prototype,"defaultValue",void 0),fi([pt({reflect:!0})],gi.prototype,"name",void 0),fi([pt({type:Number,attribute:"selected-index"})],gi.prototype,"selectedIndex",null),fi([pt({type:String})],gi.prototype,"value",null),fi([pt({type:Boolean,reflect:!0})],gi.prototype,"required",void 0),fi([ft(".face")],gi.prototype,"_face",void 0),gi=fi([kt("vscode-single-select")],gi);const mi=[$t,n`
    :host {
      --separator-border: var(--vscode-editorWidget-border, #454545);

      border: 1px solid var(--vscode-editorWidget-border, #454545);
      display: block;
      overflow: hidden;
      position: relative;
    }

    ::slotted(*) {
      height: 100%;
      width: 100%;
    }

    ::slotted(vscode-split-layout) {
      border: 0;
    }

    .wrapper {
      display: flex;
      height: 100%;
      width: 100%;
    }

    .wrapper.horizontal {
      flex-direction: column;
    }

    .start {
      box-sizing: border-box;
      flex: 1;
      min-height: 0;
      min-width: 0;
    }

    :host([split='vertical']) .start {
      border-right: 1px solid var(--separator-border);
    }

    :host([split='horizontal']) .start {
      border-bottom: 1px solid var(--separator-border);
    }

    .end {
      flex: 1;
      min-height: 0;
      min-width: 0;
    }

    :host([split='vertical']) .start,
    :host([split='vertical']) .end {
      height: 100%;
    }

    :host([split='horizontal']) .start,
    :host([split='horizontal']) .end {
      width: 100%;
    }

    .handle-overlay {
      display: none;
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: 100%;
      z-index: 1;
    }

    .handle-overlay.active {
      display: block;
    }

    .handle-overlay.split-vertical {
      cursor: ew-resize;
    }

    .handle-overlay.split-horizontal {
      cursor: ns-resize;
    }

    .handle {
      background-color: transparent;
      position: absolute;
      z-index: 2;
    }

    .handle.hover {
      transition: background-color 0.1s ease-out 0.3s;
      background-color: var(--vscode-sash-hoverBorder, #0078d4);
    }

    .handle.hide {
      background-color: transparent;
      transition: background-color 0.1s ease-out;
    }

    .handle.split-vertical {
      cursor: ew-resize;
      height: 100%;
    }

    .handle.split-horizontal {
      cursor: ns-resize;
      width: 100%;
    }
  `];var xi,wi=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};const yi=t=>{if(!t)return{value:0,unit:"pixel"};let e,i;t.endsWith("%")?(e="percent",i=+t.substring(0,t.length-1)):t.endsWith("px")?(e="pixel",i=+t.substring(0,t.length-2)):(e="pixel",i=+t);return{unit:e,value:isNaN(i)?0:i}},ki=(t,e)=>0===e?0:Math.min(100,t/e*100),$i=(t,e)=>e*(t/100);let _i=xi=class extends yt{set split(t){this._split!==t&&(this._split=t,this.resetHandlePosition())}get split(){return this._split}set handlePosition(t){this._rawHandlePosition=t,this._handlePositionPropChanged()}get handlePosition(){return this._rawHandlePosition}set fixedPane(t){this._fixedPane=t,this._fixedPanePropChanged()}get fixedPane(){return this._fixedPane}constructor(){super(),this._split="vertical",this.resetOnDblClick=!1,this.handleSize=4,this.initialHandlePosition="50%",this._fixedPane="none",this._handlePosition=0,this._isDragActive=!1,this._hover=!1,this._hide=!1,this._boundRect=new DOMRect,this._handleOffset=0,this._wrapperObserved=!1,this._fixedPaneSize=0,this._handleResize=t=>{const e=t[0].contentRect,{width:i,height:s}=e;this._boundRect=e;const o="vertical"===this.split?i:s;"start"===this.fixedPane&&(this._handlePosition=this._fixedPaneSize),"end"===this.fixedPane&&(this._handlePosition=o-this._fixedPaneSize)},this._handleMouseUp=t=>{this._isDragActive=!1,t.target!==this&&(this._hover=!1,this._hide=!0),window.removeEventListener("mouseup",this._handleMouseUp),window.removeEventListener("mousemove",this._handleMouseMove);const{width:e,height:i}=this._boundRect,s="vertical"===this.split?e:i,o=ki(this._handlePosition,s);this.dispatchEvent(new CustomEvent("vsc-split-layout-change",{detail:{position:this._handlePosition,positionInPercentage:o},composed:!0}))},this._handleMouseMove=t=>{const{clientX:e,clientY:i}=t,{left:s,top:o,height:r,width:n}=this._boundRect,l="vertical"===this.split,a=l?n:r,h=l?e-s:i-o;this._handlePosition=Math.max(0,Math.min(h-this._handleOffset+this.handleSize/2,a)),"start"===this.fixedPane&&(this._fixedPaneSize=this._handlePosition),"end"===this.fixedPane&&(this._fixedPaneSize=a-this._handlePosition)},this._resizeObserver=new ResizeObserver(this._handleResize)}resetHandlePosition(){if(!this._wrapperEl)return void(this._handlePosition=0);const{width:t,height:e}=this._wrapperEl.getBoundingClientRect(),i="vertical"===this.split?t:e,{value:s,unit:o}=yi(this.initialHandlePosition??"50%");this._handlePosition="percent"===o?$i(s,i):s}connectedCallback(){super.connectedCallback()}firstUpdated(t){"none"!==this.fixedPane&&(this._resizeObserver.observe(this._wrapperEl),this._wrapperObserved=!0),this._boundRect=this._wrapperEl.getBoundingClientRect();const{value:e,unit:i}=this.handlePosition?yi(this.handlePosition):yi(this.initialHandlePosition);this._setPosition(e,i),this._initFixedPane()}_handlePositionPropChanged(){if(this.handlePosition&&this._wrapperEl){this._boundRect=this._wrapperEl.getBoundingClientRect();const{value:t,unit:e}=yi(this.handlePosition);this._setPosition(t,e)}}_fixedPanePropChanged(){this._wrapperEl&&this._initFixedPane()}_initFixedPane(){if("none"===this.fixedPane)this._wrapperObserved&&(this._resizeObserver.unobserve(this._wrapperEl),this._wrapperObserved=!1);else{const{width:t,height:e}=this._boundRect,i="vertical"===this.split?t:e;this._fixedPaneSize="start"===this.fixedPane?this._handlePosition:i-this._handlePosition,this._wrapperObserved||(this._resizeObserver.observe(this._wrapperEl),this._wrapperObserved=!0)}}_setPosition(t,e){const{width:i,height:s}=this._boundRect,o="vertical"===this.split?i:s;this._handlePosition="percent"===e?$i(t,o):t}_handleMouseOver(){this._hover=!0,this._hide=!1}_handleMouseOut(t){1!==t.buttons&&(this._hover=!1,this._hide=!0)}_handleMouseDown(t){t.stopPropagation(),t.preventDefault(),this._boundRect=this._wrapperEl.getBoundingClientRect();const{left:e,top:i}=this._boundRect,{left:s,top:o}=this._handleEl.getBoundingClientRect(),r=t.clientX-e,n=t.clientY-i;"vertical"===this.split&&(this._handleOffset=r-(s-e)),"horizontal"===this.split&&(this._handleOffset=n-(o-i)),this._isDragActive=!0,window.addEventListener("mouseup",this._handleMouseUp),window.addEventListener("mousemove",this._handleMouseMove)}_handleDblClick(){this.resetOnDblClick&&this.resetHandlePosition()}_handleSlotChange(){[...this._nestedLayoutsAtStart,...this._nestedLayoutsAtEnd].forEach((t=>{t instanceof xi&&t.resetHandlePosition()}))}render(){const{width:t,height:e}=this._boundRect,i="vertical"===this.split?t:e,s="none"!==this.fixedPane?`${this._handlePosition}px`:`${ki(this._handlePosition,i)}%`;let o="";o="start"===this.fixedPane?`0 0 ${this._fixedPaneSize}px`:`1 1 ${ki(this._handlePosition,i)}%`;let r="";r="end"===this.fixedPane?`0 0 ${this._fixedPaneSize}px`:`1 1 ${ki(i-this._handlePosition,i)}%`;const n={left:"vertical"===this.split?s:"0",top:"vertical"===this.split?"0":s},l=this.handleSize??4;"vertical"===this.split&&(n.marginLeft=0-l/2+"px",n.width=`${l}px`),"horizontal"===this.split&&(n.height=`${l}px`,n.marginTop=0-l/2+"px");const a=jt({"handle-overlay":!0,active:this._isDragActive,"split-vertical":"vertical"===this.split,"split-horizontal":"horizontal"===this.split}),h=jt({handle:!0,hover:this._hover,hide:this._hide,"split-vertical":"vertical"===this.split,"split-horizontal":"horizontal"===this.split}),c={wrapper:!0,horizontal:"horizontal"===this.split};return U`
      <div class=${jt(c)}>
        <div class="start" .style=${Pt({flex:o})}>
          <slot name="start" @slotchange=${this._handleSlotChange}></slot>
        </div>
        <div class="end" .style=${Pt({flex:r})}>
          <slot name="end" @slotchange=${this._handleSlotChange}></slot>
        </div>
        <div class=${a}></div>
        <div
          class=${h}
          .style=${Pt(n)}
          @mouseover=${this._handleMouseOver}
          @mouseout=${this._handleMouseOut}
          @mousedown=${this._handleMouseDown}
          @dblclick=${this._handleDblClick}
        ></div>
      </div>
    `}};_i.styles=mi,wi([pt({reflect:!0})],_i.prototype,"split",null),wi([pt({type:Boolean,reflect:!0,attribute:"reset-on-dbl-click"})],_i.prototype,"resetOnDblClick",void 0),wi([pt({type:Number,reflect:!0,attribute:"handle-size"})],_i.prototype,"handleSize",void 0),wi([pt({reflect:!0,attribute:"initial-handle-position"})],_i.prototype,"initialHandlePosition",void 0),wi([pt({attribute:"handle-position"})],_i.prototype,"handlePosition",null),wi([pt({attribute:"fixed-pane"})],_i.prototype,"fixedPane",null),wi([vt()],_i.prototype,"_handlePosition",void 0),wi([vt()],_i.prototype,"_isDragActive",void 0),wi([vt()],_i.prototype,"_hover",void 0),wi([vt()],_i.prototype,"_hide",void 0),wi([ft(".wrapper")],_i.prototype,"_wrapperEl",void 0),wi([ft(".handle")],_i.prototype,"_handleEl",void 0),wi([mt({slot:"start",selector:"vscode-split-layout"})],_i.prototype,"_nestedLayoutsAtStart",void 0),wi([mt({slot:"end",selector:"vscode-split-layout"})],_i.prototype,"_nestedLayoutsAtEnd",void 0),_i=xi=wi([kt("vscode-split-layout")],_i);const Si=[$t,n`
    :host {
      cursor: pointer;
      display: block;
      user-select: none;
    }

    .wrapper {
      align-items: center;
      border-bottom: 1px solid transparent;
      color: var(--vscode-foreground, #cccccc);
      display: flex;
      min-height: 20px;
      overflow: hidden;
      padding: 7px 8px;
      position: relative;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :host([active]) .wrapper {
      border-bottom-color: var(--vscode-panelTitle-activeForeground, #cccccc);
      color: var(--vscode-panelTitle-activeForeground, #cccccc);
    }

    :host([panel]) .wrapper {
      border-bottom: 0;
      margin-bottom: 0;
      padding: 0;
    }

    :host(:focus-visible) {
      outline: none;
    }

    .wrapper {
      align-items: center;
      color: var(--vscode-foreground, #cccccc);
      display: flex;
      min-height: 20px;
      overflow: inherit;
      text-overflow: inherit;
      position: relative;
    }

    .wrapper.panel {
      color: var(--vscode-panelTitle-inactiveForeground, #9d9d9d);
    }

    .wrapper.panel.active,
    .wrapper.panel:hover {
      color: var(--vscode-panelTitle-activeForeground, #cccccc);
    }

    :host([panel]) .wrapper {
      display: flex;
      font-size: 11px;
      height: 31px;
      padding: 2px 10px;
      text-transform: uppercase;
    }

    .main {
      overflow: inherit;
      text-overflow: inherit;
    }

    .active-indicator {
      display: none;
    }

    .active-indicator.panel.active {
      border-top: 1px solid var(--vscode-panelTitle-activeBorder, #0078d4);
      bottom: 4px;
      display: block;
      left: 8px;
      pointer-events: none;
      position: absolute;
      right: 8px;
    }

    :host(:focus-visible) .wrapper {
      outline-color: var(--vscode-focusBorder, #0078d4);
      outline-offset: 3px;
      outline-style: solid;
      outline-width: 1px;
    }

    :host(:focus-visible) .wrapper.panel {
      outline-offset: -2px;
    }

    slot[name='content-before']::slotted(vscode-badge) {
      margin-right: 8px;
    }

    slot[name='content-after']::slotted(vscode-badge) {
      margin-left: 8px;
    }
  `];var Bi=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Ci=class extends yt{constructor(){super(...arguments),this.active=!1,this.ariaControls="",this.panel=!1,this.role="tab",this.tabId=-1}attributeChangedCallback(t,e,i){if(super.attributeChangedCallback(t,e,i),"active"===t){const t=null!==i;this.ariaSelected=t?"true":"false",this.tabIndex=t?0:-1}}render(){return U`
      <div
        class=${jt({wrapper:!0,active:this.active,panel:this.panel})}
      >
        <div class="before"><slot name="content-before"></slot></div>
        <div class="main"><slot></slot></div>
        <div class="after"><slot name="content-after"></slot></div>
        <span
          class=${jt({"active-indicator":!0,active:this.active,panel:this.panel})}
        ></span>
      </div>
    `}};Ci.styles=Si,Bi([pt({type:Boolean,reflect:!0})],Ci.prototype,"active",void 0),Bi([pt({reflect:!0,attribute:"aria-controls"})],Ci.prototype,"ariaControls",void 0),Bi([pt({type:Boolean,reflect:!0})],Ci.prototype,"panel",void 0),Bi([pt({reflect:!0})],Ci.prototype,"role",void 0),Bi([pt({type:Number,reflect:!0,attribute:"tab-id"})],Ci.prototype,"tabId",void 0),Ci=Bi([kt("vscode-tab-header")],Ci);const Oi=[$t,n`
    :host {
      display: block;
      overflow: hidden;
    }

    :host(:focus-visible) {
      outline-color: var(--vscode-focusBorder, #0078d4);
      outline-offset: 3px;
      outline-style: solid;
      outline-width: 1px;
    }

    :host([panel]) {
      background-color: var(--vscode-panel-background, #181818);
    }
  `];var Ai=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let zi=class extends yt{constructor(){super(...arguments),this.hidden=!1,this.ariaLabelledby="",this.panel=!1,this.role="tabpanel",this.tabIndex=0}render(){return U` <slot></slot> `}};zi.styles=Oi,Ai([pt({type:Boolean,reflect:!0})],zi.prototype,"hidden",void 0),Ai([pt({reflect:!0,attribute:"aria-labelledby"})],zi.prototype,"ariaLabelledby",void 0),Ai([pt({type:Boolean,reflect:!0})],zi.prototype,"panel",void 0),Ai([pt({reflect:!0})],zi.prototype,"role",void 0),Ai([pt({type:Number,reflect:!0})],zi.prototype,"tabIndex",void 0),zi=Ai([kt("vscode-tab-panel")],zi);const Ei=[$t,n`
    :host {
      display: table;
      table-layout: fixed;
      width: 100%;
    }

    ::slotted(vscode-table-row:nth-child(even)) {
      background-color: var(--vsc-row-even-background);
    }

    ::slotted(vscode-table-row:nth-child(odd)) {
      background-color: var(--vsc-row-odd-background);
    }
  `];var Ii=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let ji=class extends yt{constructor(){super(...arguments),this.role="rowgroup"}render(){return U` <slot></slot> `}};ji.styles=Ei,Ii([pt({reflect:!0})],ji.prototype,"role",void 0),ji=Ii([kt("vscode-table-body")],ji);const Mi=[$t,n`
    :host {
      border-bottom-color: var(
        --vscode-editorGroup-border,
        rgba(255, 255, 255, 0.09)
      );
      border-bottom-style: solid;
      border-bottom-width: var(--vsc-row-border-bottom-width);
      box-sizing: border-box;
      color: var(--vscode-foreground, #cccccc);
      display: table-cell;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      height: 24px;
      overflow: hidden;
      padding-left: 10px;
      text-overflow: ellipsis;
      vertical-align: middle;
      white-space: nowrap;
    }

    :host([compact]) {
      display: block;
      height: auto;
      padding-bottom: 5px;
      width: 100% !important;
    }

    :host([compact]:first-child) {
      padding-top: 10px;
    }

    :host([compact]:last-child) {
      padding-bottom: 10px;
    }

    .wrapper {
      overflow: inherit;
      text-overflow: inherit;
      white-space: inherit;
      width: 100%;
    }

    .column-label {
      font-weight: bold;
    }
  `];var Pi=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Di=class extends yt{constructor(){super(...arguments),this.role="cell",this.columnLabel="",this.compact=!1}render(){const t=this.columnLabel?U`<div class="column-label" role="presentation">
          ${this.columnLabel}
        </div>`:q;return U`
      <div class="wrapper">
        ${t}
        <slot></slot>
      </div>
    `}};Di.styles=Mi,Pi([pt({reflect:!0})],Di.prototype,"role",void 0),Pi([pt({attribute:"column-label"})],Di.prototype,"columnLabel",void 0),Pi([pt({type:Boolean,reflect:!0})],Di.prototype,"compact",void 0),Di=Pi([kt("vscode-table-cell")],Di);const Fi=[$t,n`
    :host {
      background-color: var(
        --vscode-keybindingTable-headerBackground,
        rgba(204, 204, 204, 0.04)
      );
      display: table;
      table-layout: fixed;
      width: 100%;
    }
  `];var Vi=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Ti=class extends yt{constructor(){super(...arguments),this.role="rowgroup"}render(){return U` <slot></slot> `}};Ti.styles=Fi,Vi([pt({reflect:!0})],Ti.prototype,"role",void 0),Ti=Vi([kt("vscode-table-header")],Ti);const Ni=[$t,n`
    :host {
      box-sizing: border-box;
      color: var(--vscode-foreground, #cccccc);
      display: table-cell;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: bold;
      line-height: 20px;
      overflow: hidden;
      padding-bottom: 5px;
      padding-left: 10px;
      padding-right: 0;
      padding-top: 5px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wrapper {
      box-sizing: inherit;
      overflow: inherit;
      text-overflow: inherit;
      white-space: inherit;
      width: 100%;
    }
  `];var Ri=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Li=class extends yt{constructor(){super(...arguments),this.role="columnheader"}render(){return U`
      <div class="wrapper">
        <slot></slot>
      </div>
    `}};Li.styles=Ni,Ri([pt({reflect:!0})],Li.prototype,"role",void 0),Li=Ri([kt("vscode-table-header-cell")],Li);const Ui=[$t,n`
    :host {
      border-top-color: var(
        --vscode-editorGroup-border,
        rgba(255, 255, 255, 0.09)
      );
      border-top-style: solid;
      border-top-width: var(--vsc-row-border-top-width);
      display: var(--vsc-row-display);
      width: 100%;
    }
  `];var Gi=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Hi=class extends yt{constructor(){super(...arguments),this.role="row"}render(){return U` <slot></slot> `}};Hi.styles=Ui,Gi([pt({reflect:!0})],Hi.prototype,"role",void 0),Hi=Gi([kt("vscode-table-row")],Hi);const qi=(t,e)=>{if("number"!=typeof t||Number.isNaN(t)){if("string"==typeof t&&/^[0-9.]+$/.test(t)){return Number(t)/e*100}if("string"==typeof t&&/^[0-9.]+%$/.test(t))return Number(t.substring(0,t.length-1));if("string"==typeof t&&/^[0-9.]+px$/.test(t)){return Number(t.substring(0,t.length-2))/e*100}return null}return t/e*100},Wi=[$t,n`
    :host {
      display: block;
      --vsc-row-even-background: transparent;
      --vsc-row-odd-background: transparent;
      --vsc-row-border-bottom-width: 0;
      --vsc-row-border-top-width: 0;
      --vsc-row-display: table-row;
    }

    :host([bordered]),
    :host([bordered-rows]) {
      --vsc-row-border-bottom-width: 1px;
    }

    :host([compact]) {
      --vsc-row-display: block;
    }

    :host([bordered][compact]),
    :host([bordered-rows][compact]) {
      --vsc-row-border-bottom-width: 0;
      --vsc-row-border-top-width: 1px;
    }

    :host([zebra]) {
      --vsc-row-even-background: var(
        --vscode-keybindingTable-rowsBackground,
        rgba(204, 204, 204, 0.04)
      );
    }

    :host([zebra-odd]) {
      --vsc-row-odd-background: var(
        --vscode-keybindingTable-rowsBackground,
        rgba(204, 204, 204, 0.04)
      );
    }

    ::slotted(vscode-table-row) {
      width: 100%;
    }

    .wrapper {
      height: 100%;
      max-width: 100%;
      overflow: hidden;
      position: relative;
      width: 100%;
    }

    .wrapper.select-disabled {
      user-select: none;
    }

    .wrapper.resize-cursor {
      cursor: ew-resize;
    }

    .wrapper.compact-view .header-slot-wrapper {
      height: 0;
      overflow: hidden;
    }

    .scrollable {
      height: 100%;
    }

    .scrollable:before {
      background-color: transparent;
      content: '';
      display: block;
      height: 1px;
      position: absolute;
      width: 100%;
    }

    .wrapper:not(.compact-view) .scrollable:not([scrolled]):before {
      background-color: var(
        --vscode-editorGroup-border,
        rgba(255, 255, 255, 0.09)
      );
    }

    .sash {
      visibility: hidden;
    }

    :host([bordered-columns]) .sash,
    :host([bordered]) .sash {
      visibility: visible;
    }

    :host([resizable]) .wrapper:hover .sash {
      visibility: visible;
    }

    .sash {
      height: 100%;
      position: absolute;
      top: 0;
      width: 1px;
    }

    .wrapper.compact-view .sash {
      display: none;
    }

    .sash.resizable {
      cursor: ew-resize;
    }

    .sash-visible {
      background-color: var(
        --vscode-editorGroup-border,
        rgba(255, 255, 255, 0.09)
      );
      height: 100%;
      position: absolute;
      top: 30px;
      width: 1px;
    }

    .sash.hover .sash-visible {
      background-color: var(--vscode-sash-hoverBorder, #0078d4);
      transition: background-color 50ms linear 300ms;
    }

    .sash .sash-clickable {
      background-color: transparent;
      height: 100%;
      left: -2px;
      position: absolute;
      width: 5px;
    }
  `];var Ki=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Xi=class extends yt{constructor(){super(...arguments),this.role="table",this.resizable=!1,this.responsive=!1,this.bordered=!1,this.borderedColumns=!1,this.borderedRows=!1,this.breakpoint=300,this.minColumnWidth="50px",this.delayedResizing=!1,this.compact=!1,this.zebra=!1,this.zebraOdd=!1,this._sashPositions=[],this._isDragging=!1,this._sashHovers=[],this._columns=[],this._activeSashElementIndex=-1,this._activeSashCursorOffset=0,this._componentX=0,this._componentH=0,this._componentW=0,this._headerCells=[],this._cellsOfFirstRow=[],this._prevHeaderHeight=0,this._prevComponentHeight=0,this._componentResizeObserverCallback=()=>{this._memoizeComponentDimensions(),this._updateResizeHandlersSize(),this.responsive&&this._toggleCompactView(),this._resizeTableBody()},this._headerResizeObserverCallback=()=>{this._updateResizeHandlersSize()},this._bodyResizeObserverCallback=()=>{this._resizeTableBody()},this._onResizingMouseMove=t=>{t.stopPropagation(),this._updateActiveSashPosition(t.pageX),this.delayedResizing?this._resizeColumns(!1):this._resizeColumns(!0)},this._onResizingMouseUp=t=>{this._resizeColumns(!0),this._updateActiveSashPosition(t.pageX),this._sashHovers[this._activeSashElementIndex]=!1,this._isDragging=!1,this._activeSashElementIndex=-1,document.removeEventListener("mousemove",this._onResizingMouseMove),document.removeEventListener("mouseup",this._onResizingMouseUp)}}set columns(t){this._columns=t,this.isConnected&&this._initDefaultColumnSizes()}get columns(){return this._columns}connectedCallback(){super.connectedCallback(),this._memoizeComponentDimensions(),this._initDefaultColumnSizes()}disconnectedCallback(){super.disconnectedCallback(),this._componentResizeObserver?.unobserve(this),this._componentResizeObserver?.disconnect(),this._bodyResizeObserver?.disconnect()}_px2Percent(t){return t/this._componentW*100}_percent2Px(t){return this._componentW*t/100}_memoizeComponentDimensions(){const t=this.getBoundingClientRect();this._componentH=t.height,this._componentW=t.width,this._componentX=t.x}_queryHeaderCells(){const t=this._assignedHeaderElements;return t&&t[0]?Array.from(t[0].querySelectorAll("vscode-table-header-cell")):[]}_getHeaderCells(){return this._headerCells.length||(this._headerCells=this._queryHeaderCells()),this._headerCells}_queryCellsOfFirstRow(){const t=this._assignedBodyElements;return t&&t[0]?Array.from(t[0].querySelectorAll("vscode-table-row:first-child vscode-table-cell")):[]}_getCellsOfFirstRow(){return this._cellsOfFirstRow.length||(this._cellsOfFirstRow=this._queryCellsOfFirstRow()),this._cellsOfFirstRow}_resizeTableBody(){let t=0,e=0;const i=this.getBoundingClientRect().height;this._assignedHeaderElements&&this._assignedHeaderElements.length&&(t=this._assignedHeaderElements[0].getBoundingClientRect().height),this._assignedBodyElements&&this._assignedBodyElements.length&&(e=this._assignedBodyElements[0].getBoundingClientRect().height);const s=e-t-i;this._scrollableElement.style.height=s>0?i-t+"px":"auto"}_initResizeObserver(){this._componentResizeObserver=new ResizeObserver(this._componentResizeObserverCallback),this._componentResizeObserver.observe(this),this._headerResizeObserver=new ResizeObserver(this._headerResizeObserverCallback),this._headerResizeObserver.observe(this._headerElement)}_calcColWidthPercentages(){const t=this._getHeaderCells().length;let e=this.columns.slice(0,t);const i=e.filter((t=>"auto"===t)).length+t-e.length;let s=100;if(e=e.map((t=>{const e=qi(t,this._componentW);return null===e?"auto":(s-=e,e)})),e.length<t)for(let i=e.length;i<t;i++)e.push("auto");return e=e.map((t=>"auto"===t?s/i:t)),e}_initHeaderCellSizes(t){this._getHeaderCells().forEach(((e,i)=>{e.style.width=`${t[i]}%`}))}_initBodyColumnSizes(t){this._getCellsOfFirstRow().forEach(((e,i)=>{e.style.width=`${t[i]}%`}))}_initSashes(t){const e=t.length;let i=0;this._sashPositions=[],t.forEach(((t,s)=>{if(s<e-1){const e=i+t;this._sashPositions.push(e),i=e}}))}_initDefaultColumnSizes(){const t=this._calcColWidthPercentages();this._initHeaderCellSizes(t),this._initBodyColumnSizes(t),this._initSashes(t)}_updateResizeHandlersSize(){const t=this._headerElement.getBoundingClientRect();if(t.height===this._prevHeaderHeight&&this._componentH===this._prevComponentHeight)return;this._prevHeaderHeight=t.height,this._prevComponentHeight=this._componentH;const e=this._componentH-t.height;this._sashVisibleElements.forEach((i=>{i.style.height=`${e}px`,i.style.top=`${t.height}px`}))}_applyCompactViewColumnLabels(){const t=this._getHeaderCells().map((t=>t.innerText));this.querySelectorAll("vscode-table-row").forEach((e=>{e.querySelectorAll("vscode-table-cell").forEach(((e,i)=>{e.columnLabel=t[i],e.compact=!0}))}))}_clearCompactViewColumnLabels(){this.querySelectorAll("vscode-table-cell").forEach((t=>{t.columnLabel="",t.compact=!1}))}_toggleCompactView(){const t=this.getBoundingClientRect().width<this.breakpoint;this.compact!==t&&(this.compact=t,t?this._applyCompactViewColumnLabels():this._clearCompactViewColumnLabels())}_onDefaultSlotChange(){this._assignedElements.forEach((t=>{"vscode-table-header"!==t.tagName.toLowerCase()?"vscode-table-body"!==t.tagName.toLowerCase()||(t.slot="body"):t.slot="header"}))}_onHeaderSlotChange(){this._headerCells=this._queryHeaderCells()}_onBodySlotChange(){if(this._initDefaultColumnSizes(),this._initResizeObserver(),this._updateResizeHandlersSize(),!this._bodyResizeObserver){const t=this._assignedBodyElements[0]??null;t&&(this._bodyResizeObserver=new ResizeObserver(this._bodyResizeObserverCallback),this._bodyResizeObserver.observe(t))}}_onSashMouseOver(t){if(this._isDragging)return;const e=t.currentTarget,i=Number(e.dataset.index);this._sashHovers[i]=!0,this.requestUpdate()}_onSashMouseOut(t){if(t.stopPropagation(),this._isDragging)return;const e=t.currentTarget,i=Number(e.dataset.index);this._sashHovers[i]=!1,this.requestUpdate()}_onSashMouseDown(t){t.stopPropagation();const{pageX:e,currentTarget:i}=t,s=i,o=Number(s.dataset.index),r=s.getBoundingClientRect().x;this._isDragging=!0,this._activeSashElementIndex=o,this._sashHovers[this._activeSashElementIndex]=!0,this._activeSashCursorOffset=this._px2Percent(e-r);const n=this._getHeaderCells();this._headerCellsToResize=[],this._headerCellsToResize.push(n[o]),n[o+1]&&(this._headerCellsToResize[1]=n[o+1]);const l=this._bodySlot.assignedElements()[0].querySelectorAll("vscode-table-row:first-child > vscode-table-cell");this._cellsToResize=[],this._cellsToResize.push(l[o]),l[o+1]&&this._cellsToResize.push(l[o+1]),document.addEventListener("mousemove",this._onResizingMouseMove),document.addEventListener("mouseup",this._onResizingMouseUp)}_updateActiveSashPosition(t){const{prevSashPos:e,nextSashPos:i}=this._getSashPositions();let s=qi(this.minColumnWidth,this._componentW);null===s&&(s=0);const o=e?e+s:s,r=i?i-s:100-s;let n=this._px2Percent(t-this._componentX-this._percent2Px(this._activeSashCursorOffset));n=Math.max(n,o),n=Math.min(n,r),this._sashPositions[this._activeSashElementIndex]=n,this.requestUpdate()}_getSashPositions(){return{sashPos:this._sashPositions[this._activeSashElementIndex],prevSashPos:this._sashPositions[this._activeSashElementIndex-1]||0,nextSashPos:this._sashPositions[this._activeSashElementIndex+1]||100}}_resizeColumns(t=!0){const{sashPos:e,prevSashPos:i,nextSashPos:s}=this._getSashPositions(),o=`${e-i}%`,r=`${s-e}%`;this._headerCellsToResize[0].style.width=o,this._headerCellsToResize[1]&&(this._headerCellsToResize[1].style.width=r),t&&this._cellsToResize[0]&&(this._cellsToResize[0].style.width=o,this._cellsToResize[1]&&(this._cellsToResize[1].style.width=r))}render(){const t=this._sashPositions.map(((t,e)=>{const i=jt({sash:!0,hover:this._sashHovers[e],resizable:this.resizable}),s=`${t}%`;return this.resizable?U`
            <div
              class=${i}
              data-index=${e}
              .style=${Pt({left:s})}
              @mousedown=${this._onSashMouseDown}
              @mouseover=${this._onSashMouseOver}
              @mouseout=${this._onSashMouseOut}
            >
              <div class="sash-visible"></div>
              <div class="sash-clickable"></div>
            </div>
          `:U`<div
            class=${i}
            data-index=${e}
            .style=${Pt({left:s})}
          >
            <div class="sash-visible"></div>
          </div>`})),e=jt({wrapper:!0,"select-disabled":this._isDragging,"resize-cursor":this._isDragging,"compact-view":this.compact});return U`
      <div class=${e}>
        <div class="header">
          <slot name="caption"></slot>
          <div class="header-slot-wrapper">
            <slot name="header" @slotchange=${this._onHeaderSlotChange}></slot>
          </div>
        </div>
        <vscode-scrollable class="scrollable">
          <div>
            <slot name="body" @slotchange=${this._onBodySlotChange}></slot>
          </div>
        </vscode-scrollable>
        ${t}
        <slot @slotchange=${this._onDefaultSlotChange}></slot>
      </div>
    `}};Xi.styles=Wi,Ki([pt({reflect:!0})],Xi.prototype,"role",void 0),Ki([pt({type:Boolean,reflect:!0})],Xi.prototype,"resizable",void 0),Ki([pt({type:Boolean,reflect:!0})],Xi.prototype,"responsive",void 0),Ki([pt({type:Boolean,reflect:!0})],Xi.prototype,"bordered",void 0),Ki([pt({type:Boolean,reflect:!0,attribute:"bordered-columns"})],Xi.prototype,"borderedColumns",void 0),Ki([pt({type:Boolean,reflect:!0,attribute:"bordered-rows"})],Xi.prototype,"borderedRows",void 0),Ki([pt({type:Number})],Xi.prototype,"breakpoint",void 0),Ki([pt({type:Array})],Xi.prototype,"columns",null),Ki([pt({attribute:"min-column-width"})],Xi.prototype,"minColumnWidth",void 0),Ki([pt({type:Boolean,reflect:!0,attribute:"delayed-resizing"})],Xi.prototype,"delayedResizing",void 0),Ki([pt({type:Boolean,reflect:!0})],Xi.prototype,"compact",void 0),Ki([pt({type:Boolean,reflect:!0})],Xi.prototype,"zebra",void 0),Ki([pt({type:Boolean,reflect:!0,attribute:"zebra-odd"})],Xi.prototype,"zebraOdd",void 0),Ki([ft('slot[name="body"]')],Xi.prototype,"_bodySlot",void 0),Ki([ft(".header")],Xi.prototype,"_headerElement",void 0),Ki([ft(".scrollable")],Xi.prototype,"_scrollableElement",void 0),Ki([function(t){return(e,i)=>bt(0,0,{get(){return(this.renderRoot??(gt??=document.createDocumentFragment())).querySelectorAll(t)}})}(".sash-visible")],Xi.prototype,"_sashVisibleElements",void 0),Ki([mt({flatten:!0,selector:"vscode-table-header, vscode-table-body"})],Xi.prototype,"_assignedElements",void 0),Ki([mt({slot:"header",flatten:!0,selector:"vscode-table-header"})],Xi.prototype,"_assignedHeaderElements",void 0),Ki([mt({slot:"body",flatten:!0,selector:"vscode-table-body"})],Xi.prototype,"_assignedBodyElements",void 0),Ki([vt()],Xi.prototype,"_sashPositions",void 0),Ki([vt()],Xi.prototype,"_isDragging",void 0),Xi=Ki([kt("vscode-table")],Xi);const Ji=[$t,n`
    :host {
      display: block;
    }

    .header {
      align-items: center;
      display: flex;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      width: 100%;
    }

    .header {
      border-bottom-color: var(--vscode-settings-headerBorder, #2b2b2b);
      border-bottom-style: solid;
      border-bottom-width: 1px;
    }

    .header.panel {
      background-color: var(--vscode-panel-background, #181818);
      border-bottom-width: 0;
      box-sizing: border-box;
      padding-left: 8px;
      padding-right: 8px;
    }

    .tablist {
      display: flex;
      margin-bottom: -1px;
    }

    slot[name='addons'] {
      display: block;
      margin-left: auto;
    }
  `];var Yi=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Zi=class extends yt{constructor(){super(),this.panel=!1,this.selectedIndex=0,this._tabHeaders=[],this._tabPanels=[],this._componentId="",this._tabFocus=0,this._componentId=Ce()}attributeChangedCallback(t,e,i){super.attributeChangedCallback(t,e,i),"selected-index"===t&&this._setActiveTab(),"panel"===t&&(this._tabHeaders.forEach((t=>t.panel=null!==i)),this._tabPanels.forEach((t=>t.panel=null!==i)))}_dispatchSelectEvent(){this.dispatchEvent(new CustomEvent("vsc-tabs-select",{detail:{selectedIndex:this.selectedIndex},composed:!0}))}_setActiveTab(){this._tabFocus=this.selectedIndex,this._tabPanels.forEach(((t,e)=>{t.hidden=e!==this.selectedIndex})),this._tabHeaders.forEach(((t,e)=>{t.active=e===this.selectedIndex}))}_focusPrevTab(){0===this._tabFocus?this._tabFocus=this._tabHeaders.length-1:this._tabFocus-=1}_focusNextTab(){this._tabFocus===this._tabHeaders.length-1?this._tabFocus=0:this._tabFocus+=1}_onHeaderKeyDown(t){"ArrowLeft"!==t.key&&"ArrowRight"!==t.key||(t.preventDefault(),this._tabHeaders[this._tabFocus].setAttribute("tabindex","-1"),"ArrowLeft"===t.key?this._focusPrevTab():"ArrowRight"===t.key&&this._focusNextTab(),this._tabHeaders[this._tabFocus].setAttribute("tabindex","0"),this._tabHeaders[this._tabFocus].focus()),"Enter"===t.key&&(t.preventDefault(),this.selectedIndex=this._tabFocus,this._dispatchSelectEvent())}_moveHeadersToHeaderSlot(){const t=this._mainSlotElements.filter((t=>t instanceof Ci));t.length>0&&t.forEach((t=>t.setAttribute("slot","header")))}_onMainSlotChange(){this._moveHeadersToHeaderSlot(),this._tabPanels=this._mainSlotElements.filter((t=>t instanceof zi)),this._tabPanels.forEach(((t,e)=>{t.ariaLabelledby=`t${this._componentId}-h${e}`,t.id=`t${this._componentId}-p${e}`,t.panel=this.panel})),this._setActiveTab()}_onHeaderSlotChange(){this._tabHeaders=this._headerSlotElements.filter((t=>t instanceof Ci)),this._tabHeaders.forEach(((t,e)=>{t.tabId=e,t.id=`t${this._componentId}-h${e}`,t.ariaControls=`t${this._componentId}-p${e}`,t.panel=this.panel,t.active=e===this.selectedIndex}))}_onHeaderClick(t){const e=t.composedPath().find((t=>t instanceof Ci));e&&(this.selectedIndex=e.tabId,this._setActiveTab(),this._dispatchSelectEvent())}render(){return U`
      <div
        class=${jt({header:!0,panel:this.panel})}
        @click=${this._onHeaderClick}
        @keydown=${this._onHeaderKeyDown}
      >
        <div role="tablist" class="tablist">
          <slot
            name="header"
            @slotchange=${this._onHeaderSlotChange}
            role="tablist"
          ></slot>
        </div>
        <slot name="addons"></slot>
      </div>
      <slot @slotchange=${this._onMainSlotChange}></slot>
    `}};Zi.styles=Ji,Yi([pt({type:Boolean,reflect:!0})],Zi.prototype,"panel",void 0),Yi([pt({type:Number,reflect:!0,attribute:"selected-index"})],Zi.prototype,"selectedIndex",void 0),Yi([mt({slot:"header"})],Zi.prototype,"_headerSlotElements",void 0),Yi([mt()],Zi.prototype,"_mainSlotElements",void 0),Zi=Yi([kt("vscode-tabs")],Zi);const Qi=[$t,n`
    :host {
      display: inline-block;
      height: auto;
      position: relative;
      width: 320px;
    }

    :host([cols]) {
      width: auto;
    }

    :host([rows]) {
      height: auto;
    }

    .shadow {
      box-shadow: var(--vscode-scrollbar-shadow, #000000) 0 6px 6px -6px inset;
      display: none;
      inset: 0 0 auto 0;
      height: 6px;
      pointer-events: none;
      position: absolute;
      width: 100%;
    }

    .shadow.visible {
      display: block;
    }

    textarea {
      background-color: var(--vscode-settings-textInputBackground, #313131);
      border-color: var(--vscode-settings-textInputBorder, transparent);
      border-radius: 2px;
      border-style: solid;
      border-width: 1px;
      box-sizing: border-box;
      color: var(--vscode-settings-textInputForeground, #cccccc);
      display: block;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      height: 100%;
      width: 100%;
    }

    :host([cols]) textarea {
      width: auto;
    }

    :host([rows]) textarea {
      height: auto;
    }

    :host([invalid]) textarea,
    :host(:invalid) textarea {
      background-color: var(--vscode-inputValidation-errorBackground, #5a1d1d);
      border-color: var(--vscode-inputValidation-errorBorder, #be1100);
    }

    textarea.monospace {
      background-color: var(--vscode-editor-background, #1f1f1f);
      color: var(--vscode-editor-foreground, #cccccc);
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: var(--vscode-editor-font-size, 14px);
      font-weight: var(--vscode-editor-font-weight, normal);
    }

    .textarea.monospace::placeholder {
      color: var(
        --vscode-editor-inlineValuesForeground,
        rgba(255, 255, 255, 0.5)
      );
    }

    textarea.cursor-pointer {
      cursor: pointer;
    }

    textarea:focus {
      border-color: var(--vscode-focusBorder, #0078d4);
      outline: none;
    }

    textarea::placeholder {
      color: var(--vscode-input-placeholderForeground, #989898);
      opacity: 1;
    }

    textarea::-webkit-scrollbar-track {
      background-color: transparent;
    }

    textarea::-webkit-scrollbar {
      width: 14px;
    }

    textarea::-webkit-scrollbar-thumb {
      background-color: transparent;
    }

    textarea:hover::-webkit-scrollbar-thumb {
      background-color: var(
        --vscode-scrollbarSlider-background,
        rgba(121, 121, 121, 0.4)
      );
    }

    textarea::-webkit-scrollbar-thumb:hover {
      background-color: var(
        --vscode-scrollbarSlider-hoverBackground,
        rgba(100, 100, 100, 0.7)
      );
    }

    textarea::-webkit-scrollbar-thumb:active {
      background-color: var(
        --vscode-scrollbarSlider-activeBackground,
        rgba(191, 191, 191, 0.4)
      );
    }

    textarea::-webkit-scrollbar-corner {
      background-color: transparent;
    }

    textarea::-webkit-resizer {
      background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAYAAADEUlfTAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAACJJREFUeJxjYMAOZuIQZ5j5//9/rJJESczEKYGsG6cEXgAAsEEefMxkua4AAAAASUVORK5CYII=');
      background-repeat: no-repeat;
      background-position: right bottom;
    }
  `];var ts=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let es=class extends yt{set value(t){this._value=t,this._internals.setFormValue(t)}get value(){return this._value}get wrappedElement(){return this._textareaEl}get form(){return this._internals.form}get type(){return"textarea"}get validity(){return this._internals.validity}get validationMessage(){return this._internals.validationMessage}get willValidate(){return this._internals.willValidate}set minlength(t){this.minLength=t}get minlength(){return this.minLength}set maxlength(t){this.maxLength=t}get maxlength(){return this.maxLength}constructor(){super(),this.autocomplete=void 0,this.autofocus=!1,this.defaultValue="",this.disabled=!1,this.invalid=!1,this.label="",this.maxLength=void 0,this.minLength=void 0,this.rows=void 0,this.cols=void 0,this.name=void 0,this.placeholder=void 0,this.readonly=!1,this.resize="none",this.required=!1,this.spellcheck=!1,this.monospace=!1,this._value="",this._textareaPointerCursor=!1,this._shadow=!1,this._internals=this.attachInternals()}connectedCallback(){super.connectedCallback(),this.updateComplete.then((()=>{this._textareaEl.checkValidity(),this._setValidityFromInput(),this._internals.setFormValue(this._textareaEl.value)}))}updated(t){const e=["maxLength","minLength","required"];for(const i of t.keys())if(e.includes(String(i))){this.updateComplete.then((()=>{this._setValidityFromInput()}));break}}formResetCallback(){this.value=this.defaultValue}formStateRestoreCallback(t,e){this.updateComplete.then((()=>{this._value=t}))}checkValidity(){return this._internals.checkValidity()}reportValidity(){return this._internals.reportValidity()}_setValidityFromInput(){this._internals.setValidity(this._textareaEl.validity,this._textareaEl.validationMessage,this._textareaEl)}_dataChanged(){this._value=this._textareaEl.value,this._internals.setFormValue(this._textareaEl.value)}_handleChange(){this._dataChanged(),this._setValidityFromInput(),this.dispatchEvent(new Event("change"))}_handleInput(){this._dataChanged(),this._setValidityFromInput()}_handleMouseMove(t){if(this._textareaEl.clientHeight>=this._textareaEl.scrollHeight)return void(this._textareaPointerCursor=!1);const e=this._textareaEl.getBoundingClientRect(),i=t.clientX;this._textareaPointerCursor=i>=e.left+e.width-14-2}_handleScroll(){this._shadow=this._textareaEl.scrollTop>0}render(){return U`
      <div
        class=${jt({shadow:!0,visible:this._shadow})}
      ></div>
      <textarea
        autocomplete=${Mt(this.autocomplete)}
        ?autofocus=${this.autofocus}
        ?disabled=${this.disabled}
        aria-label=${this.label}
        id="textarea"
        class=${jt({monospace:this.monospace,"cursor-pointer":this._textareaPointerCursor})}
        maxlength=${Mt(this.maxLength)}
        minlength=${Mt(this.minLength)}
        rows=${Mt(this.rows)}
        cols=${Mt(this.cols)}
        name=${Mt(this.name)}
        placeholder=${Mt(this.placeholder)}
        ?readonly=${this.readonly}
        .style=${Pt({resize:this.resize})}
        ?required=${this.required}
        spellcheck=${this.spellcheck}
        @change=${this._handleChange}
        @input=${this._handleInput}
        @mousemove=${this._handleMouseMove}
        @scroll=${this._handleScroll}
        .value=${this._value}
      ></textarea>
    `}};es.styles=Qi,es.formAssociated=!0,es.shadowRootOptions={...ht.shadowRootOptions,delegatesFocus:!0},ts([pt()],es.prototype,"autocomplete",void 0),ts([pt({type:Boolean,reflect:!0})],es.prototype,"autofocus",void 0),ts([pt({attribute:"default-value"})],es.prototype,"defaultValue",void 0),ts([pt({type:Boolean,reflect:!0})],es.prototype,"disabled",void 0),ts([pt({type:Boolean,reflect:!0})],es.prototype,"invalid",void 0),ts([pt({attribute:!1})],es.prototype,"label",void 0),ts([pt({type:Number})],es.prototype,"maxLength",void 0),ts([pt({type:Number})],es.prototype,"minLength",void 0),ts([pt({type:Number})],es.prototype,"rows",void 0),ts([pt({type:Number})],es.prototype,"cols",void 0),ts([pt()],es.prototype,"name",void 0),ts([pt()],es.prototype,"placeholder",void 0),ts([pt({type:Boolean,reflect:!0})],es.prototype,"readonly",void 0),ts([pt()],es.prototype,"resize",void 0),ts([pt({type:Boolean,reflect:!0})],es.prototype,"required",void 0),ts([pt({type:Boolean})],es.prototype,"spellcheck",void 0),ts([pt({type:Boolean,reflect:!0})],es.prototype,"monospace",void 0),ts([pt()],es.prototype,"value",null),ts([ft("#textarea")],es.prototype,"_textareaEl",void 0),ts([vt()],es.prototype,"_value",void 0),ts([vt()],es.prototype,"_textareaPointerCursor",void 0),ts([vt()],es.prototype,"_shadow",void 0),es=ts([kt("vscode-textarea")],es);const is=r(_t()),ss=[$t,n`
    :host {
      display: inline-block;
      width: 320px;
    }

    .root {
      align-items: center;
      background-color: var(--vscode-settings-textInputBackground, #313131);
      border-color: var(
        --vscode-settings-textInputBorder,
        var(--vscode-settings-textInputBackground, #3c3c3c)
      );
      border-radius: 2px;
      border-style: solid;
      border-width: 1px;
      box-sizing: border-box;
      color: var(--vscode-settings-textInputForeground, #cccccc);
      display: flex;
      max-width: 100%;
      position: relative;
      width: 100%;
    }

    :host([focused]) .root {
      border-color: var(--vscode-focusBorder, #0078d4);
    }

    :host([invalid]),
    :host(:invalid) {
      border-color: var(--vscode-inputValidation-errorBorder, #be1100);
    }

    :host([invalid]) input,
    :host(:invalid) input {
      background-color: var(--vscode-inputValidation-errorBackground, #5a1d1d);
    }

    ::slotted([slot='content-before']) {
      display: block;
      margin-left: 2px;
    }

    ::slotted([slot='content-after']) {
      display: block;
      margin-right: 2px;
    }

    slot[name='content-before'],
    slot[name='content-after'] {
      align-items: center;
      display: flex;
    }

    input {
      background-color: var(--vscode-settings-textInputBackground, #313131);
      border: 0;
      box-sizing: border-box;
      color: var(--vscode-settings-textInputForeground, #cccccc);
      display: block;
      font-family: var(--vscode-font-family, ${is});
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, 'normal');
      line-height: 18px;
      outline: none;
      padding-bottom: 3px;
      padding-left: 4px;
      padding-right: 4px;
      padding-top: 3px;
      width: 100%;
    }

    input:read-only:not([type='file']) {
      cursor: not-allowed;
    }

    input::placeholder {
      color: var(--vscode-input-placeholderForeground, #989898);
      opacity: 1;
    }

    input[type='file'] {
      line-height: 24px;
      padding-bottom: 0;
      padding-left: 2px;
      padding-top: 0;
    }

    input[type='file']::file-selector-button {
      background-color: var(--vscode-button-background, #0078d4);
      border: 0;
      border-radius: 2px;
      color: var(--vscode-button-foreground, #ffffff);
      cursor: pointer;
      font-family: var(--vscode-font-family, ${is});
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, 'normal');
      line-height: 20px;
      padding: 0 14px;
    }

    input[type='file']::file-selector-button:hover {
      background-color: var(--vscode-button-hoverBackground, #026ec1);
    }
  `];var os=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let rs=class extends yt{set type(t){this._type=["color","date","datetime-local","email","file","month","number","password","search","tel","text","time","url","week"].includes(t)?t:"text"}get type(){return this._type}set value(t){"file"!==this.type&&(this._value=t,this._internals.setFormValue(t)),this.updateComplete.then((()=>{this._setValidityFromInput()}))}get value(){return this._value}set minlength(t){this.minLength=t}get minlength(){return this.minLength}set maxlength(t){this.maxLength=t}get maxlength(){return this.maxLength}get form(){return this._internals.form}get validity(){return this._internals.validity}get validationMessage(){return this._internals.validationMessage}get willValidate(){return this._internals.willValidate}checkValidity(){return this._setValidityFromInput(),this._internals.checkValidity()}reportValidity(){return this._setValidityFromInput(),this._internals.reportValidity()}get wrappedElement(){return this._inputEl}constructor(){super(),this.autocomplete=void 0,this.autofocus=!1,this.defaultValue="",this.disabled=!1,this.focused=!1,this.invalid=!1,this.label="",this.max=void 0,this.maxLength=void 0,this.min=void 0,this.minLength=void 0,this.multiple=!1,this.name=void 0,this.pattern=void 0,this.placeholder=void 0,this.readonly=!1,this.required=!1,this.step=void 0,this._value="",this._type="text",this._internals=this.attachInternals()}connectedCallback(){super.connectedCallback(),this.updateComplete.then((()=>{this._inputEl.checkValidity(),this._setValidityFromInput(),this._internals.setFormValue(this._inputEl.value)}))}attributeChangedCallback(t,e,i){super.attributeChangedCallback(t,e,i);["max","maxlength","min","minlength","pattern","required","step"].includes(t)&&this.updateComplete.then((()=>{this._setValidityFromInput()}))}formResetCallback(){this.value=this.defaultValue,this.requestUpdate()}formStateRestoreCallback(t,e){this.value=t}_dataChanged(){if(this._value=this._inputEl.value,"file"===this.type&&this._inputEl.files)for(const t of this._inputEl.files)this._internals.setFormValue(t);else this._internals.setFormValue(this._inputEl.value)}_setValidityFromInput(){this._inputEl&&this._internals.setValidity(this._inputEl.validity,this._inputEl.validationMessage,this._inputEl)}_onInput(){this._dataChanged(),this._setValidityFromInput()}_onChange(){this._dataChanged(),this._setValidityFromInput(),this.dispatchEvent(new Event("change"))}_onFocus(){this.focused=!0}_onBlur(){this.focused=!1}_onKeyDown(t){"Enter"===t.key&&this._internals.form&&this._internals.form?.requestSubmit()}render(){return U`
      <div class="root">
        <slot name="content-before"></slot>
        <input
          id="input"
          type=${this.type}
          ?autofocus=${this.autofocus}
          autocomplete=${Mt(this.autocomplete)}
          aria-label=${this.label}
          ?disabled=${this.disabled}
          max=${Mt(this.max)}
          maxlength=${Mt(this.maxLength)}
          min=${Mt(this.min)}
          minlength=${Mt(this.minLength)}
          ?multiple=${this.multiple}
          name=${Mt(this.name)}
          pattern=${Mt(this.pattern)}
          placeholder=${Mt(this.placeholder)}
          ?readonly=${this.readonly}
          ?required=${this.required}
          step=${Mt(this.step)}
          .value=${this._value}
          @blur=${this._onBlur}
          @change=${this._onChange}
          @focus=${this._onFocus}
          @input=${this._onInput}
          @keydown=${this._onKeyDown}
        >
        <slot name="content-after"></slot>
      </div>
    `}};rs.styles=ss,rs.formAssociated=!0,rs.shadowRootOptions={...ht.shadowRootOptions,delegatesFocus:!0},os([pt()],rs.prototype,"autocomplete",void 0),os([pt({type:Boolean,reflect:!0})],rs.prototype,"autofocus",void 0),os([pt({attribute:"default-value"})],rs.prototype,"defaultValue",void 0),os([pt({type:Boolean,reflect:!0})],rs.prototype,"disabled",void 0),os([pt({type:Boolean,reflect:!0})],rs.prototype,"focused",void 0),os([pt({type:Boolean,reflect:!0})],rs.prototype,"invalid",void 0),os([pt({attribute:!1})],rs.prototype,"label",void 0),os([pt({type:Number})],rs.prototype,"max",void 0),os([pt({type:Number})],rs.prototype,"maxLength",void 0),os([pt({type:Number})],rs.prototype,"min",void 0),os([pt({type:Number})],rs.prototype,"minLength",void 0),os([pt({type:Boolean,reflect:!0})],rs.prototype,"multiple",void 0),os([pt({reflect:!0})],rs.prototype,"name",void 0),os([pt()],rs.prototype,"pattern",void 0),os([pt()],rs.prototype,"placeholder",void 0),os([pt({type:Boolean,reflect:!0})],rs.prototype,"readonly",void 0),os([pt({type:Boolean,reflect:!0})],rs.prototype,"required",void 0),os([pt({type:Number})],rs.prototype,"step",void 0),os([pt({reflect:!0})],rs.prototype,"type",null),os([pt()],rs.prototype,"value",null),os([ft("#input")],rs.prototype,"_inputEl",void 0),os([vt()],rs.prototype,"_value",void 0),os([vt()],rs.prototype,"_type",void 0),rs=os([kt("vscode-textfield")],rs);const ns=[$t,n`
    :host {
      display: inline-flex;
    }

    button {
      align-items: center;
      background-color: transparent;
      border: 0;
      border-radius: 5px;
      color: var(--vscode-foreground, #cccccc);
      cursor: pointer;
      display: flex;
      outline-offset: -1px;
      outline-width: 1px;
      padding: 0;
      user-select: none;
    }

    button:focus-visible {
      outline-color: var(--vscode-focusBorder, #0078d4);
      outline-style: solid;
    }

    button:hover {
      background-color: var(
        --vscode-toolbar-hoverBackground,
        rgba(90, 93, 94, 0.31)
      );
      outline-style: dashed;
      outline-color: var(--vscode-toolbar-hoverOutline, transparent);
    }

    button:active {
      background-color: var(
        --vscode-toolbar-activeBackground,
        rgba(99, 102, 103, 0.31)
      );
    }

    button.checked {
      background-color: var(
        --vscode-inputOption-activeBackground,
        rgba(36, 137, 219, 0.51)
      );
      outline-color: var(--vscode-inputOption-activeBorder, #2488db);
      outline-style: solid;
      color: var(--vscode-inputOption-activeForeground, #ffffff);
    }

    button.checked vscode-icon {
      color: var(--vscode-inputOption-activeForeground, #ffffff);
    }

    vscode-icon {
      display: block;
      padding: 3px;
    }

    slot:not(.empty) {
      align-items: center;
      display: flex;
      height: 22px;
      padding: 0 5px 0 2px;
    }

    slot.textOnly:not(.empty) {
      padding: 0 5px;
    }
  `];var ls=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let as=class extends yt{constructor(){super(...arguments),this.icon="",this.label=void 0,this.toggleable=!1,this.checked=!1,this._isSlotEmpty=!0}_handleSlotChange(){this._isSlotEmpty=!((this._assignedNodes?.length??0)>0)}_handleButtonClick(){this.toggleable&&(this.checked=!this.checked,this.dispatchEvent(new Event("change")))}render(){const t=this.checked?"true":"false";return U`
      <button
        type="button"
        aria-label=${Mt(this.label)}
        role=${Mt(this.toggleable?"switch":void 0)}
        aria-checked=${Mt(this.toggleable?t:void 0)}
        class=${jt({checked:this.toggleable&&this.checked})}
        @click=${this._handleButtonClick}
      >
        ${this.icon?U`<vscode-icon name=${this.icon}></vscode-icon>`:q}
        <slot
          @slotchange=${this._handleSlotChange}
          class=${jt({empty:this._isSlotEmpty,textOnly:!this.icon})}
        ></slot>
      </button>
    `}};as.styles=ns,ls([pt({reflect:!0})],as.prototype,"icon",void 0),ls([pt()],as.prototype,"label",void 0),ls([pt({type:Boolean,reflect:!0})],as.prototype,"toggleable",void 0),ls([pt({type:Boolean,reflect:!0})],as.prototype,"checked",void 0),ls([vt()],as.prototype,"_isSlotEmpty",void 0),ls([function(t){return(e,i)=>{const{slot:s}={},o="slot"+(s?`[name=${s}]`:":not([name])");return bt(0,0,{get(){const e=this.renderRoot?.querySelector(o);return e?.assignedNodes(t)??[]}})}}()],as.prototype,"_assignedNodes",void 0),as=ls([kt("vscode-toolbar-button")],as);const hs=[$t,n`
    :host {
      display: block;
    }

    div {
      gap: 4px;
      display: flex;
      align-items: center;
    }
  `];var cs=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let ds=class extends yt{render(){return U`<div><slot></slot></div>`}};ds.styles=hs,ds=cs([kt("vscode-toolbar-container")],ds);let us=class extends Event{constructor(t,e,i,s){super("context-request",{bubbles:!0,composed:!0}),this.context=t,this.contextTarget=e,this.callback=i,this.subscribe=s??!1}};let ps=class{constructor(t,e,i,s){if(this.subscribe=!1,this.provided=!1,this.value=void 0,this.t=(t,e)=>{this.unsubscribe&&(this.unsubscribe!==e&&(this.provided=!1,this.unsubscribe()),this.subscribe||this.unsubscribe()),this.value=t,this.host.requestUpdate(),this.provided&&!this.subscribe||(this.provided=!0,this.callback&&this.callback(t,e)),this.unsubscribe=e},this.host=t,void 0!==e.context){const t=e;this.context=t.context,this.callback=t.callback,this.subscribe=t.subscribe??!1}else this.context=e,this.callback=i,this.subscribe=s??!1;this.host.addController(this)}hostConnected(){this.dispatchRequest()}hostDisconnected(){this.unsubscribe&&(this.unsubscribe(),this.unsubscribe=void 0)}dispatchRequest(){this.host.dispatchEvent(new us(this.context,this.host,this.t,this.subscribe))}};class vs{get value(){return this.o}set value(t){this.setValue(t)}setValue(t,e=!1){const i=e||!Object.is(t,this.o);this.o=t,i&&this.updateObservers()}constructor(t){this.subscriptions=new Map,this.updateObservers=()=>{for(const[t,{disposer:e}]of this.subscriptions)t(this.o,e)},void 0!==t&&(this.value=t)}addCallback(t,e,i){if(!i)return void t(this.value);this.subscriptions.has(t)||this.subscriptions.set(t,{disposer:()=>{this.subscriptions.delete(t)},consumerHost:e});const{disposer:s}=this.subscriptions.get(t);t(this.value,s)}clearCallbacks(){this.subscriptions.clear()}}let bs=class extends Event{constructor(t,e){super("context-provider",{bubbles:!0,composed:!0}),this.context=t,this.contextTarget=e}};class fs extends vs{constructor(t,e,i){super(void 0!==e.context?e.initialValue:i),this.onContextRequest=t=>{if(t.context!==this.context)return;const e=t.contextTarget??t.composedPath()[0];e!==this.host&&(t.stopPropagation(),this.addCallback(t.callback,e,t.subscribe))},this.onProviderRequest=t=>{if(t.context!==this.context)return;if((t.contextTarget??t.composedPath()[0])===this.host)return;const e=new Set;for(const[t,{consumerHost:i}]of this.subscriptions)e.has(t)||(e.add(t),i.dispatchEvent(new us(this.context,i,t,!0)));t.stopPropagation()},this.host=t,void 0!==e.context?this.context=e.context:this.context=e,this.attachListeners(),this.host.addController?.(this)}attachListeners(){this.host.addEventListener("context-request",this.onContextRequest),this.host.addEventListener("context-provider",this.onProviderRequest)}hostConnected(){this.host.dispatchEvent(new bs(this.context,this.host))}}function gs({context:t}){return(e,i)=>{const s=new WeakMap;if("object"==typeof i)return{get(){return e.get.call(this)},set(t){return s.get(this).setValue(t),e.set.call(this,t)},init(e){return s.set(this,new fs(this,{context:t,initialValue:e})),e}};{e.constructor.addInitializer((e=>{s.set(e,new fs(e,{context:t}))}));const o=Object.getOwnPropertyDescriptor(e,i);let r;if(void 0===o){const t=new WeakMap;r={get(){return t.get(this)},set(e){s.get(this).setValue(e),t.set(this,e)},configurable:!0,enumerable:!0}}else{const t=o.set;r={...o,set(e){s.get(this).setValue(e),t?.call(this,e)}}}return void Object.defineProperty(e,i,r)}}}function ms({context:t,subscribe:e}){return(i,s)=>{"object"==typeof s?s.addInitializer((function(){new ps(this,{context:t,callback:t=>{i.set.call(this,t)},subscribe:e})})):i.constructor.addInitializer((i=>{new ps(i,{context:t,callback:t=>{i[s]=t},subscribe:e})}))}}const xs=[$t,n`
    :host {
      --vsc-tree-item-arrow-display: flex;
      --internal-selectionBackground: var(
        --vscode-list-inactiveSelectionBackground,
        #37373d
      );
      --internal-selectionForeground: var(--vscode-foreground, #cccccc);
      --internal-selectionIconForeground: var(
        --vscode-icon-foreground,
        #cccccc
      );
      --internal-defaultIndentGuideDisplay: none;
      --internal-highlightedIndentGuideDisplay: block;

      display: block;
    }

    :host(:hover) {
      --internal-defaultIndentGuideDisplay: block;
      --internal-highlightedIndentGuideDisplay: block;
    }

    :host(:focus-within) {
      --internal-selectionBackground: var(
        --vscode-list-activeSelectionBackground,
        #04395e
      );
      --internal-selectionForeground: var(
        --vscode-list-activeSelectionForeground,
        #ffffff
      );
      --internal-selectionIconForeground: var(
        --vscode-list-activeSelectionIconForeground,
        #ffffff
      );
    }

    :host([hide-arrows]) {
      --vsc-tree-item-arrow-display: none;
    }

    :host([indent-guides='none']),
    :host([indent-guides='none']:hover) {
      --internal-defaultIndentGuideDisplay: none;
      --internal-highlightedIndentGuideDisplay: none;
    }

    :host([indent-guides='always']),
    :host([indent-guides='always']:hover) {
      --internal-defaultIndentGuideDisplay: block;
      --internal-highlightedIndentGuideDisplay: block;
    }
  `],ws="vscode-list",ys=Symbol("configContext"),ks=t=>t instanceof Element&&t.matches("vscode-tree-item"),$s=(t,e)=>{const i=e.length,s=(o=t)instanceof Element&&o.matches("vscode-tree")?-1:t.level;var o;"branch"in t&&(t.branch=i>0),e.forEach(((e,i)=>{e.path="path"in t?[...t.path,i]:[i],e.level=s+1,e.dataset.path=e.path.join(".")}))},_s=t=>{const e=t.lastElementChild;return e&&ks(e)?e.branch&&e.open?_s(e):e:t},Ss=t=>{if(!t.parentElement)return null;if(!ks(t.parentElement))return null;const e=Bs(t.parentElement);return e||Ss(t.parentElement)},Bs=t=>{let e=t.nextElementSibling;for(;e&&!ks(e);)e=e.nextElementSibling;return e};function Cs(t){return t.parentElement&&ks(t.parentElement)?t.parentElement:null}var Os=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};const As="singleClick",zs="doubleClick",Es="none",Is=[" ","ArrowDown","ArrowUp","ArrowLeft","ArrowRight","Enter","Escape","Shift"];let js=class extends yt{constructor(){super(),this.expandMode="singleClick",this.hideArrows=!1,this.indent=8,this.indentGuides="onHover",this.multiSelect=!1,this._treeContextState={isShiftPressed:!1,activeItem:null,selectedItems:new Set,allItems:null,itemListUpToDate:!1,focusedItem:null,prevFocusedItem:null,hasBranchItem:!1,rootElement:this,highlightedItems:new Set,highlightIndentGuides:()=>{this._highlightIndentGuides()},emitSelectEvent:()=>{this._emitSelectEvent()}},this._configContext={hideArrows:this.hideArrows,expandMode:this.expandMode,indent:this.indent,indentGuides:this.indentGuides,multiSelect:this.multiSelect},this._handleComponentKeyDown=t=>{const e=t.key;switch(Is.includes(e)&&(t.stopPropagation(),t.preventDefault()),e){case" ":case"Enter":this._handleEnterPress();break;case"ArrowDown":this._handleArrowDownPress();break;case"ArrowLeft":this._handleArrowLeftPress(t);break;case"ArrowRight":this._handleArrowRightPress();break;case"ArrowUp":this._handleArrowUpPress();break;case"Shift":this._handleShiftPress()}},this._handleComponentKeyUp=t=>{"Shift"===t.key&&(this._treeContextState.isShiftPressed=!1)},this._handleSlotChange=()=>{this._treeContextState.itemListUpToDate=!1,$s(this,this._assignedTreeItems),this.updateComplete.then((()=>{if(null===this._treeContextState.activeItem){const t=this.querySelector(":scope > vscode-tree-item");t&&(t.active=!0)}}))},this.addEventListener("keyup",this._handleComponentKeyUp),this.addEventListener("keydown",this._handleComponentKeyDown)}connectedCallback(){super.connectedCallback(),this.role="tree"}willUpdate(t){this._updateConfigContext(t),t.has("multiSelect")&&(this.ariaMultiSelectable=this.multiSelect?"true":"false")}expandAll(){this.querySelectorAll("vscode-tree-item").forEach((t=>{t.branch&&(t.open=!0)}))}collapseAll(){this.querySelectorAll("vscode-tree-item").forEach((t=>{t.branch&&(t.open=!1)}))}updateHasBranchItemFlag(){const t=this._assignedTreeItems.some((t=>t.branch));this._treeContextState={...this._treeContextState,hasBranchItem:t}}_emitSelectEvent(){const t=new CustomEvent("vsc-tree-select",{detail:Array.from(this._treeContextState.selectedItems)});this.dispatchEvent(t)}_highlightIndentGuideOfItem(t){if(t.branch&&t.open)t.highlightedGuides=!0,this._treeContextState.highlightedItems?.add(t);else{const e=Cs(t);e&&(e.highlightedGuides=!0,this._treeContextState.highlightedItems?.add(e))}}_highlightIndentGuides(){this.indentGuides!==Es&&(this._treeContextState.highlightedItems?.forEach((t=>t.highlightedGuides=!1)),this._treeContextState.highlightedItems?.clear(),this._treeContextState.activeItem&&this._highlightIndentGuideOfItem(this._treeContextState.activeItem),this._treeContextState.selectedItems.forEach((t=>{this._highlightIndentGuideOfItem(t)})))}_updateConfigContext(t){const{hideArrows:e,expandMode:i,indent:s,indentGuides:o,multiSelect:r}=this;t.has("hideArrows")&&(this._configContext={...this._configContext,hideArrows:e}),t.has("expandMode")&&(this._configContext={...this._configContext,expandMode:i}),t.has("indent")&&(this._configContext={...this._configContext,indent:s}),t.has("indentGuides")&&(this._configContext={...this._configContext,indentGuides:o}),t.has("multiSelect")&&(this._configContext={...this._configContext,multiSelect:r})}_focusItem(t){t.active=!0,t.updateComplete.then((()=>{t.focus(),this._highlightIndentGuides()}))}_focusPrevItem(){if(this._treeContextState.focusedItem){const t=(t=>{const{parentElement:e}=t;if(!e||!ks(t))return null;let i=t.previousElementSibling;for(;i&&!ks(i);)i=i.previousElementSibling;if(!i&&ks(e))return e;if(i&&i.branch&&i.open)return _s(i);return i})(this._treeContextState.focusedItem);t&&(this._focusItem(t),this._treeContextState.isShiftPressed&&this.multiSelect&&(t.selected=!t.selected,this._emitSelectEvent()))}}_focusNextItem(){if(this._treeContextState.focusedItem){const t=(t=>{const{parentElement:e}=t;if(!e||!ks(t))return null;let i;if(t.branch&&t.open){const e=t.querySelector("vscode-tree-item");e?i=e:(i=Bs(t),i||(i=Ss(t)))}else i=Bs(t),i||(i=Ss(t));return i||t})(this._treeContextState.focusedItem);t&&(this._focusItem(t),this._treeContextState.isShiftPressed&&this.multiSelect&&(t.selected=!t.selected,this._emitSelectEvent()))}}_handleArrowRightPress(){if(!this._treeContextState.focusedItem)return;const{focusedItem:t}=this._treeContextState;t.branch&&(t.open?this._focusNextItem():t.open=!0)}_handleArrowLeftPress(t){if(t.ctrlKey)return void this.collapseAll();if(!this._treeContextState.focusedItem)return;const{focusedItem:e}=this._treeContextState,i=Cs(e);e.branch&&e.open?e.open=!1:i&&i.branch&&this._focusItem(i)}_handleArrowDownPress(){this._treeContextState.focusedItem?this._focusNextItem():this._focusItem(this._assignedTreeItems[0])}_handleArrowUpPress(){this._treeContextState.focusedItem?this._focusPrevItem():this._focusItem(this._assignedTreeItems[0])}_handleEnterPress(){const{focusedItem:t}=this._treeContextState;t&&(this._treeContextState.selectedItems.forEach((t=>t.selected=!1)),this._treeContextState.selectedItems.clear(),this._highlightIndentGuides(),t.selected=!0,this._emitSelectEvent(),t.branch&&(t.open=!t.open))}_handleShiftPress(){this._treeContextState.isShiftPressed=!0}render(){return U`<div>
      <slot @slotchange=${this._handleSlotChange}></slot>
    </div>`}};js.styles=xs,Os([pt({type:String,attribute:"expand-mode"})],js.prototype,"expandMode",void 0),Os([pt({type:Boolean,reflect:!0,attribute:"hide-arrows"})],js.prototype,"hideArrows",void 0),Os([pt({type:Number,reflect:!0})],js.prototype,"indent",void 0),Os([pt({type:String,attribute:"indent-guides",useDefault:!0,reflect:!0})],js.prototype,"indentGuides",void 0),Os([pt({type:Boolean,reflect:!0,attribute:"multi-select"})],js.prototype,"multiSelect",void 0),Os([gs({context:ws})],js.prototype,"_treeContextState",void 0),Os([gs({context:ys})],js.prototype,"_configContext",void 0),Os([mt({selector:"vscode-tree-item"})],js.prototype,"_assignedTreeItems",void 0),js=Os([kt("vscode-tree")],js);const Ms=[$t,n`
    :host {
      --hover-outline-color: transparent;
      --hover-outline-style: solid;
      --hover-outline-width: 0;

      --selected-outline-color: transparent;
      --selected-outline-style: solid;
      --selected-outline-width: 0;

      cursor: pointer;
      display: block;
      user-select: none;
    }

    ::slotted(vscode-icon) {
      display: block;
    }

    .root {
      display: block;
    }

    .wrapper {
      align-items: flex-start;
      color: var(--vscode-foreground, #cccccc);
      display: flex;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      outline-offset: -1px;
      padding-right: 12px;
    }

    .wrapper:hover {
      background-color: var(--vscode-list-hoverBackground, #2a2d2e);
      color: var(
        --vscode-list-hoverForeground,
        var(--vscode-foreground, #cccccc)
      );
    }

    :host([selected]) .wrapper {
      color: var(--internal-selectionForeground);
      background-color: var(--internal-selectionBackground);
    }

    :host([selected]) ::slotted(vscode-icon) {
      color: var(--internal-selectionForeground);
    }

    :host(:focus) {
      outline: none;
    }

    :host(:focus) .wrapper.active {
      outline-color: var(
        --vscode-list-focusAndSelectionOutline,
        var(--vscode-list-focusOutline, #0078d4)
      );
      outline-style: solid;
      outline-width: 1px;
    }

    .arrow-container {
      align-items: center;
      display: var(--vsc-tree-item-arrow-display);
      height: 22px;
      justify-content: center;
      padding-left: 8px;
      padding-right: 6px;
      width: 16px;
    }

    .arrow-container svg {
      display: block;
      fill: var(--vscode-icon-foreground, #cccccc);
    }

    .arrow-container.icon-rotated svg {
      transform: rotate(90deg);
    }

    :host([selected]) .arrow-container svg {
      fill: var(--internal-selectionIconForeground);
    }

    .icon-container {
      align-items: center;
      display: flex;
      margin-bottom: 3px;
      margin-top: 3px;
      overflow: hidden;
    }

    .icon-container slot {
      display: block;
    }

    .icon-container.has-icon {
      height: 16px;
      margin-right: 6px;
      width: 16px;
    }

    .children {
      position: relative;
    }

    .children.guide:before {
      background-color: var(
        --vscode-tree-inactiveIndentGuidesStroke,
        rgba(88, 88, 88, 0.4)
      );
      content: '';
      display: none;
      height: 100%;
      left: var(--indentation-guide-left);
      pointer-events: none;
      position: absolute;
      width: 1px;
      z-index: 1;
    }

    .children.guide.default-guide:before {
      display: var(--internal-defaultIndentGuideDisplay);
    }

    .children.guide.highlighted-guide:before {
      display: var(--internal-highlightedIndentGuideDisplay);
      background-color: var(--vscode-tree-indentGuidesStroke, #585858);
    }

    .content {
      line-height: 22px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :host([branch]) ::slotted(vscode-tree-item) {
      display: none;
    }

    :host([branch][open]) ::slotted(vscode-tree-item) {
      display: block;
    }
  `];var Ps=function(t,e,i,s){for(var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s,l=t.length-1;l>=0;l--)(o=t[l])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};const Ds=U`<svg
  width="16"
  height="16"
  viewBox="0 0 16 16"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"
  />
</svg>`;function Fs(t){return t.parentElement&&t.parentElement instanceof Vs?t.parentElement:null}let Vs=class extends yt{set selected(t){this._selected=t,this._treeContextState.selectedItems.add(this),this.ariaSelected=t?"true":"false"}get selected(){return this._selected}set path(t){this._path=t}get path(){return this._path}constructor(){super(),this.active=!1,this.branch=!1,this.hasActiveItem=!1,this.hasSelectedItem=!1,this.highlightedGuides=!1,this.open=!1,this.level=0,this._selected=!1,this._path=[],this._hasBranchIcon=!1,this._hasBranchOpenedIcon=!1,this._hasLeafIcon=!1,this._treeContextState={isShiftPressed:!1,selectedItems:new Set,allItems:null,itemListUpToDate:!1,focusedItem:null,prevFocusedItem:null,hasBranchItem:!1,rootElement:null,activeItem:null},this._handleMainSlotChange=()=>{this._mainSlotChange(),this._treeContextState.itemListUpToDate=!1},this._handleComponentFocus=()=>{this._treeContextState.focusedItem&&this._treeContextState.focusedItem!==this&&(this._treeContextState.isShiftPressed||(this._treeContextState.prevFocusedItem=this._treeContextState.focusedItem),this._treeContextState.focusedItem=null),this._treeContextState.focusedItem=this},this._internals=this.attachInternals(),this.addEventListener("focus",this._handleComponentFocus)}connectedCallback(){super.connectedCallback(),this._mainSlotChange(),this.role="treeitem",this.ariaDisabled="false"}willUpdate(t){t.has("active")&&this._toggleActiveState(),(t.has("open")||t.has("branch"))&&this._setAriaExpanded()}_setAriaExpanded(){this.branch?this.ariaExpanded=this.open?"true":"false":this.ariaExpanded=null}_setHasActiveItemFlagOnParent(t,e){const i=Fs(t);i&&(i.hasActiveItem=e)}_toggleActiveState(){this.active?(this._treeContextState.activeItem&&(this._treeContextState.activeItem.active=!1,this._setHasActiveItemFlagOnParent(this._treeContextState.activeItem,!1)),this._treeContextState.activeItem=this,this._setHasActiveItemFlagOnParent(this,!0),this.tabIndex=0,this._internals.states.add("active")):(this._treeContextState.activeItem===this&&(this._treeContextState.activeItem=null,this._setHasActiveItemFlagOnParent(this,!1)),this.tabIndex=-1,this._internals.states.delete("active"))}_selectItem(t){const{selectedItems:e}=this._treeContextState,{multiSelect:i}=this._configContext;i&&t?this.selected?(this.selected=!1,e.delete(this)):(this.selected=!0,e.add(this)):(e.forEach((t=>t.selected=!1)),e.clear(),this.selected=!0,e.add(this))}_selectRange(){const t=this._treeContextState.prevFocusedItem;if(!t||t===this)return;this._treeContextState.itemListUpToDate||(this._treeContextState.allItems=this._treeContextState.rootElement.querySelectorAll("vscode-tree-item"),this._treeContextState.allItems&&this._treeContextState.allItems.forEach(((t,e)=>{t.dataset.score=e.toString()})),this._treeContextState.itemListUpToDate=!0);let e=+(t.dataset.score??-1),i=+(this.dataset.score??-1);e>i&&([e,i]=[i,e]),this._treeContextState.selectedItems.forEach((t=>t.selected=!1)),this._treeContextState.selectedItems.clear(),this._selectItemsAndAllVisibleDescendants(e,i)}_selectItemsAndAllVisibleDescendants(t,e){let i=t;for(;i<=e;)if(this._treeContextState.allItems){const t=this._treeContextState.allItems[i];if(t.branch&&!t.open){t.selected=!0;i+=t.querySelectorAll("vscode-tree-item").length}else t.branch&&t.open?(t.selected=!0,i+=this._selectItemsAndAllVisibleDescendants(i+1,e)):(t.selected=!0,i+=1)}return i}_mainSlotChange(){this._initiallyAssignedTreeItems.forEach((t=>{t.setAttribute("slot","children")}))}_handleChildrenSlotChange(){$s(this,this._childrenTreeItems),this._treeContextState.rootElement&&this._treeContextState.rootElement.updateHasBranchItemFlag()}_handleContentClick(t){t.stopPropagation();const e=t.ctrlKey||t.metaKey,i=t.shiftKey;i&&this._configContext.multiSelect?(this._selectRange(),this._treeContextState.emitSelectEvent?.(),this.updateComplete.then((()=>{this._treeContextState.highlightIndentGuides?.()}))):(this._selectItem(e),this._treeContextState.emitSelectEvent?.(),this.updateComplete.then((()=>{this._treeContextState.highlightIndentGuides?.()})),this._configContext.expandMode===As&&(!this.branch||this._configContext.multiSelect&&e||(this.open=!this.open))),this.active=!0,i||(this._treeContextState.prevFocusedItem=this)}_handleDoubleClick(t){this._configContext.expandMode===zs&&(!this.branch||this._configContext.multiSelect&&(t.ctrlKey||t.metaKey)||(this.open=!this.open))}_handleIconSlotChange(t){const e=t.target,i=e.assignedElements().length>0;switch(e.name){case"icon-branch":this._hasBranchIcon=i;break;case"icon-branch-opened":this._hasBranchOpenedIcon=i;break;case"icon-leaf":this._hasLeafIcon=i}}render(){const{hideArrows:t,indent:e,indentGuides:i}=this._configContext,{hasBranchItem:s}=this._treeContextState;let o=3+this.level*e;const r=t?3:13,n=3+this.level*e+r;this.branch||t||!s||(o+=30);const l=this._hasBranchIcon&&this.branch||this._hasBranchOpenedIcon&&this.branch&&this.open||this._hasLeafIcon&&!this.branch,a={wrapper:!0,active:this.active},h={children:!0,guide:i!==Es,"default-guide":i!==Es,"highlighted-guide":this.highlightedGuides},c={"icon-container":!0,"has-icon":l};return U` <div class="root">
      <div
        class=${jt(a)}
        @click=${this._handleContentClick}
        @dblclick=${this._handleDoubleClick}
        .style=${Pt({paddingLeft:`${o}px`})}
      >
        ${this.branch&&!t?U`<div
              class=${jt({"arrow-container":!0,"icon-rotated":this.open})}
            >
              ${Ds}
            </div>`:q}
        <div class=${jt(c)}>
          ${this.branch&&!this.open?U`<slot
                name="icon-branch"
                @slotchange=${this._handleIconSlotChange}
              ></slot>`:q}
          ${this.branch&&this.open?U`<slot
                name="icon-branch-opened"
                @slotchange=${this._handleIconSlotChange}
              ></slot>`:q}
          ${this.branch?q:U`<slot
                name="icon-leaf"
                @slotchange=${this._handleIconSlotChange}
              ></slot>`}
        </div>
        <div class="content" part="content">
          <slot @slotchange=${this._handleMainSlotChange}></slot>
        </div>
      </div>
      <div
        class=${jt(h)}
        .style=${Pt({"--indentation-guide-left":`${n}px`})}
        role="group"
        part="children"
      >
        <slot
          name="children"
          @slotchange=${this._handleChildrenSlotChange}
        ></slot>
      </div>
    </div>`}};Vs.styles=Ms,Ps([pt({type:Boolean})],Vs.prototype,"active",void 0),Ps([pt({type:Boolean,reflect:!0})],Vs.prototype,"branch",void 0),Ps([pt({type:Boolean})],Vs.prototype,"hasActiveItem",void 0),Ps([pt({type:Boolean})],Vs.prototype,"hasSelectedItem",void 0),Ps([pt({type:Boolean})],Vs.prototype,"highlightedGuides",void 0),Ps([pt({type:Boolean,reflect:!0})],Vs.prototype,"open",void 0),Ps([pt({type:Number,reflect:!0})],Vs.prototype,"level",void 0),Ps([pt({type:Boolean,reflect:!0})],Vs.prototype,"selected",null),Ps([vt()],Vs.prototype,"_hasBranchIcon",void 0),Ps([vt()],Vs.prototype,"_hasBranchOpenedIcon",void 0),Ps([vt()],Vs.prototype,"_hasLeafIcon",void 0),Ps([ms({context:ws,subscribe:!0})],Vs.prototype,"_treeContextState",void 0),Ps([ms({context:ys,subscribe:!0})],Vs.prototype,"_configContext",void 0),Ps([mt({selector:"vscode-tree-item"})],Vs.prototype,"_initiallyAssignedTreeItems",void 0),Ps([mt({selector:"vscode-tree-item",slot:"children"})],Vs.prototype,"_childrenTreeItems",void 0),Vs=Ps([kt("vscode-tree-item")],Vs);export{Ct as VscodeBadge,Lt as VscodeButton,Ht as VscodeButtonGroup,Qt as VscodeCheckbox,ie as VscodeCheckboxGroup,re as VscodeCollapsible,de as VscodeContextMenu,ae as VscodeContextMenuItem,ve as VscodeDivider,me as VscodeFormContainer,ye as VscodeFormGroup,Se as VscodeFormHelper,Tt as VscodeIcon,ze as VscodeLabel,si as VscodeMultiSelect,Le as VscodeOption,hi as VscodeProgressBar,ni as VscodeProgressRing,ui as VscodeRadio,bi as VscodeRadioGroup,Ye as VscodeScrollable,gi as VscodeSingleSelect,_i as VscodeSplitLayout,Ci as VscodeTabHeader,zi as VscodeTabPanel,Xi as VscodeTable,ji as VscodeTableBody,Di as VscodeTableCell,Ti as VscodeTableHeader,Li as VscodeTableHeaderCell,Hi as VscodeTableRow,Zi as VscodeTabs,es as VscodeTextarea,rs as VscodeTextfield,as as VscodeToolbarButton,ds as VscodeToolbarContainer,js as VscodeTree,Vs as VscodeTreeItem};
