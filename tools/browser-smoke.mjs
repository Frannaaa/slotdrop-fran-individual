// Optional maintainer tooling. No application packages, build or live database writes.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, writeFile, mkdtemp, cp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const moduleName = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(path.isAbsolute(moduleName) ? pathToFileURL(moduleName).href : moduleName);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = await mkdtemp(path.join(tmpdir(), "slotdrop-browser-smoke-"));
for (const name of ["index.html","Catalog.js","CatalogModel.js","CatalogViewModel.js","DetailViewModel.js","StartupView.js","styles.css","assets"])
  await cp(path.join(root,name),path.join(site,name),{recursive:true});
await writeFile(path.join(site,"config.js"),'export const SUPABASE_URL="https://individual-fixture.supabase.co"; export const SUPABASE_PUBLISHABLE_KEY="sb_publishable_browser_fixture";');
const fixtures = [
  ["SD-LARO-MUG","Laro Ceramics: Mug-making + painting","Pottery",3000,6,"laro-mug.webp"],
  ["SD-LARO-WHEEL","Laro Ceramics: Beginner's wheel-throwing","Pottery",3200,2,"laro-wheel.webp"],
  ["SD-BUMI-MUG","Bumi & Ashe: Mug-making workshop","Pottery",2650,0,"bumi-mug.webp"],
  ["SD-BUMI-FREEFORM","Bumi & Ashe: Free Form Pottery + Paint","Pottery",3200,5,"bumi-freeform.webp"],
  ["SD-AMT-HAND","AMT Ceramics: Hand-Building single session","Pottery",2900,4,"amt-handbuilding.webp"],
  ["SD-AMT-WHEEL","AMT Ceramics: Wheel-Throwing Exploratory single session","Pottery",2900,3,"amt-wheel.webp"],
  ["SD-SIP-PAINT","Sip & Gogh: Open Session painting","Painting",1400,8,"sip-open.webp"],
  ["SD-TAHANAN-WHEEL","Tahanan Pottery: Exploratory Wheel Workshop","Pottery",2500,6,"tahanan-wheel.webp"],
].map(([sku,name,category,price,stock,image],index)=>({id:index+1,sku,name,category,price,stock,image_url:"./assets/"+image}));
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".webp":"image/webp",".woff2":"font/woff2"};
const server=createServer(async(req,res)=>{
  const name=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=path.resolve(site,"."+(name==="/" ? "/index.html" : name));
  if(!file.startsWith(path.resolve(site)+path.sep)){res.writeHead(403).end();return;}
  try{const bytes=await readFile(file);res.writeHead(200,{"Content-Type":mime[path.extname(file)]||"application/octet-stream"});res.end(bytes);}
  catch{res.writeHead(404).end();}
});
server.listen(0,"127.0.0.1");
await new Promise(resolve=>server.once("listening",resolve));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const report={checkedAt:new Date().toISOString(),sourceCommit:process.env.GITHUB_SHA||"local working copy",
  scope:"Actual pinned React/Babel CDN scripts and HTTP pages; controlled product responses, not live Supabase or personal recording",checks:[]};
async function check(name,run){console.log("CHECK",name);try{const value=await run();report.checks.push({name,status:"passed",...(value||{})});console.log("PASS",name);return true;}
catch(error){report.checks.push({name,status:"failed",error:error.message});console.log("FAIL",name,error.message);return false;}}
const startupOnly=process.argv.includes("--startup-only");
try{
  if(!startupOnly){
    const context=await browser.newContext();
    let failAPI=false;
    await context.route(url=>url.hostname==="individual-fixture.supabase.co",async route=>{
      if(failAPI){await route.abort("failed");return;}
      const query=new URL(route.request().url()).searchParams;
      let rows=fixtures.slice();
      if(query.has("name")){const term=query.get("name").slice(7,-1).toLowerCase();rows=rows.filter(row=>row.name.toLowerCase().includes(term));}
      if(query.has("category"))rows=rows.filter(row=>row.category===query.get("category").slice(3));
      if(query.has("id"))rows=rows.filter(row=>row.id===Number(query.get("id").slice(3)));
      if(query.get("stock")==="gt.0")rows=rows.filter(row=>row.stock>0);
      rows.sort(query.get("order")?.startsWith("id.")?(a,b)=>a.id-b.id:(a,b)=>a.name.localeCompare(b.name));
      if(query.has("limit"))rows=rows.slice(0,Number(query.get("limit")));
      await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(rows)});
    });
    const p=await context.newPage();const errors=[];
    p.on("pageerror",error=>errors.push(error.message));
    const cards=p.locator(".workshop-card");
    const ready=n=>p.waitForFunction(count=>document.querySelectorAll(".workshop-card").length===count,n,{timeout:15000});
    const mounted=await check("Home and Browse mount normally despite the startup guard",async()=>{
      await p.goto(base,{waitUntil:"domcontentloaded"});
      await p.locator("#home-heading").waitFor({timeout:20000});await ready(3);
      await p.getByRole("navigation").getByRole("link",{name:"Workshops",exact:true}).click();await ready(8);
    });
    if(mounted){
      await check("Search and category query, named empty result and Clear filters",async()=>{
        await p.locator("#search").fill("Laro");await p.getByRole("button",{name:"Search",exact:true}).click();await ready(2);
        await p.locator("#category").selectOption("Painting");
        await p.getByRole("heading",{name:"No workshops found.",exact:true}).waitFor();
        assert.match(await p.locator(".state-panel").textContent(),/Laro/);
        await p.getByRole("button",{name:"Clear filters",exact:true}).click();await ready(8);
      });
      await check("Detail refresh, Back and good/unknown/malformed direct URLs",async()=>{
        const expected=await cards.first().locator("h3").textContent();
        await cards.first().getByRole("link",{name:/View workshop/}).click();await p.locator(".detail-layout").waitFor();
        assert.equal(await p.locator("#detail-heading").textContent(),expected);
        await p.reload();await p.locator(".detail-layout").waitFor();
        try{await p.goBack({waitUntil:"commit",timeout:4000});}catch(error){if(!p.url().includes("screen=browse"))throw error;}
        await ready(8);
        for(const suffix of ["&id=999999","&id=bad",""]){await p.goto(base+"/?screen=detail"+suffix);await p.getByRole("heading",{name:"We couldn't find that workshop.",exact:true}).waitFor();}
      });
      await check("API error stays in the app and Retry recovers",async()=>{
        failAPI=true;await p.goto(base+"/?screen=browse");
        await p.getByRole("heading",{name:"We couldn't load the workshops.",exact:true}).waitFor();
        assert.equal(await p.getByRole("heading",{name:"SlotDrop couldn't start.",exact:true}).count(),0);
        failAPI=false;await p.getByRole("button",{name:"Retry",exact:true}).click();await ready(8);
      });
      await check("375 px layout and clean normal-flow JavaScript",async()=>{
        await p.setViewportSize({width:375,height:812});
        assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        assert.deepEqual(errors,[]);
      });
    }
    await context.close();
  }
  for(const [name,pattern]of [["Blocked React script","**/react@18.3.1/**"],["Failed entry module","**/Catalog.js"]]){
    await check(name+" shows a readable error and working Reload",async()=>{
      const context=await browser.newContext();const p=await context.newPage();
      await p.route(pattern,route=>route.abort("failed"));
      await p.goto(base,{waitUntil:"domcontentloaded"});
      await p.getByRole("heading",{name:"SlotDrop couldn't start.",exact:true}).waitFor({timeout:22000});
      const reload=p.getByRole("button",{name:"Reload page",exact:true});assert.equal(await reload.count(),1);
      const navigation=p.waitForNavigation({waitUntil:"domcontentloaded"});
      await reload.click();await navigation;
      await p.getByRole("heading",{name:"SlotDrop couldn't start.",exact:true}).waitFor({timeout:22000});
      await context.close();
    });
  }
}finally{
 await browser.close();await new Promise(resolve=>server.close(resolve));
 const resolved=path.resolve(site);if(path.dirname(resolved)!==path.resolve(tmpdir())||!path.basename(resolved).startsWith("slotdrop-browser-smoke-"))throw Error("Unexpected temporary cleanup path");
 await rm(resolved,{recursive:true,force:true});
 report.passed=report.checks.filter(x=>x.status==="passed").length;report.failed=report.checks.filter(x=>x.status==="failed").length;
 if(startupOnly)report.scope="Startup-failure cases only; this environment blocks CDN access. No normal-flow or live Supabase claim.";
 await mkdir(path.join(root,"docs"),{recursive:true});await writeFile(path.join(root,"docs/browser-smoke.json"),JSON.stringify(report,null,2)+"\n");
 console.log(JSON.stringify(report,null,2));
}
process.exitCode=report.failed?1:0;
