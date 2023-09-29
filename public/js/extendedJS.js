let HexToRGB=function(a){let e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(a);return e?[parseInt(e[1],16),parseInt(e[2],16),parseInt(e[3],16)]:null};
let RGBToHex=function(n){return"#"+((1<<24)+(n[0]<<16)+(n[1]<<8)+n[2]).toString(16).slice(1)};
let RGBToHSL=function(a){let e,r,c=a[0]/255,s=a[1]/255,t=a[2]/255,i=Math.max(c,s,t),n=Math.min(c,s,t),h=(i+n)/2;if(i==n)e=r=0;else{let v=i-n;switch(r=h>.5?v/(2-i-n):v/(i+n),i){case c:e=(s-t)/v+(s<t?6:0);break;case s:e=(t-c)/v+2;break;case t:e=(c-s)/v+4}e/=6}return[e,r,h]};
let HSLToRGB=function(r){let n=r[2];if(0==r[1])return[n=Math.round(255*n),n,n];{function t(r,n,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?r+6*(n-r)*t:t<.5?n:t<2/3?r+(n-r)*(2/3-t)*6:r}let u=r[1],a=n<.5?n*(1+u):n+u-n*u,o=2*n-a,d=t(o,a,r[0]+1/3),h=t(o,a,r[0]),M=t(o,a,r[0]-1/3);return[Math.round(255*d),Math.round(255*h),Math.round(255*M)]}};
let lerpHSL=function(o,H,e){arguments.length<3&&(e=.5);for(let r=RGBToHSL(HexToRGB(o)),B=RGBToHSL(HexToRGB(H)),G=0;G<3;G++)r[G]+=e*(B[G]-r[G]);return RGBToHex(HSLToRGB(r))};
let lerpHex=function(e,r,a){let n=parseInt(e.replace(/#/g,""),16),t=n>>16,p=n>>8&255,c=255&n,l=parseInt(r.replace(/#/g,""),16);return"#"+((1<<24)+(t+a*((l>>16)-t)<<16)+(p+a*((l>>8&255)-p)<<8)+(c+a*((255&l)-c))|0).toString(16).slice(1)};

let lerp=function(r,n,e){return(1-e)*r+e*n};
let clamp=function(t,e,l){let n=t;return n<e?n=e:n>l&&(n=l),n};

let txtToSHA256=function r(t){function n(r,t){return r>>>t|r<<32-t}for(var o,e,f=Math.pow,h=f(2,32),a="",l=[],g=8*t.length,c=r.h=r.h||[],i=r.k=r.k||[],u=i.length,v={},s=2;u<64;s++)if(!v[s]){for(o=0;o<313;o+=s)v[o]=s;c[u]=f(s,.5)*h|0,i[u++]=f(s,1/3)*h|0}for(t+="";t.length%64-56;)t+="\0";for(o=0;o<t.length;o++){if((e=t.charCodeAt(o))>>8)return;l[o>>2]|=e<<(3-o)%4*8}for(l[l.length]=g/h|0,l[l.length]=g,e=0;e<l.length;){var k=l.slice(e,e+=16),d=c;for(c=c.slice(0,8),o=0;o<64;o++){var p=k[o-15],w=k[o-2],A=c[0],C=c[4],M=c[7]+(n(C,6)^n(C,11)^n(C,25))+(C&c[5]^~C&c[6])+i[o]+(k[o]=o<16?k[o]:k[o-16]+(n(p,7)^n(p,18)^p>>>3)+k[o-7]+(n(w,17)^n(w,19)^w>>>10)|0);(c=[M+((n(A,2)^n(A,13)^n(A,22))+(A&c[1]^A&c[2]^c[1]&c[2]))|0].concat(c))[4]=c[4]+M|0}for(o=0;o<8;o++)c[o]=c[o]+d[o]|0}for(o=0;o<8;o++)for(e=3;e+1;e--){var S=c[o]>>8*e&255;a+=(S<16?0:"")+S.toString(16)}return a};


let randomBase16 = function(pNumber = 1) {
	let base16 = "0123456789ABCDEF";
	let output = "";
	for (let i = 1; i <= pNumber; i++) {
		output += base16[(Math.round(Math.random() * (base16.length - 1)))];
	}
	return output;
}

let patternToString = function(pPattern, pSearch, pReplace) {
	let regex = new RegExp(pSearch, "g");
	return pPattern.replace(regex, pReplace);
}

let patternToBase16 = function(pPattern, pSearch) {
	let result = "";
	for (let i = 0; i < pPattern.length; i++) {
		if (pPattern[i] === pSearch) {
			result += randomBase16();
		} else {
			result += pPattern[i];
		}
	}
	return result;
}