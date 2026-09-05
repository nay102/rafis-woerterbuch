import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

// fileURLToPath preserves spaces and Windows drive letters.
const {fileURLToPath}=await import("node:url");
const directory=fileURLToPath(new URL("../js/",import.meta.url));
const sources=new Map(fs.readdirSync(directory).filter(file=>file.endsWith(".js")).map(file=>[path.join(directory,file),fs.readFileSync(path.join(directory,file),"utf8")]));
const remoteNames=new Map();
for(const source of sources.values())for(const match of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*["'](https:[^"']+)["']/g)){
  const names=remoteNames.get(match[2])||new Set();match[1].split(",").forEach(name=>names.add(name.trim().split(/\s+as\s+/)[0]));remoteNames.set(match[2],names);
}
const modules=new Map();
function moduleFor(identifier){
  if(modules.has(identifier))return modules.get(identifier);
  const module=identifier.startsWith("https:")
    ?new vm.SyntheticModule([...(remoteNames.get(identifier)||[])],()=>{},{identifier})
    :new vm.SourceTextModule(fs.readFileSync(identifier,"utf8"),{identifier});
  modules.set(identifier,module);return module;
}
const linker=(specifier,parent)=>moduleFor(specifier.startsWith("https:")?specifier:path.resolve(path.dirname(parent.identifier),specifier));
for(const file of sources.keys()){const module=moduleFor(file);if(module.status==="unlinked")await module.link(linker);}
console.log(`Linked ${sources.size} local JavaScript modules successfully. Remote SDK imports were stubbed; no browser or network execution.`);
