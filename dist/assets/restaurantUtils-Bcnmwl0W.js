import{c as p}from"./index-BIlIEUho.js";/**
 * @license lucide-react v0.427.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=p("ShoppingCart",[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]]);function f(n,t){if(!n||!t)return!1;const e=new Date,[c,r]=n.slice(0,5).split(":").map(Number),[i,a]=t.slice(0,5).split(":").map(Number),o=e.getHours()*60+e.getMinutes(),s=c*60+r,u=i*60+a;return s<=u?o>=s&&o<u:o>=s||o<u}function l(n,t,e){return e===!1||!n||!t?!1:f(n,t)}function _(n){const{opening_time:t,closing_time:e,is_open_override:c,opening_time_2:r,closing_time_2:i,is_open_override_2:a}=n;return!(t&&e)&&!(r&&i)?!0:l(t,e,c)||l(r,i,a)}export{m as S,_ as i};
