function n(){}var t="map,scan,dedupe,dedupeWith,when,throttle,debounce".split(","),e=["changed"],r=function(r){var i=this;this.value=r,this.notify=new Set,this.detacher=n,this.fn=this.update.bind(this),this.fn.stream=this,t.forEach(function(n){i.fn[n]=function(){for(var t,e=[],r=arguments.length;r--;)e[r]=arguments[r];return(t=i)[n].apply(t,e).fn}}),e.forEach(function(n){i.fn[n]=function(){for(var t,e=[],r=arguments.length;r--;)e[r]=arguments[r];return(t=i)[n].apply(t,e)}})};function i(n){return function(){return n.forEach(function(n){return n()})}}function o(){for(var n=[],t=arguments.length;t--;)n[t]=arguments[t];var e=r.create.apply(r,n);return e.addEnd(),e.fn}function u(n,t){return n===t}r.create=function(){for(var n=[],t=arguments.length;t--;)n[t]=arguments[t];return new(Function.prototype.bind.apply(r,[null].concat(n)))},r.prototype.subscribe=function(n){var t=this;return this.notify.add(n),function(){return t.notify.delete(n)}},r.prototype.endStream=function(){this.notify.clear(),this.detacher(),this.detacher=n},r.prototype.addEnd=function(){var n=this;this.end=r.create(),this.end.subscribe(function(){n.end.endStream(),n.endStream()}),this.fn.end=this.end.fn},r.prototype.update=function(n){0!==arguments.length&&(this.value=n,Array.from(this.notify).forEach(function(t){return t(n)}));return this.value},r.combine=function(n,t,e){void 0===e&&(e={});var o=r.create();function u(e){var r=n.apply(void 0,t.concat([o],[e]));null!=r&&o.update(r)}return e.skip?o.value=e.initial:u(t),o.detacher=i(t.map(function(n){return n.subscribe(function(){return u([n])})})),o.addEnd(),o.end.detacher=i(t.map(function(n){return n.end.subscribe(function(n){return o.end.update(n)})})),o},r.prototype.map=function(n,t){return r.combine(function(t){return n(t.value)},[this],t)},r.prototype.dedupe=function(n,t){var e;return n&&"object"==typeof n&&(t=n,n=void 0),n=n||u,(t=t||{}).skip||(e=this.value),r.combine(function(t,r){var i=t.value;n(e,i)||r.update(i),e=i},[this],{skip:!0,initial:e})},r.merge=function(){for(var n=[],t=arguments.length;t--;)n[t]=arguments[t];return r.combine(function(){for(var n=[],t=arguments.length;t--;)n[t]=arguments[t];var e=n.pop(),r=n.pop();e.forEach(function(n){return r.update(n.value)})},n,{skip:!0})},r.prototype.scan=function(n,t){return this.map(function(e){return t=n(t,e)},{skip:!0,initial:t})},r.prototype.when=function(n){var t,e,r=function(){return new Promise(function(n){t=n})},i=r();return n(this.value)&&(e=!0,t()),this.scan(function(i,o){return n(o)?e||(e=!0,t()):e&&(e=!1,i=r()),i},i)},r.prototype.changed=function(){var n=this;return new Promise(function(t){var e=n.map(function(n){t(n),e.end.update(!0)},{skip:!0})})},r.prototype.throttle=function(n){var t,e,i=this,o=function(){a.update(i.value),e=!1},u=function(){return setTimeout(function(){e?(o(),t=u()):t=null},n)},a=r.combine(function(){t?e=!0:(o(),t=u())},[this],{skip:!0});return a},r.prototype.debounce=function(n){var t,e=this,i=function(){o.update(e.value),t=null},o=r.combine(function(){t&&clearTimeout(t),t=setTimeout(i,n)},[this],{skip:!0});return o},Object.assign(o,{combine:function(n,t,e){return r.combine(function(){for(var t=[],e=arguments.length;e--;)t[e]=arguments[e];var r=t.pop(),i=t.pop();return n.apply(void 0,t.map(function(n){return n.fn}).concat([i.fn],[r.map(function(n){return n.fn})]))},t.map(function(n){return n.stream}),e).fn},merge:function(){for(var n=[],t=arguments.length;t--;)n[t]=arguments[t];return r.merge.apply(r,n.map(function(n){return n.stream})).fn}}),module.exports=o;
//# sourceMappingURL=index.js.map
