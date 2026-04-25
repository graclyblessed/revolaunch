import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'revolaunch.net'

const WIDGET_JS = `(function(){
  'use strict';
  var W='https://${SITE_URL}',BASE=W;
  function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
  function getInitials(n){return n.split(' ').map(function(w){return w[0]}).join('').substring(0,2).toUpperCase();}
  function buildCard(s){
    var bg=s.logoColor?s.logoColor+'18':'#f9731618';
    var fg=s.logoColor||'#f97316';
    var logo=s.logo?'<img src="'+esc(s.logo)+'" alt="" style="width:40px;height:40px;border-radius:10px;object-fit:cover;" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'flex\\';" /><div style="display:none;width:40px;height:40px;border-radius:10px;background:'+bg+';align-items:center;justify-content:center;font-size:14px;font-weight:700;color:'+fg+';flex-shrink:0;">'+esc(getInitials(s.name))+'</div>':'<div style="width:40px;height:40px;border-radius:10px;background:'+bg+';align-items:center;justify-content:center;font-size:14px;font-weight:700;color:'+fg+';flex-shrink:0;">'+esc(getInitials(s.name))+'</div>';
    var verified=s.badgeVerified?'<span style="display:inline-flex;align-items:center;margin-left:6px;color:#22c55e;font-size:11px;font-weight:600;">✓ Verified</span>':'';
    return '<a href="'+esc(s.profileUrl)+'" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block;padding:16px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03);transition:all 0.2s;" onmouseover="this.style.borderColor=\'rgba(249,115,22,0.3)\';this.style.background=\'rgba(249,115,22,0.05)\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,0.06)\';this.style.background=\'rgba(255,255,255,0.03)\'">'+
    '<div style="display:flex;align-items:flex-start;gap:12px;">'+
    logo+
    '<div style="flex:1;min-width:0;">'+
    '<div style="display:flex;align-items:center;flex-wrap:wrap;">'+
    '<span style="font-size:14px;font-weight:700;color:#f5f5f5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(s.name)+'</span>'+
    verified+
    '</div>'+
    '<p style="font-size:12px;color:#a3a3a3;margin-top:3px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+esc(s.tagline)+'</p>'+
    '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;">'+
    '<span style="font-size:11px;color:#f97316;font-weight:600;">★ '+s.upvotes+'</span>'+
    '<span style="font-size:10px;color:#737373;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,0.05);">'+esc(s.category)+'</span>'+
    '</div>'+
    '</div>'+
    '</div>'+
    '</a>';
  }
  function render(el){
    var limit=parseInt(el.getAttribute('data-limit'))||6;
    var category=el.getAttribute('data-category')||'';
    var featured=el.getAttribute('data-featured')||'';
    var sort=el.getAttribute('data-sort')||'popular';
    var theme=el.getAttribute('data-theme')||'dark';
    var isDark=theme!=='light';
    var bg=isDark?'#0a0a0a':'#ffffff';
    var cardBg=isDark?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.02)';
    var cardBorder=isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.08)';
    var cardHoverBg=isDark?'rgba(249,115,22,0.05)':'rgba(249,115,22,0.04)';
    var cardHoverBorder='rgba(249,115,22,0.3)';
    var textColor=isDark?'#f5f5f5':'#171717';
    var subColor=isDark?'#a3a3a3':'#737373';
    var mutedColor=isDark?'#737373':'#a3a3a3';
    var pillBg=isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)';
    var wrapper=document.createElement('div');
    wrapper.style.cssText='font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:680px;border-radius:16px;overflow:hidden;background:'+bg+';border:1px solid '+(isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.1)')+';box-shadow:0 4px 24px rgba(0,0,0,0.12);';
    var header=document.createElement('div');
    header.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid '+(isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)')+';';
    header.innerHTML='<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:15px;">🚀</span><span style="font-size:13px;font-weight:700;color:'+textColor+';">Trending Startups</span></div>'+
    '<a href="'+W+'" target="_blank" rel="noopener noreferrer" style="font-size:11px;font-weight:600;color:#f97316;text-decoration:none;">View all →</a>';
    wrapper.appendChild(header);
    var body=document.createElement('div');
    body.style.cssText='padding:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px;';
    body.setAttribute('data-rl-loading','true');
    body.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:28px 16px;color:'+subColor+';font-size:13px;">Loading startups...</div>';
    wrapper.appendChild(body);
    var footer=document.createElement('div');
    footer.style.cssText='padding:10px 18px;border-top:1px solid '+(isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)')+';text-align:center;';
    footer.innerHTML='<a href="'+W+'" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:'+mutedColor+';text-decoration:none;">Powered by <span style="font-weight:700;color:#f97316;">Revolaunch</span></a>';
    wrapper.appendChild(footer);
    el.innerHTML='';
    el.appendChild(wrapper);
    var url=BASE+'/api/widget/startups?limit='+limit+'&sort='+sort;
    if(category)url+='&category='+encodeURIComponent(category);
    if(featured)url+='&featured='+featured;
    fetch(url).then(function(r){return r.json();}).then(function(data){
      if(!data.startups||!data.startups.length){
        body.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:28px 16px;color:'+subColor+';font-size:13px;">No startups found</div>';
        return;
      }
      body.innerHTML='';
      data.startups.forEach(function(s){
        var lbg=s.logoColor?s.logoColor+'18':'#f9731618';
        var lfg=s.logoColor||'#f97316';
        var logoHtml=s.logo?'<img src="'+esc(s.logo)+'" alt="" style="width:40px;height:40px;border-radius:10px;object-fit:cover;" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'flex\\';" /><div style="display:none;width:40px;height:40px;border-radius:10px;background:'+lbg+';align-items:center;justify-content:center;font-size:14px;font-weight:700;color:'+lfg+';flex-shrink:0;">'+esc(getInitials(s.name))+'</div>':'<div style="width:40px;height:40px;border-radius:10px;background:'+lbg+';align-items:center;justify-content:center;font-size:14px;font-weight:700;color:'+lfg+';flex-shrink:0;">'+esc(getInitials(s.name))+'</div>';
        var vhtml=s.badgeVerified?'<span style="display:inline-flex;align-items:center;margin-left:6px;color:#22c55e;font-size:11px;font-weight:600;">✓ Verified</span>':'';
        var a=document.createElement('a');
        a.href=s.profileUrl;a.target='_blank';a.rel='noopener noreferrer';
        a.style.cssText='text-decoration:none;display:block;padding:14px 16px;border-radius:12px;border:1px solid '+cardBorder+';background:'+cardBg+';transition:all 0.2s;';
        a.onmouseover=function(){this.style.borderColor=cardHoverBorder;this.style.background=cardHoverBg;};
        a.onmouseout=function(){this.style.borderColor=cardBorder;this.style.background=cardBg;};
        a.innerHTML='<div style="display:flex;align-items:flex-start;gap:12px;">'+
        logoHtml+
        '<div style="flex:1;min-width:0;">'+
        '<div style="display:flex;align-items:center;flex-wrap:wrap;">'+
        '<span style="font-size:14px;font-weight:700;color:'+textColor+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(s.name)+'</span>'+
        vhtml+
        '</div>'+
        '<p style="font-size:12px;color:'+subColor+';margin-top:3px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+esc(s.tagline)+'</p>'+
        '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;">'+
        '<span style="font-size:11px;color:#f97316;font-weight:600;">★ '+s.upvotes+'</span>'+
        '<span style="font-size:10px;color:'+mutedColor+';padding:2px 8px;border-radius:20px;background:'+pillBg+';">'+esc(s.category)+'</span>'+
        '</div></div></div>';
        body.appendChild(a);
      });
    }).catch(function(){
      body.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:28px 16px;color:'+subColor+';font-size:13px;">Failed to load startups</div>';
    });
  }
  function init(){
    var els=document.querySelectorAll('.revolaunch-widget');
    for(var i=0;i<els.length;i++)render(els[i]);
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}
  if(typeof MutationObserver!=='undefined'){
    new MutationObserver(function(mutations){
      var found=false;
      for(var i=0;i<mutations.length;i++){
        for(var j=0;j<mutations[i].addedNodes.length;j++){
          if(mutations[i].addedNodes[j].classList&&mutations[i].addedNodes[j].classList.contains('revolaunch-widget')){found=true;break;}
          if(mutations[i].addedNodes[j].querySelector&&mutations[i].addedNodes[j].querySelector('.revolaunch-widget')){found=true;break;}
        }
        if(found)break;
      }
      if(found)init();
    }).observe(document.documentElement,{childList:true,subtree:true});
  }
})();`

export async function GET() {
  return new Response(WIDGET_JS, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
