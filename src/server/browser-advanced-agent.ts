import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { promises as fs } from "node:fs";
import path from "node:path";

export type BrowserAdvancedResult={success:boolean;data?:unknown;error?:string};
let browser:Browser|null=null;
const contexts=new Map<string,BrowserContext>();

async function context(id="default"){if(!browser)browser=await chromium.launch({headless:true});let c=contexts.get(id);if(!c){c=await browser.newContext({acceptDownloads:true});contexts.set(id,c)}return c}
async function page(id="default"){const c=await context(id);const pages=c.pages();return pages[0]||await c.newPage()}
export async function listTabs(id="default"):Promise<BrowserAdvancedResult>{try{const pages=(await context(id)).pages();return{success:true,data:pages.map((p,i)=>({index:i,url:p.url()}))}}catch(e){return{success:false,error:e instanceof Error?e.message:"TAB_LIST_FAILED"}}}
export async function newTab(id="default",url?:string):Promise<BrowserAdvancedResult>{try{const p=await (await context(id)).newPage();if(url){if(!/^https?:\/\//i.test(url))return{success:false,error:"URL_INVALID"};await p.goto(url,{waitUntil:"domcontentloaded",timeout:30000})}return{success:true,data:{url:p.url(),title:await p.title()}}}catch(e){return{success:false,error:e instanceof Error?e.message:"TAB_CREATE_FAILED"}}}
export async function downloadFile(id:string,url:string,destination:string):Promise<BrowserAdvancedResult>{try{const p=await page(id);const target=path.resolve(destination);await fs.mkdir(path.dirname(target),{recursive:true});const response=await p.request.get(url);if(!response.ok())return{success:false,error:`HTTP_${response.status()}`};await fs.writeFile(target,await response.body());return{success:true,data:{path:target,bytes:(await fs.stat(target)).size}}}catch(e){return{success:false,error:e instanceof Error?e.message:"DOWNLOAD_FAILED"}}}
export async function closeBrowser(id="default"){const c=contexts.get(id);if(c){await c.close();contexts.delete(id)}if(contexts.size===0&&browser){await browser.close();browser=null}return{success:true}}
