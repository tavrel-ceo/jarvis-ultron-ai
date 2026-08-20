import type { Browser, BrowserContext, Page } from "playwright";
let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;
async function engine(){try{return await import("playwright")}catch{return null}}
export async function browserOpen(url:string){const pw=await engine();if(!pw)return{success:false,error:"PLAYWRIGHT_NOT_INSTALLED"};if(!browser)browser=await pw.chromium.launch({headless:true});if(!context)context=await browser.newContext();page=page||await context.newPage();await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});return{success:true,data:{url:page.url(),title:await page.title()}}}
export async function browserSnapshot(){if(!page)return{success:false,error:"BROWSER_NOT_STARTED"};return{success:true,data:{url:page.url(),title:await page.title(),text:(await page.locator("body").innerText()).slice(0,30000)}}}
export async function browserClick(selector:string){if(!page)return{success:false,error:"BROWSER_NOT_STARTED"};await page.locator(selector).first().click({timeout:15000});return{success:true,data:{url:page.url(),title:await page.title()}}}
export async function browserFill(selector:string,value:string){if(!page)return{success:false,error:"BROWSER_NOT_STARTED"};await page.locator(selector).first().fill(value,{timeout:15000});return{success:true,data:{selector}}}
export async function browserPress(selector:string,key:string){if(!page)return{success:false,error:"BROWSER_NOT_STARTED"};await page.locator(selector).first().press(key,{timeout:15000});return{success:true,data:{url:page.url()}}}
export async function browserLinks(){if(!page)return{success:false,error:"BROWSER_NOT_STARTED"};const links=await page.locator("a").evaluateAll(as=>as.slice(0,200).map(a=>({text:(a.textContent||"").trim(),href:(a as HTMLAnchorElement).href})));return{success:true,data:{links}}}
export async function browserScreenshot(path:string){if(!page)return{success:false,error:"BROWSER_NOT_STARTED"};await page.screenshot({path,fullPage:true});return{success:true,data:{path}}}
export async function browserClose(){if(browser)await browser.close();browser=null;context=null;page=null;return{success:true,data:{closed:true}}}
