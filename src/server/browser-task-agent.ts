import { chromium, type Browser, type Page } from "playwright";

export type BrowserTaskResult={success:boolean;data?:unknown;error?:string;history?:unknown[]};
let browser:Browser|null=null;
const pages=new Map<string,Page>();

async function getPage(id="default"){if(!browser)browser=await chromium.launch({headless:true});let p=pages.get(id);if(!p||p.isClosed()){p=await browser.newPage();pages.set(id,p)}return p}

export async function browserNavigate(id:string,url:string):Promise<BrowserTaskResult>{try{if(!/^https?:\/\//i.test(url))return{success:false,error:"URL_INVALID"};const p=await getPage(id);await p.goto(url,{waitUntil:"domcontentloaded",timeout:30000});return{success:true,data:{id,url:await p.url(),title:await p.title()}}}catch(e){return{success:false,error:e instanceof Error?e.message:"NAVIGATION_FAILED"}}}

export async function browserExtract(id:string,selector?:string):Promise<BrowserTaskResult>{try{const p=await getPage(id);const data=selector?await p.locator(selector).allTextContents():await p.locator("body").innerText();return{success:true,data:{url:await p.url(),text:Array.isArray(data)?data:data.slice(0,50000)}}}catch(e){return{success:false,error:e instanceof Error?e.message:"EXTRACTION_FAILED"}}}

export async function browserLinks(id:string):Promise<BrowserTaskResult>{try{const p=await getPage(id);const links=await p.locator("a[href]").evaluateAll(as=>as.slice(0,200).map(a=>({text:(a.textContent||"").trim(),href:(a as HTMLAnchorElement).href})));return{success:true,data:{url:await p.url(),links}}}catch(e){return{success:false,error:e instanceof Error?e.message:"LINK_EXTRACTION_FAILED"}}}

export async function browserSearch(id:string,query:string):Promise<BrowserTaskResult>{const url=`https://www.google.com/search?q=${encodeURIComponent(query)}`;return browserNavigate(id,url)}

export async function browserTask(id:string,steps:Array<{action:string;selector?:string;value?:string;url?:string}>):Promise<BrowserTaskResult>{const history:any[]=[];try{const p=await getPage(id);for(const [i,s] of steps.entries()){switch(s.action){case"goto":if(!s.url)throw new Error("URL_REQUIRED");await p.goto(s.url,{waitUntil:"domcontentloaded",timeout:30000});break;case"click":if(!s.selector)throw new Error("SELECTOR_REQUIRED");await p.locator(s.selector).first().click({timeout:15000});break;case"fill":if(!s.selector)throw new Error("SELECTOR_REQUIRED");await p.locator(s.selector).first().fill(s.value||"",{timeout:15000});break;case"press":if(!s.selector)throw new Error("SELECTOR_REQUIRED");await p.locator(s.selector).first().press(s.value||"Enter",{timeout:15000});break;case"wait":await p.waitForTimeout(Math.min(10000,Number(s.value)||500));break;case"extract":history.push({step:i,text:await p.locator(s.selector||"body").innerText()});continue;default:throw new Error(`ACTION_NOT_SUPPORTED:${s.action}`)}history.push({step:i,action:s.action,url:await p.url()})}return{success:true,data:{url:await p.url()},history}}catch(e){return{success:false,error:e instanceof Error?e.message:"BROWSER_TASK_FAILED",history}}}

export async function browserClose(id="default"){const p=pages.get(id);if(p){await p.close();pages.delete(id)}if(pages.size===0&&browser){await browser.close();browser=null}return{success:true}}
