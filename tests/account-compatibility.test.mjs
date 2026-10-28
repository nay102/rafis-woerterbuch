import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const deferred = () => {let resolve;const promise=new Promise(done=>resolve=done);return{promise,resolve};};
async function fixture(){
  const profiles=new Map(),toasts=[],writes=[],values=new Map(),routes=[];let observer,fail=false;
  const node={classList:{add(){},remove(){}},replaceChildren(){},textContent:"",onclick:null};
  const defaults={theme:"system",textSize:"normal",reducedMotion:false,cloudSync:true};
  const context=vm.createContext({Event,JSON,Map,Set,Number,Array,Error,Promise,URLSearchParams,
    currentUser:null,accountViewGeneration:0,authStateResolved:false,currentAppSettings:{...defaults},
    favoriteWordIds:new Set(),learnedWordIds:new Set(),customListWordIds:{myVerbs:new Set(),examPrep:new Set()},
    wordNotesMap:{},searchHistoryItems:[],reviewSchedule:{},progressStats:{},lastContext:{},activeSectionMemory:{},
    userProfileCache:new Map(),MAX_SEARCH_HISTORY:40,AUTH_CACHE_EMAIL_KEY:"rw_cached_email",DEFAULT_APP_SETTINGS:defaults,
    window:{location:{search:""}},location:{search:""},
    localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},
    document:{getElementById:()=>node},
    listenAuth:callback=>{observer=callback;},ensureUserProfile:async()=>{},
    getUserProfile:async user=>profiles.get(user.uid)?.promise||{},touchUserLastLogin:async()=>{},
    syncAdminAccessUI(){},syncPanelLogoutVisibility(){},setHeaderAsProfileButton(){},setHeaderAsLoginButton(){},
    hydrateFavoritesFromLocal(){},hydrateLearningStateFromLocal(){},saveFavoritesToLocal(){},saveLearningStateToLocal(){},
    applyAppSettings:settings=>{context.currentAppSettings=settings;},getStoredSettings:()=>defaults,
    handleRouting(){routes.push({uid:context.currentUser?.uid||null,notes:Object.keys(context.wordNotesMap).length});},goHomeWithoutRefresh(){},
    showToast:(message,type)=>toasts.push({message,type}),
    dispatchEvent(){},
    ...Object.fromEntries(["saveUserAppSettings","saveUserFavorites","saveUserProfilePatch","saveUserWordNote"].map(name=>[name,async(user,data)=>{
      writes.push({name,uid:user.uid,data});if(fail)throw Object.assign(Error("Synthetic denial"),{code:"permission-denied"});
    }]))});
  const data=new vm.SourceTextModule(fs.readFileSync(new URL("../js/account-data.js",import.meta.url),"utf8"),{context});
  await data.link(()=>{});await data.evaluate();Object.assign(context,data.namespace);
  const source=fs.readFileSync(new URL("../js/ui.js",import.meta.url),"utf8");
  const names=["handleAuthState","hydrateAccountLearningState","persistSettingsIfNeeded","persistFavoritesIfLoggedIn",
    "persistLearningStateIfLoggedIn","persistSingleNoteIfLoggedIn","retryPendingAccount"];
  // Execute the actual function declarations, with DOM/network dependencies
  // stubbed. These functions have column-zero closing braces in the source.
  const declarations=names.map(name=>{const match=source.match(new RegExp(`(?:async )?function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?^\\}`,"m"));assert.ok(match,name);return match[0];}).join("\n");
  const api=vm.runInContext(declarations+`\n({${names.join(",")}})`,context);api.handleAuthState();
  return{api,context,profiles,toasts,writes,routes,data:data.namespace,auth:user=>observer(user),fail:()=>{fail=true;}};
}
test("late account A hydration cannot overwrite account B",async()=>{
  const f=await fixture(),a=deferred(),b=deferred();f.profiles.set("a",a);f.profiles.set("b",b);
  const first=f.auth({uid:"a",email:"a@example.invalid"});await Promise.resolve();
  const second=f.auth({uid:"b",email:"b@example.invalid"});
  assert.equal(f.routes.at(-1).uid,null);assert.equal(f.routes.at(-1).notes,0);
  b.resolve({favorites:["noun1"],notes:{noun1:"B note"}});await second;
  a.resolve({favorites:["verb1"],notes:{verb1:"A note"}});await first;
  assert.equal(f.context.currentUser.uid,"b");assert.equal(f.context.wordNotesMap.noun1,"B note");
  assert.equal(f.context.wordNotesMap.verb1,undefined);assert.equal(f.context.userProfileCache.has("a"),false);
});
test("logout prevents a pending profile read from restoring private account state",async()=>{
  const f=await fixture(),a=deferred();f.profiles.set("a",a);
  const first=f.auth({uid:"a",email:"a@example.invalid"});await Promise.resolve();await f.auth(null);
  a.resolve({favorites:["verb1"],notes:{verb1:"Private"}});await first;
  assert.equal(f.context.currentUser,null);assert.equal(f.context.favoriteWordIds.size,0);
  assert.equal(Object.keys(f.context.wordNotesMap).length,0);
});
test("a failed note save returns failure and retains the note without a success toast",async()=>{
  const f=await fixture();await f.auth({uid:"a",email:"a@example.invalid"});f.fail();
  assert.equal(await f.api.persistSingleNoteIfLoggedIn("verb1","Keep this"),false);
  assert.equal(f.data.pendingAccount("a").notes.verb1,"Keep this");
  assert.equal(f.toasts.at(-1).type,"error");assert.match(f.toasts.at(-1).message,/retained/);
});
test("failed favorites and learning saves retain per-account pending snapshots",async()=>{
  const f=await fixture();await f.auth({uid:"a",email:"a@example.invalid"});f.fail();
  f.context.favoriteWordIds.add("verb1");f.context.learnedWordIds.add("noun1");
  assert.equal(await f.api.persistFavoritesIfLoggedIn(),false);assert.equal(await f.api.persistLearningStateIfLoggedIn(),false);
  assert.equal(f.data.pendingAccount("a").favorites[0],"verb1");
  assert.equal(f.data.pendingAccount("a").learnedWords[0],"noun1");assert.equal(f.data.pendingAccount("b").favorites,undefined);
});
test("pending notes survive hydration and a retry failure while other cloud notes are preserved",async()=>{
  const f=await fixture(),a=deferred();f.profiles.set("a",a);f.fail();
  f.data.retainAccountPatch("a",{notes:{verb1:"Unsynced edit"}});
  const pending=f.auth({uid:"a",email:"a@example.invalid"});
  a.resolve({notes:{verb1:"Cloud old",noun1:"Cloud other"}});await pending;
  assert.equal(f.context.wordNotesMap.verb1,"Unsynced edit");assert.equal(f.context.wordNotesMap.noun1,"Cloud other");
  assert.equal(f.data.pendingAccount("a").notes.verb1,"Unsynced edit");
});
test("cloud-sync opt-out is persisted and blocks pending content uploads",async()=>{
  const f=await fixture();await f.auth({uid:"a",email:"a@example.invalid"});
  f.context.currentAppSettings.cloudSync=false;
  assert.equal(await f.api.persistSettingsIfNeeded(),true);
  f.context.favoriteWordIds.add("verb1");await f.api.persistFavoritesIfLoggedIn();
  const before=f.writes.length;await f.api.retryPendingAccount(f.context.currentUser);
  assert.equal(f.writes.length,before);assert.equal(f.data.pendingAccount("a").favorites[0],"verb1");
  assert.equal(f.writes.find(write=>write.name==="saveUserAppSettings").data.cloudSync,false);
});
