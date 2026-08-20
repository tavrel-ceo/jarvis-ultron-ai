import { promises as fs } from "node:fs";
import { inspectProject,readProjectFile,applyProjectPatch,validateProject,reviewProject,diagnoseProjectFailure } from "./development-agent";
export type PipelineResult={success:boolean;data?:unknown;error?:string};
export async function developProject(root:string,file:string,search:string,replacement:string,options:{validate?:boolean;review?:boolean;rollbackOnFailure?:boolean}={}):Promise<PipelineResult>{
 const validate=options.validate!==false,review=options.review!==false,rollback=options.rollbackOnFailure!==false;
 const inspected=await inspectProject(root);if(!inspected.success)return{success:false,error:inspected.error||"INSPECTION_FAILED"};
 const before=await readProjectFile(root,file);if(!before.success)return{success:false,error:before.error||"READ_FAILED"};
 const original=String((before.data as any).content||"");
 const patch=await applyProjectPatch(root,file,search,replacement);if(!patch.success)return{success:false,data:{stage:"patch",inspection:inspected.data},error:patch.error||"PATCH_FAILED"};
 let validation:PipelineResult={success:true,data:{skipped:true}};
 if(validate)validation=await validateProject(root);
 let reviewResult:PipelineResult={success:true,data:{skipped:true}};
 if(review)reviewResult=await reviewProject(root,[file]);
 const reviewData:any=reviewResult.data||{};const blocked=(reviewData.counts?.blocker||0)>0;
 const passed=(!validate||validation.success)&&(!review||reviewResult.success)&&!blocked;
 if(!passed&&rollback){await fs.writeFile(String((before.data as any).path),original,"utf8");}
 let diagnosis:any;
 if(!passed){const results:any=(validation.data as any)?.results||[];const failed=results.find((x:any)=>!x.success);if(failed)diagnosis=await diagnoseProjectFailure(root,failed.stage,`${failed.stderr||""}\n${failed.stdout||""}`);}
 return{success:passed,data:{inspection:inspected.data,file,patch:patch.data,validation:validation.data,review:reviewResult.data,rolledBack:!passed&&rollback,diagnosis:diagnosis?.data||null},error:passed?undefined:"DEVELOPMENT_PIPELINE_FAILED"};
}
