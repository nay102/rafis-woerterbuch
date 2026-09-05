import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";

async function fixture({owner="alice",dashboard=true,profile={}}={}) {
  const values=new Map([["rw_learning_owner_v2",owner]]),events=new EventTarget();
  let observer,remote={},calls=0,reloads=0,fail=false;
  const context=vm.createContext({Event,Date,JSON,Map,Set,Promise,console,window:events,dispatchEvent:event=>events.dispatchEvent(event),localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)},document:{getElementById:()=>dashboard?{}:null},location:{reload:()=>reloads++},setTimeout:()=>1,clearTimeout:()=>{}});
  const storage=new vm.SourceTextModule(fs.readFileSync(new URL("../js/learning-storage.js",import.meta.url),"utf8"),{context});
  await storage.link(()=>{});await storage.evaluate();
  const auth=new vm.SyntheticModule(["listenAuth","getUserProfile","syncUserLearningProgress"],function(){
    this.setExport("listenAuth",callback=>{observer=callback;});
    this.setExport("getUserProfile",async()=>profile);
    this.setExport("syncUserLearningProgress",async(user,records)=>{calls++;if(fail)throw Error("Offline");remote=storage.namespace.mergeProgressRecords(records,remote);return remote;});
  },{context});
  const sync=new vm.SourceTextModule(fs.readFileSync(new URL("../js/learning-sync.js",import.meta.url),"utf8"),{context});
  await sync.link(specifier=>specifier==="./auth-client.js"?auth:storage);await sync.evaluate();sync.namespace.initLearningSync();
  return {sync:sync.namespace,storage:storage.namespace,events,auth:(user,meta)=>observer(user,meta),remote:value=>{remote=value;},fail:()=>{fail=true;},get calls(){return calls;},get reloads(){return reloads;}};
}

test("a different authenticated account changes scope before any upload",async()=>{
  const f=await fixture();f.storage.learningStorage.setItem("rw_a1_reading_v1",'{"sessionsCompleted":4}');
  await f.auth({uid:"bob"});assert.equal(f.reloads,1);assert.equal(f.calls,0);assert.equal(f.storage.learningStorage.getItem("rw_a1_reading_v1"),null);
});
test("unavailable authentication preserves offline account progress",async()=>{
  const f=await fixture();await f.auth(null,{unavailable:true});assert.equal(f.reloads,0);assert.equal(f.storage.learningOwner(),"alice");assert.match(f.sync.learningSyncStatus,/internet/);
});
test("dashboard restores another device's progress",async()=>{
  const f=await fixture();f.remote({rw_a1_reading_v1:{value:'{"sessionsCompleted":2}',updatedAt:5}});await f.auth({uid:"alice"});
  assert.equal(JSON.parse(f.storage.learningStorage.getItem("rw_a1_reading_v1")).sessionsCompleted,2);assert.match(f.sync.learningSyncStatus,/synced/);
});
test("cloud opt-out prevents reads from being uploaded",async()=>{
  const f=await fixture({profile:{appSettings:{cloudSync:false}}});await f.auth({uid:"alice"});await f.sync.syncLearningProgress({pull:true});assert.equal(f.calls,0);assert.match(f.sync.learningSyncStatus,/turned off/);
});
test("failed sync retains local work and reports the failure",async()=>{
  const f=await fixture();f.storage.learningStorage.setItem("rw_a1_reading_v1",'{"sessionsCompleted":3}');f.fail();await f.auth({uid:"alice"});
  assert.equal(JSON.parse(f.storage.learningStorage.getItem("rw_a1_reading_v1")).sessionsCompleted,3);assert.match(f.sync.learningSyncStatus,/could not finish/);
});
test("background sync does not replace an active exercise's local snapshot",async()=>{
  const f=await fixture({dashboard:false});f.remote({rw_a1_reading_v1:{value:'{"sessionsCompleted":2}',updatedAt:5}});await f.auth({uid:"alice"});assert.equal(f.storage.learningStorage.getItem("rw_a1_reading_v1"),null);
});
