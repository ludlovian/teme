function n(){}var t="map,scan,dedupe,dedupeWith,when".split(","),e=function(e){var r=this;this.value=e,this.notify=new Set,this.detacher=n,this.fn=this.update.bind(this),this.fn.stream=this,t.forEach(function(n){r.fn[n]=function(){for(var t,e=[],u=arguments.length;u--;)e[u]=arguments[u];return(t=r)[n].apply(t,e).fn}})};function r(n){return function(){return n.forEach(function(n){return n()})}}function u(){for(var n=[],t=arguments.length;t--;)n[t]=arguments[t];var r=e.create.apply(e,n);return r.addEnd(),r.fn}function i(n,t){return n===t}e.create=function(){for(var n=[],t=arguments.length;t--;)n[t]=arguments[t];return new(Function.prototype.bind.apply(e,[null].concat(n)))},e.prototype.subscribe=function(n){var t=this;return this.notify.add(n),function(){return t.notify.delete(n)}},e.prototype.endStream=function(){this.notify.clear(),this.detacher(),this.detacher=n},e.prototype.addEnd=function(){var n=this;this.end=e.create(),this.end.subscribe(function(){n.end.endStream(),n.endStream()}),this.fn.end=this.end.fn},e.prototype.update=function(n){0!==arguments.length&&(this.value=n,Array.from(this.notify).forEach(function(t){return t(n)}));return this.value},e.combine=function(n,t){var u=e.create();return u.detacher=r(t.map(function(e){return e.subscribe(function(){var r=n.apply(void 0,t.concat([u],[[e]]));null!=r&&u.update(r)})})),u.addEnd(),u.end.detacher=r(t.map(function(n){return n.end.subscribe(function(n){return u.end.update(n)})})),u},e.prototype.map=function(n){return e.combine(function(t){return n(t.value)},[this])},e.prototype.dedupeWith=function(n){var t;return e.combine(function(e,r){var u=e.value;n(t,u)||r.update(u),t=u},[this])},e.prototype.dedupe=function(){return this.dedupeWith(i)},e.merge=function(){for(var n=[],t=arguments.length;t--;)n[t]=arguments[t];return e.combine(function(){for(var n=[],t=arguments.length;t--;)n[t]=arguments[t];var e=n.pop(),r=n.pop();e.forEach(function(n){return r.update(n.value)})},n)},e.prototype.scan=function(n,t){var e=this.map(function(e){return t=n(t,e)},[this]);return e.value=t,e},e.prototype.when=function(n){var t,e,r=function(){return new Promise(function(n){t=n})},u=r();return n(this.value)&&(e=!0,t()),this.scan(function(u,i){return n(i)?e||(e=!0,t()):e&&(e=!1,u=r()),u},u)},Object.assign(u,{combine:function(n,t){return e.combine(function(){for(var t=[],e=arguments.length;e--;)t[e]=arguments[e];var r=t.pop(),u=t.pop();return n.apply(void 0,t.map(function(n){return n.fn}).concat([u.fn],[r.map(function(n){return n.fn})]))},t.map(function(n){return n.stream})).fn},merge:function(){for(var n=[],t=arguments.length;t--;)n[t]=arguments[t];return e.merge.apply(e,n.map(function(n){return n.stream})).fn}});export default u;
//# sourceMappingURL=index.mjs.map
